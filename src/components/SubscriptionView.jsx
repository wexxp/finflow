import { useEffect, useRef, useState } from 'react'
import { Check, Zap, Shield, TrendingUp, RefreshCw } from 'lucide-react'
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

export default function SubscriptionView({ userEmail }) {
  const buttonRef = useRef(null)
  const [paypalReady, setPaypalReady] = useState(false)
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
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
  }, [])

  useEffect(() => {
    if (!paypalReady || !buttonRef.current) return
    if (buttonRef.current.children.length > 0) return

    window.paypal.Buttons({
      style: { shape: 'rect', color: 'blue', layout: 'vertical', label: 'subscribe' },
      createSubscription: (data, actions) => actions.subscription.create({ plan_id: PLAN_ID }),
      onApprove: (data) => {
        setSubscribed(true)
      }
    }).render(buttonRef.current)
  }, [paypalReady])

  if (subscribed) {
    return (
      <div className="sub-view">
        <div className="sub-success">
          <div className="sub-success-icon">🎉</div>
          <h2>Merci pour ton abonnement !</h2>
          <p>Tu as maintenant accès à toutes les fonctionnalités d'ICEdep Premium.</p>
        </div>
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

        <p className="sub-secure">🔒 Paiement sécurisé via PayPal</p>
      </div>
    </div>
  )
}
