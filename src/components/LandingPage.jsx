import { useEffect, useState } from 'react'
import {
  ArrowRight, Sparkles, Brain, Wallet, Target, BarChart3,
  RefreshCw, Zap, Shield, Check
} from 'lucide-react'
import './LandingPage.css'

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

export default function LandingPage({ onLogin, onRegister }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="landing">
      {/* ── Aurora background (3 orbes radiaux qui dérivent lentement) ── */}
      <div className="aurora-bg" aria-hidden="true">
        <div className="aurora aurora-1" />
        <div className="aurora aurora-2" />
        <div className="aurora aurora-3" />
      </div>

      {/* Grain subtil */}
      <div className="noise" aria-hidden="true" />

      {/* ════════ NAV ════════ */}
      <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-brand">
          <span className="brand-icon">◈</span>
          <span className="brand-name">ICEdep</span>
        </div>
        <div className="nav-mid">
          <button className="nav-link" onClick={() => scrollToId('features')}>Fonctionnalités</button>
          <button className="nav-link" onClick={() => scrollToId('pricing')}>Tarifs</button>
        </div>
        <div className="nav-actions">
          <button className="btn-ghost-sm" onClick={onLogin}>Connexion</button>
          <button className="btn-primary-sm" onClick={onRegister}>
            Démarrer <ArrowRight size={13}/>
          </button>
        </div>
      </nav>

      {/* ════════ HERO ════════ */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-eyebrow">
            <span className="eyebrow-dot" />
            <span>Gérez vos finances intelligemment</span>
          </div>

          <h1 className="hero-title">
            Gardez la <span className="hero-title-em">tête froide</span><br/>
            sur vos dépenses.
          </h1>

          <p className="hero-sub">
            ICEdep, c'est le gestionnaire de finances pensé pour les revendeurs et ceux qui veulent vraiment maîtriser leur budget — sans la complexité d'Excel.
          </p>

          <div className="hero-cta-row">
            <button className="btn-primary-lg" onClick={onRegister}>
              Commencer gratuitement
              <ArrowRight size={16}/>
            </button>
            <button className="btn-ghost-lg" onClick={onLogin}>J'ai déjà un compte</button>
          </div>

          <div className="trust-badges">
            <span className="trust-badge"><Check size={11}/> Aucune CB requise</span>
            <span className="trust-badge"><Shield size={11}/> Données chiffrées</span>
            <span className="trust-badge"><Zap size={11}/> Setup en 2 min</span>
          </div>
        </div>

        <div className="hero-mockup">
          <DashboardMockup />
        </div>
      </section>

      {/* ════════ FEATURES (Bento) ════════ */}
      <section className="features-section" id="features">
        <div className="section-head">
          <span className="eyebrow">Fonctionnalités</span>
          <h2 className="section-title">Tout ce qu'il faut.<br/>Rien d'autre.</h2>
          <p className="section-sub">Conçu par et pour des revendeurs. Chaque fonctionnalité résout un vrai problème.</p>
        </div>

        <div className="bento-grid">
          {/* Big card — Suivi reventes (4×2) */}
          <article className="bento-card bento-lg">
            <div className="bento-head">
              <div className="bento-icon"><RefreshCw size={18}/></div>
              <span className="bento-tag">Premium</span>
            </div>
            <h3 className="bento-title">Suivi des reventes</h3>
            <p className="bento-desc">Entrez votre prix d'achat, vos frais et votre prix de vente. ICEdep calcule votre marge et votre bénéfice automatiquement.</p>
            <div className="bento-mockup">
              <ReventesMiniMock />
            </div>
          </article>

          {/* Médium — Budget mensuel (2×1) */}
          <article className="bento-card bento-md">
            <div className="bento-head">
              <div className="bento-icon"><Wallet size={18}/></div>
            </div>
            <h3 className="bento-title">Budget mensuel</h3>
            <p className="bento-desc">Suivez vos dépenses et revenus mois par mois. Ajoutez des récurrents automatiques et visualisez où va votre argent.</p>
          </article>

          {/* Médium — Objectifs d'épargne (2×1) */}
          <article className="bento-card bento-md">
            <div className="bento-head">
              <div className="bento-icon"><Target size={18}/></div>
              <span className="bento-tag">Premium</span>
            </div>
            <h3 className="bento-title">Objectifs d'épargne</h3>
            <p className="bento-desc">Définissez des projets (vacances, achat...) et suivez votre progression vers chaque objectif mois après mois.</p>
          </article>

          {/* Small — Vue annuelle (3×1) */}
          <article className="bento-card bento-sm">
            <div className="bento-head">
              <div className="bento-icon"><BarChart3 size={18}/></div>
              <span className="bento-tag">Premium</span>
            </div>
            <h3 className="bento-title">Vue annuelle</h3>
            <p className="bento-desc">Visualisez l'évolution de votre solde sur toute l'année avec des graphiques clairs et votre score de santé financière.</p>
          </article>

          {/* Small — Revenus récurrents (3×1) */}
          <article className="bento-card bento-sm">
            <div className="bento-head">
              <div className="bento-icon"><Zap size={18}/></div>
            </div>
            <h3 className="bento-title">Revenus récurrents</h3>
            <p className="bento-desc">Configurez votre salaire, votre loyer une seule fois. Ils apparaissent automatiquement chaque nouveau mois.</p>
          </article>

          {/* Wide — Dépenses froides (6×1) */}
          <article className="bento-card bento-wide">
            <div className="bento-head">
              <div className="bento-icon"><Brain size={18}/></div>
            </div>
            <h3 className="bento-title">Des décisions réfléchies, pas impulsives</h3>
            <p className="bento-desc">ICEdep vous aide à garder la tête froide sur vos finances. Pas de notifications anxiogènes, pas de gamification toxique — juste des chiffres clairs pour des décisions éclairées.</p>
          </article>
        </div>
      </section>

      {/* ════════ STATS ════════ */}
      <section className="stats-section">
        <div className="stat">
          <span className="stat-num">100%</span>
          <span className="stat-label">Données chiffrées<br/>côté serveur</span>
        </div>
        <div className="stat-divider" />
        <div className="stat">
          <span className="stat-num">0</span>
          <span className="stat-label">Pub ni tracker.<br/>On ne revend pas vos données.</span>
        </div>
        <div className="stat-divider" />
        <div className="stat">
          <span className="stat-num">0€</span>
          <span className="stat-label">Pour commencer.<br/>Carte non requise.</span>
        </div>
      </section>

      {/* ════════ PRICING ════════ */}
      <section className="pricing-section" id="pricing">
        <div className="section-head center">
          <span className="eyebrow">Tarifs</span>
          <h2 className="section-title">Simple. Transparent.</h2>
          <p className="section-sub">Démarre gratos. Premium quand tu en as besoin.</p>
        </div>

        <div className="pricing-grid">
          <article className="price-card">
            <div className="price-card-head">
              <h3 className="price-name">Gratuit</h3>
              <p className="price-tagline">Pour démarrer en douceur</p>
            </div>
            <div className="price-amount">
              <span className="price-num">0€</span>
              <span className="price-period">pour toujours</span>
            </div>
            <ul className="price-features">
              <li><Check size={13}/> Tableau de bord</li>
              <li><Check size={13}/> Budget &amp; transactions</li>
              <li><Check size={13}/> Récurrents automatiques</li>
              <li><Check size={13}/> Sessions mensuelles</li>
              <li><Check size={13}/> Profil personnalisé</li>
              <li className="muted">— Suivi des reventes</li>
              <li className="muted">— Vue annuelle</li>
              <li className="muted">— Objectifs d'épargne</li>
              <li className="muted">— Trophées</li>
            </ul>
            <button className="price-btn outline" onClick={onRegister}>Créer un compte</button>
          </article>

          <article className="price-card featured">
            <div className="price-glow" aria-hidden="true" />
            <span className="price-badge"><Sparkles size={11}/> Premium</span>
            <div className="price-card-head">
              <h3 className="price-name">Premium</h3>
              <p className="price-tagline">Pour les revendeurs sérieux</p>
            </div>
            <div className="price-amount">
              <span className="price-num">4,99€</span>
              <span className="price-period">/ mois</span>
            </div>
            <ul className="price-features">
              <li><Check size={13}/> Tout du plan Gratuit</li>
              <li><Check size={13}/> Suivi reventes &amp; calcul de marges</li>
              <li><Check size={13}/> Vue annuelle complète</li>
              <li><Check size={13}/> Objectifs d'épargne illimités</li>
              <li><Check size={13}/> 24 trophées de revendeur</li>
              <li><Check size={13}/> Plateformes &amp; sous-cat. perso</li>
              <li><Check size={13}/> Articles en attente de vente</li>
              <li><Check size={13}/> Score de santé bonifié</li>
            </ul>
            <button className="price-btn solid" onClick={onRegister}>Passer Premium</button>
            <span className="price-cancel">Résiliable en 1 click</span>
          </article>
        </div>
      </section>

      {/* ════════ FINAL CTA ════════ */}
      <section className="final-cta">
        <h2 className="final-cta-title">
          Prêt à garder la <span className="hero-title-em">tête froide</span><br/>
          sur vos finances ?
        </h2>
        <p className="final-cta-sub">Rejoignez ICEdep gratuitement. Aucune carte requise.</p>
        <button className="btn-primary-lg" onClick={onRegister}>
          Créer mon compte gratuit <ArrowRight size={16}/>
        </button>
      </section>

      {/* ════════ FOOTER ════════ */}
      <footer className="landing-footer">
        <div className="footer-brand">
          <span className="brand-icon">◈</span>
          <span className="brand-name">ICEdep</span>
        </div>
        <span className="footer-copy">© 2026 ICEdep — Made in France 🇫🇷</span>
      </footer>
    </div>
  )
}

// ────────────────────────────────────────────────
// Mockup dashboard (HTML/CSS pur, pas d'images)
// ────────────────────────────────────────────────
function DashboardMockup() {
  return (
    <div className="dashboard-mockup">
      <div className="dm-glow" aria-hidden="true" />
      <div className="dm-head">
        <div className="dm-pill">
          <span className="dm-dot pulse" />
          <span>Avril 2026</span>
        </div>
        <div className="dm-balance">
          <span className="dm-balance-label">Solde du mois</span>
          <span className="dm-balance-value">+1 247€</span>
        </div>
      </div>
      <div className="dm-kpis">
        <div className="dm-kpi">
          <span className="dm-kpi-label">Revenus</span>
          <span className="dm-kpi-value pos">+2 850€</span>
        </div>
        <div className="dm-kpi">
          <span className="dm-kpi-label">Dépenses</span>
          <span className="dm-kpi-value neg">−1 603€</span>
        </div>
        <div className="dm-kpi">
          <span className="dm-kpi-label">Bénéf. revente</span>
          <span className="dm-kpi-value gold">+312€</span>
        </div>
      </div>
      <div className="dm-chart">
        {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
          <span key={i} className="dm-bar" style={{ height: `${h}%`, animationDelay: `${i * 90}ms` }}/>
        ))}
      </div>
      <div className="dm-tx">
        <div className="dm-tx-row">
          <span className="dm-tx-icon">🛒</span>
          <span className="dm-tx-label">Courses Carrefour</span>
          <span className="dm-tx-amount neg">−74€</span>
        </div>
        <div className="dm-tx-row">
          <span className="dm-tx-icon">🔄</span>
          <span className="dm-tx-label">Vente Nike Air Max</span>
          <span className="dm-tx-amount pos">+95€</span>
        </div>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────
// Mini-mock dans le bento "Reventes"
// ────────────────────────────────────────────────
function ReventesMiniMock() {
  const items = [
    { icon: '👟', name: 'Nike Air Max',  meta: 'Vinted',     state: 'Vendu',     marge: '+58%', good: true },
    { icon: '📱', name: 'iPhone 13',     meta: 'Leboncoin',  state: 'Vendu',     marge: '+22%', good: true },
    { icon: '🎮', name: 'PS5 + 2 jeux',  meta: 'Vestiaire',  state: 'En attente',marge: '—',     pending: true },
  ]
  return (
    <div className="rv-mini">
      {items.map((it, i) => (
        <div key={i} className={`rv-mini-row ${it.pending ? 'pending' : ''}`} style={{ animationDelay: `${i * 100}ms` }}>
          <span className="rv-mini-icon">{it.icon}</span>
          <div className="rv-mini-info">
            <div className="rv-mini-name">{it.name}</div>
            <div className="rv-mini-meta">{it.meta} · <span className={it.good ? 'pos' : 'pending-tag'}>{it.state}</span></div>
          </div>
          <span className={`rv-mini-marge ${it.good ? 'pos' : 'muted'}`}>{it.marge}</span>
        </div>
      ))}
    </div>
  )
}
