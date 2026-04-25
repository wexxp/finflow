const https = require('https')

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

async function setUserPremium(email, isPremium) {
  const url = `${process.env.SUPABASE_URL}/rest/v1/profiles?email=eq.${encodeURIComponent(email)}`
  return new Promise((resolve) => {
    const body = JSON.stringify({ is_premium: isPremium })
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

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end()

  let body = ''
  await new Promise(resolve => {
    req.on('data', chunk => body += chunk)
    req.on('end', resolve)
  })

  // Verify webhook signature
  const isValid = await verifyPayPalWebhook(body, req.headers)
  if (!isValid) {
    console.log('Invalid PayPal webhook signature')
    return res.status(400).json({ error: 'Invalid signature' })
  }

  const event = JSON.parse(body)
  const eventType = event.event_type

  console.log('PayPal webhook received:', eventType)

  // Subscription activated or payment completed
  if (eventType === 'BILLING.SUBSCRIPTION.ACTIVATED' || 
      eventType === 'PAYMENT.SALE.COMPLETED') {
    const email = event.resource?.subscriber?.email_address || 
                  event.resource?.payer?.email_address
    if (email) {
      await setUserPremium(email, true)
      console.log('Premium activated for:', email)
    }
  }

  // Subscription cancelled or suspended
  if (eventType === 'BILLING.SUBSCRIPTION.CANCELLED' || 
      eventType === 'BILLING.SUBSCRIPTION.SUSPENDED' ||
      eventType === 'BILLING.SUBSCRIPTION.EXPIRED') {
    const email = event.resource?.subscriber?.email_address
    if (email) {
      await setUserPremium(email, false)
      console.log('Premium deactivated for:', email)
    }
  }

  res.status(200).json({ received: true })
}
