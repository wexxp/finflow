import { useEffect, useRef, useState } from 'react'
import { Check, Zap, Shield, TrendingUp, RefreshCw, ExternalLink, Sparkles } from 'lucide-react'
import './SubscriptionView.css'

const PLAN_ID = 'P-7Y373755ED226545YNHWAAGY'
const CLIENT_ID = 'ARXywqqKhNe42d9jabekG_hiV6QtH7wkDL5hooFZETC55-vlB-yS8Bf_dNyR4ytCVOd59NsjLTFLxXk3'

const FEATURES = [
  { icon: TrendingUp, text: 'Suivi illimité des dépenses et revenus' },
  { icon: RefreshCw,  text: 'Suivi des reventes avec calcul de marge' },
  { icon: Shield,     text: 'Données sécurisées et synchronisées' },
  { icon: Zap,        text: 'Sessions mensuelles et vue annuelle' },
  { icon: Check,      text: 'Objectifs d\'épargne personnalisés' },
  { icon: Check,      text: 'Catégories et plateformes personnalisables' },
]

export default function SubscriptionView({ userId, userEmail, isPremium, isAdmin, refreshProfile }) {
  const buttonRef = useRef(null)
  const [paypalReady, setPaypalReady] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [paymentError, setPaymentError] = useState('')

  // Vue dédiée pour les utilisateurs déjà Premium / Admin (pas de paywall)
  const alreadyActive = isPremium || isAdmin

  useEffect(() => {
    if (alreadyActive) return // pas besoin de PayPal
    if (document.getElementById('paypal-sdk')) {
      setPaypalReady(true)
      return
    }
    const script = document.createElement('script')
    script.id = 'paypal-sdk'
    script.src = `https://www.paypal.com/sdk/js?client-id=${CLIENT_ID}&vault=true&intent=subscription`
    script.setAttribute('data-sdk-integration-source', 'button-factory')
    script.onload = () => setPaypalReady(true)
    document.body.appendChild(script)
  }, [alreadyActive])

  useEffect(() => {
    if (alreadyActive) return
    if (!paypalReady || !buttonRef.current) return
    if (buttonRef.current.children.length > 0) return

    window.paypal.Buttons({
      style: { shape: 'rect', color: 'blue', layout: 'vertical', label: 'subscribe' },
      createSubscription: (_data, actions) =>
        actions.subscription.create({
          plan_id: PLAN_ID,
          // ⬇️ Indispensable : permet au webhook PayPal d'identifier l'utilisateur ICEdep
          custom_id: userId,
          subscriber: {
            email_address: userEmail,
          },
        }),
      onApprove: () => {
        setSubscribed(true)
        // Tente de rafraîchir le profil 8s plus tard, le temps que le webhook
        // PayPal active Premium côté Supabase
        setTimeout(() => { refreshProfile && refreshProfile() }, 8000)
        setTimeout(() => { refreshProfile && refreshProfile() }, 20000)
      },
      onCancel: () => {
        setPaymentError('Paiement annulé. Vous pouvez réessayer quand vous voulez.')
      },
      onError: (err) => {
        console.error('PayPal error:', err)
        setPaymentError('Une erreur est survenue avec PayPal. Réessayez ou contactez-nous si le problème persiste.')
      },
    }).render(buttonRef.current)
  }, [paypalReady, alreadyActive, userId, userEmail, refreshProfile])

  if (subscribed) {
    return (
      <div className="sub-view">
        <div className="sub-success">
          <div className="sub-success-icon">🎉</div>
          <h2>Merci pour ton abonnement !</h2>
          <p>Le paiement est validé. L'activation Premium se fait automatiquement dans les prochaines secondes.</p>
          <p style={{ marginTop: 12, fontSize: 13, color: 'var(--text3)' }}>
            Si Premium n'apparaît pas dans 1 minute, recharge la page (Ctrl+R). Tu peux aussi nous contacter avec ton email PayPal pour qu'on l'active manuellement.
          </p>
        </div>
      </div>
    )
  }

  if (alreadyActive) {
    return (
      <div className="sub-view">
        <div className="sub-header fade-up">
          <div className="sub-badge gold-badge">
            <Zap size={12} style={{ marginRight: 4 }}/> {isAdmin ? 'Accès Administrateur' : 'Premium actif'}
          </div>
          <h1 className="sub-title">
            <Sparkles size={26} style={{ verticalAlign: '-3px', marginRight: 8, color: 'var(--gold)' }}/>
            Tu profites de tout
          </h1>
          <p className="sub-desc">Toutes les fonctionnalités ICEdep sont débloquées sur ton compte.</p>
        </div>

        <div className="sub-card sub-card-active fade-up stagger-1">
          <div className="sub-active-row">
            <div className="sub-active-icon">⭐</div>
            <div className="sub-active-info">
              <div className="sub-active-label">Abonnement</div>
              <div className="sub-active-value">{isAdmin ? 'Compte administrateur' : 'ICEdep Premium · 4,99€ / mois'}</div>
              <div className="sub-active-email">{userEmail}</div>
            </div>
          </div>

          <div className="sub-features">
            {FEATURES.map((f, i) => (
              <div key={i} className="sub-feature">
                <div className="sub-feature-icon active"><Check size={14}/></div>
                <span>{f.text}</span>
              </div>
            ))}
          </div>

          {!isAdmin && (
            <a
              className="sub-manage-link"
              href="https://www.paypal.com/myaccount/autopay/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Gérer mon abonnement sur PayPal <ExternalLink size={13}/>
            </a>
          )}
        </div>

        <p className="sub-thanks">Merci de soutenir ICEdep 💜</p>
      </div>
    )
  }

  return (
    <div className="sub-view">
      <div className="sub-header fade-up">
        <div className="sub-badge">Premium</div>
        <h1 className="sub-title">Passe à ICEdep Premium</h1>
        <p className="sub-desc">Prends le contrôle total de tes finances et de tes reventes</p>
      </div>

      <div className="sub-card fade-up stagger-1">
        <div className="sub-price">
          <span className="sub-amount">4,99€</span>
          <span className="sub-period">/ mois</span>
        </div>
        <p className="sub-cancel">Résiliable à tout moment</p>

        <div className="sub-features">
          {FEATURES.map((f, i) => (
            <div key={i} className="sub-feature">
              <div className="sub-feature-icon"><Check size={14}/></div>
              <span>{f.text}</span>
            </div>
          ))}
        </div>

        <div className="sub-paypal-wrap">
          {!paypalReady && <div className="sub-loading">Chargement du paiement…</div>}
          <div ref={buttonRef}/>
        </div>

        {paymentError && (
          <div style={{
            margin: '10px 0',
            padding: '10px 14px',
            background: 'var(--red-bg)',
            color: 'var(--red)',
            borderRadius: 'var(--radius)',
            fontSize: 13,
            border: '1px solid rgba(248,113,113,0.3)',
          }}>
            {paymentError}
          </div>
        )}

        <p className="sub-secure">🔒 Paiement sécurisé via PayPal</p>
      </div>
    </div>
  )
}
