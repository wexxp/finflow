import { Lock, Zap } from 'lucide-react'
import './LockedView.css'

export default function LockedView({ featureName, setActiveTab }) {
  return (
    <div className="locked-view">
      <div className="locked-card fade-up">
        <div className="locked-icon">
          <Lock size={40} />
        </div>
        <h2 className="locked-title">Fonctionnalité Premium</h2>
        <p className="locked-desc">
          <strong>{featureName}</strong> est réservé aux abonnés Premium.<br/>
          Passe à Premium pour débloquer cette fonctionnalité et bien plus encore.
        </p>
        <div className="locked-features">
          <div className="locked-feature">🔄 Suivi des reventes avec calcul de marge</div>
          <div className="locked-feature">📊 Vue annuelle de tes finances</div>
          <div className="locked-feature">🎯 Objectifs d'épargne personnalisés</div>
        </div>
        <button className="locked-btn" onClick={() => setActiveTab('subscription')}>
          <Zap size={16} /> Passer Premium — 4,99€/mois
        </button>
        <p className="locked-cancel">Résiliable à tout moment</p>
      </div>
    </div>
  )
}
