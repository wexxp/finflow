import { Zap, ArrowRight, TrendingUp, RefreshCw, Target, BarChart2, Shield, Wallet } from 'lucide-react'
import './LandingPage.css'

const FEATURES = [
  { icon: '💸', title: 'Budget mensuel', desc: 'Suis tes dépenses et revenus mois par mois. Ajoute des récurrents automatiques et visualise où va ton argent.' },
  { icon: '🔄', title: 'Suivi des reventes', desc: 'Entre ton prix d\'achat, tes frais et ton prix de vente. ICEdep calcule ta marge et ton bénéfice automatiquement.' },
  { icon: '🎯', title: 'Objectifs d\'épargne', desc: 'Définis des projets (vacances, achat...) et suis ta progression vers chaque objectif mois après mois.' },
  { icon: '📊', title: 'Vue annuelle', desc: 'Visualise l\'évolution de ton solde sur toute l\'année avec des graphiques clairs et ton score de santé financière.' },
  { icon: '⚡', title: 'Revenus récurrents', desc: 'Configure ton salaire, ton loyer une seule fois. Ils apparaissent automatiquement chaque nouveau mois.' },
  { icon: '🧊', title: 'Dépenses froides', desc: 'ICEdep t\'aide à garder la tête froide sur tes finances — des décisions réfléchies, pas impulsives.' },
]

const TESTIMONIALS = [
  { text: 'Je fais de la revente depuis 2 ans et c\'est la première fois que j\'arrive vraiment à suivre mes marges. Simple et efficace.', author: 'Gabriel', role: 'Revendeur Vinted & Leboncoin', stars: 5 },
  { text: 'Enfin une alternative à Excel qui est belle et intuitive. Mon budget mensuel je le gère en 2 minutes maintenant.', author: 'Alexandre', role: 'Étudiant', stars: 5 },
  { text: 'Le suivi des articles en attente de revente c\'est exactement ce qu\'il me fallait. J\'aurais payé bien plus que 4,99€.', author: 'Sasa', role: 'Revendeur sneakers', stars: 5 },
]

export default function LandingPage({ onLogin, onRegister }) {
  return (
    <div className="landing">
      {/* NAV */}
      <nav className="landing-nav">
        <div className="landing-nav-brand">
          <span className="dot">◈</span>
          <span>ICEdep</span>
        </div>
        <div className="landing-nav-links">
          <button className="nav-link" onClick={() => document.getElementById('features').scrollIntoView({ behavior:'smooth' })}>Fonctionnalités</button>
          <button className="nav-link" onClick={() => document.getElementById('pricing').scrollIntoView({ behavior:'smooth' })}>Tarifs</button>
          <button className="nav-btn-outline" onClick={onLogin}>Se connecter</button>
          <button className="nav-btn-primary" onClick={onRegister}>Commencer gratuitement</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero fade-up">
        <div className="hero-badge">
          <Zap size={13}/> Gérez vos finances intelligemment
        </div>
        <h1 className="hero-title">
          Gardez la tête <span className="accent">froide</span><br/>sur votre argent
        </h1>
        <p className="hero-subtitle">
          ICEdep c'est le gestionnaire de finances pensé pour les revendeurs et ceux qui veulent vraiment maîtriser leur budget — sans la complexité d'Excel.
        </p>
        <div className="hero-cta">
          <button className="btn-primary-lg" onClick={onRegister}>
            Créer mon compte gratuit <ArrowRight size={18}/>
          </button>
          <button className="btn-ghost-lg" onClick={onLogin}>
            J'ai déjà un compte
          </button>
        </div>
        <p className="hero-note">✓ Gratuit pour démarrer &nbsp;·&nbsp; ✓ Aucune carte requise &nbsp;·&nbsp; ✓ Données sécurisées</p>
      </section>

      {/* STATS */}
      <div className="stats-row">
        <div className="stat"><div className="stat-val">8+</div><div className="stat-label">Utilisateurs actifs</div></div>
        <div className="stat"><div className="stat-val">100%</div><div className="stat-label">Données sécurisées</div></div>
        <div className="stat"><div className="stat-val">4,99€</div><div className="stat-label">Par mois seulement</div></div>
        <div className="stat"><div className="stat-val">0€</div><div className="stat-label">Pour commencer</div></div>
      </div>

      {/* FEATURES */}
      <section className="features-section" id="features">
        <div className="section-label">Fonctionnalités</div>
        <h2 className="section-title">Tout ce qu'il vous faut,<br/>rien de superflu</h2>
        <p className="section-sub">ICEdep a été conçu par et pour des revendeurs. Chaque fonctionnalité répond à un vrai besoin.</p>
        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="feature-card fade-up" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section className="pricing-section" id="pricing">
        <div className="section-label" style={{ textAlign:'center' }}>Tarifs</div>
        <h2 className="section-title" style={{ textAlign:'center' }}>Simple et transparent</h2>
        <p className="section-sub" style={{ margin:'0 auto 0', textAlign:'center' }}>Commencez gratuitement, passez Premium quand vous êtes prêt.</p>
        <div className="pricing-cards">
          <div className="pricing-card">
            <div className="pricing-name">Gratuit</div>
            <div className="pricing-price">0€</div>
            <div className="pricing-period">pour toujours</div>
            <div className="pricing-features">
              <div className="pricing-feature"><span className="check">✓</span> Tableau de bord</div>
              <div className="pricing-feature"><span className="check">✓</span> Gestion du budget</div>
              <div className="pricing-feature"><span className="check">✓</span> Revenus récurrents</div>
              <div className="pricing-feature" style={{ opacity:.4 }}>✗ Suivi des reventes</div>
              <div className="pricing-feature" style={{ opacity:.4 }}>✗ Vue annuelle</div>
              <div className="pricing-feature" style={{ opacity:.4 }}>✗ Objectifs d'épargne</div>
            </div>
            <button className="pricing-btn outline" onClick={onRegister}>Commencer gratuitement</button>
          </div>

          <div className="pricing-card featured">
            <div className="pricing-badge">⭐ Premium</div>
            <div className="pricing-name">Premium</div>
            <div className="pricing-price">4,99€</div>
            <div className="pricing-period">par mois · résiliable à tout moment</div>
            <div className="pricing-features">
              <div className="pricing-feature"><span className="check">✓</span> Tout le plan Gratuit</div>
              <div className="pricing-feature"><span className="check">✓</span> Suivi des reventes + marges</div>
              <div className="pricing-feature"><span className="check">✓</span> Vue annuelle & graphiques</div>
              <div className="pricing-feature"><span className="check">✓</span> Objectifs d'épargne</div>
              <div className="pricing-feature"><span className="check">✓</span> Articles en attente de vente</div>
              <div className="pricing-feature"><span className="check">✓</span> Plateformes personnalisables</div>
            </div>
            <button className="pricing-btn solid" onClick={onRegister}>Démarrer l'essai</button>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="testimonials-section">
        <div className="section-label">Témoignages</div>
        <h2 className="section-title">Ils utilisent ICEdep</h2>
        <div className="testimonials-grid">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="testimonial-card">
              <div className="stars">{'★'.repeat(t.stars)}</div>
              <p className="testimonial-text">"{t.text}"</p>
              <div className="testimonial-author">{t.author}</div>
              <div className="testimonial-role">{t.role}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="cta-section">
        <h2 className="cta-title">Prêt à garder la tête<br/>froide sur vos finances ?</h2>
        <p className="cta-sub">Rejoignez ICEdep gratuitement — aucune carte requise.</p>
        <button className="btn-primary-lg" style={{ margin:'0 auto' }} onClick={onRegister}>
          Créer mon compte gratuit <ArrowRight size={18}/>
        </button>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div style={{ display:'flex',alignItems:'center',gap:8 }}>
          <span style={{ color:'var(--accent)' }}>◈</span>
          <span style={{ fontFamily:'var(--font-display)',fontSize:16 }}>ICEdep</span>
        </div>
        <span>© 2026 ICEdep — Tous droits réservés</span>
        <span>Fait avec 🧊 en France</span>
      </footer>
    </div>
  )
}
