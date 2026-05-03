const https = require('https')

// ════════════════════════════════════════════════════════════
// Vérification de la signature PayPal
// ════════════════════════════════════════════════════════════
async function verifyPayPalWebhook(body, headers) {
  const verificationData = JSON.stringify({
    auth_algo: headers['paypal-auth-algo'],
    cert_url: headers['paypal-cert-url'],
    transmission_id: headers['paypal-transmission-id'],
    transmission_sig: headers['paypal-transmission-sig'],
    transmission_time: headers['paypal-transmission-time'],
    webhook_id: process.env.PAYPAL_WEBHOOK_ID,
    webhook_event: JSON.parse(body),
  })

  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api-m.paypal.com',
      path: '/v1/notifications/verify-webhook-signature',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString('base64')}`,
      }
    }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const result = JSON.parse(data)
          resolve(result.verification_status === 'SUCCESS')
        } catch { resolve(false) }
      })
    })
    req.on('error', () => resolve(false))
    req.write(verificationData)
    req.end()
  })
}

// ════════════════════════════════════════════════════════════
// Mise à jour Supabase : par userId (priorité) ou email (fallback)
// ════════════════════════════════════════════════════════════
async function setUserPremiumById(userId, isPremium) {
  if (!userId) return false
  const url = `${process.env.SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`
  return supabasePatch(url, { is_premium: isPremium })
}

async function setUserPremiumByEmail(email, isPremium) {
  if (!email) return false
  // L'email n'existe pas dans `profiles` — on doit d'abord récupérer l'id depuis auth.users
  const userId = await getUserIdByEmail(email)
  if (!userId) {
    console.log('No user found for email:', email)
    return false
  }
  return setUserPremiumById(userId, isPremium)
}

async function getUserIdByEmail(email) {
  // Utilise l'API admin de Supabase pour chercher dans auth.users
  const url = `${process.env.SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`
  return new Promise((resolve) => {
    const req = https.request(url, {
      method: 'GET',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
      }
    }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          const user = json?.users?.[0] || (Array.isArray(json) ? json[0] : null)
          resolve(user?.id || null)
        } catch { resolve(null) }
      })
    })
    req.on('error', () => resolve(null))
    req.end()
  })
}

function supabasePatch(url, payload) {
  return new Promise((resolve) => {
    const body = JSON.stringify(payload)
    const req = https.request(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        'Prefer': 'return=minimal',
      }
    }, (res) => {
      res.on('data', () => {})
      res.on('end', () => resolve(res.statusCode < 300))
    })
    req.on('error', () => resolve(false))
    req.write(body)
    req.end()
  })
}

// ════════════════════════════════════════════════════════════
// Handler principal
// ════════════════════════════════════════════════════════════
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end()

  let body = ''
  await new Promise(resolve => {
    req.on('data', chunk => body += chunk)
    req.on('end', resolve)
  })

  // Vérification de la signature
  const isValid = await verifyPayPalWebhook(body, req.headers)
  if (!isValid) {
    console.log('Invalid PayPal webhook signature')
    return res.status(400).json({ error: 'Invalid signature' })
  }

  const event = JSON.parse(body)
  const eventType = event.event_type
  const resource = event.resource || {}

  console.log('PayPal webhook received:', eventType)

  // Récupère l'identifiant utilisateur :
  // 1. custom_id = userId Supabase (envoyé par notre frontend) → priorité
  // 2. fallback email PayPal du subscriber/payer
  const customId = resource.custom_id || resource.custom
  const email =
    resource.subscriber?.email_address ||
    resource.payer?.email_address ||
    resource.payment_source?.paypal?.email_address ||
    null

  // ── Activations ──────────────────────────────────────────
  const ACTIVATE_EVENTS = [
    'BILLING.SUBSCRIPTION.ACTIVATED',
    'BILLING.SUBSCRIPTION.CREATED',
    'PAYMENT.SALE.COMPLETED',
  ]
  if (ACTIVATE_EVENTS.includes(eventType)) {
    let success = false
    if (customId) {
      success = await setUserPremiumById(customId, true)
      console.log(`Premium activation by custom_id (${customId}):`, success)
    }
    if (!success && email) {
      success = await setUserPremiumByEmail(email, true)
      console.log(`Premium activation fallback by email (${email}):`, success)
    }
    if (!success) {
      console.error('Premium activation FAILED — neither custom_id nor email matched')
    }
  }

  // ── Désactivations ───────────────────────────────────────
  const DEACTIVATE_EVENTS = [
    'BILLING.SUBSCRIPTION.CANCELLED',
    'BILLING.SUBSCRIPTION.SUSPENDED',
    'BILLING.SUBSCRIPTION.EXPIRED',
    'PAYMENT.SALE.REFUNDED',
  ]
  if (DEACTIVATE_EVENTS.includes(eventType)) {
    let success = false
    if (customId) {
      success = await setUserPremiumById(customId, false)
      console.log(`Premium deactivation by custom_id (${customId}):`, success)
    }
    if (!success && email) {
      success = await setUserPremiumByEmail(email, false)
      console.log(`Premium deactivation fallback by email (${email}):`, success)
    }
  }

  res.status(200).json({ received: true })
}
