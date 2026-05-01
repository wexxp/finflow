import { useEffect, useState } from 'react'
import {
  ArrowRight, Sparkles, TrendingUp, Wallet, Target, BarChart3,
  RefreshCw, Zap, Shield, Check, Trophy
} from 'lucide-react'
import './LandingPage.css'

const PLATFORMS = ['Vinted', 'Leboncoin', 'Vestiaire Collectif', 'eBay', 'Prego', 'Sell', 'Facebook Marketplace', 'De main en main']

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
          <button className="nav-link" onClick={() => scrollToId('testimonial')}>Avis</button>
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
            <span>Pensé pour les revendeurs Vinted &amp; Leboncoin</span>
          </div>

          <h1 className="hero-title">
            La finance,<br/>
            <span className="hero-title-em">la tête froide.</span>
          </h1>

          <p className="hero-sub">
            Le seul gestionnaire qui comprend ton activité de revente. Marges, prévisions, objectifs — sans la complexité d'un tableur.
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

      {/* ════════ MARQUEE plateformes ════════ */}
      <section className="marquee-section">
        <span className="marquee-label">Compatible avec toutes les plateformes</span>
        <div className="marquee">
          <div className="marquee-track">
            {[...PLATFORMS, ...PLATFORMS, ...PLATFORMS].map((p, i) => (
              <span key={i} className="marquee-item">
                <span className="marquee-dot" />
                {p}
              </span>
            ))}
          </div>
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
          {/* Big card — Reventes (occupe 2 lignes × 4 cols) */}
          <article className="bento-card bento-lg">
            <div className="bento-head">
              <div className="bento-icon"><RefreshCw size={18}/></div>
              <span className="bento-tag">Premium</span>
            </div>
            <h3 className="bento-title">Suivi des reventes</h3>
            <p className="bento-desc">Achat, frais, vente. ICEdep calcule tes marges, ton bénéfice cumulé, et ton délai de vente moyen — automatiquement.</p>
            <div className="bento-mockup">
              <ReventesMiniMock />
            </div>
          </article>

          {/* Médium — Budget */}
          <article className="bento-card bento-md">
            <div className="bento-head">
              <div className="bento-icon"><Wallet size={18}/></div>
            </div>
            <h3 className="bento-title">Budget mensuel</h3>
            <p className="bento-desc">Dépenses, revenus, récurrents automatiques. Vue claire mois par mois.</p>
          </article>

          {/* Médium — Objectifs */}
          <article className="bento-card bento-md">
            <div className="bento-head">
              <div className="bento-icon"><Target size={18}/></div>
              <span className="bento-tag">Premium</span>
            </div>
            <h3 className="bento-title">Objectifs d'épargne</h3>
            <p className="bento-desc">Vacances, achat, projet. L'épargne ne pénalise plus ton score de santé.</p>
          </article>

          {/* Small — Vue annuelle */}
          <article className="bento-card bento-sm">
            <div className="bento-head">
              <div className="bento-icon"><BarChart3 size={18}/></div>
            </div>
            <h3 className="bento-title">Vue annuelle</h3>
            <p className="bento-desc">Toute l'année en un coup d'œil.</p>
          </article>

          {/* Small — Prévisions */}
          <article className="bento-card bento-sm">
            <div className="bento-head">
              <div className="bento-icon"><TrendingUp size={18}/></div>
            </div>
            <h3 className="bento-title">Prévisions</h3>
            <p className="bento-desc">Solde de fin de mois calculé sur ton rythme.</p>
          </article>

          {/* Wide — Trophées */}
          <article className="bento-card bento-wide">
            <div className="bento-head">
              <div className="bento-icon gold-icon"><Trophy size={18}/></div>
              <span className="bento-tag gold-tag">24 trophées</span>
            </div>
            <h3 className="bento-title">Le revendeur en toi mérite des médailles</h3>
            <p className="bento-desc">1ère vente, 100 ventes, 10 000€ cumulés, mois en feu, marge ×3, année régulière. Bronze, silver, gold, platinum — chaque palier compte.</p>
            <div className="trophy-row">
              {['🎯','💰','🔥','💯','💎','👑','🏆','🚀'].map((e, i) => (
                <span key={i} className="trophy-chip" style={{ animationDelay: `${i * 80}ms` }}>{e}</span>
              ))}
            </div>
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
          <span className="stat-num">2 min</span>
          <span className="stat-label">Pour démarrer<br/>et tracker tout</span>
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

      {/* ════════ TESTIMONIAL ════════ */}
      <section className="testimonial-section" id="testimonial">
        <div className="quote-mark" aria-hidden="true">"</div>
        <blockquote className="testimonial-quote">
          J'avais arrêté de tracker mes reventes parce qu'Excel me prenait trop de temps. Avec ICEdep, je vois en 5 secondes que je gagne plus sur Vestiaire que sur Vinted. Game changer.
        </blockquote>
        <div className="testimonial-author">
          <span className="author-avatar">M</span>
          <div>
            <div className="author-name">Marc D.</div>
            <div className="author-role">Revendeur Vinted depuis 2 ans</div>
          </div>
        </div>
      </section>

      {/* ════════ FINAL CTA ════════ */}
      <section className="final-cta">
        <h2 className="final-cta-title">
          Prêt à maîtriser<br/>
          <span className="hero-title-em">tes finances</span> ?
        </h2>
        <p className="final-cta-sub">Rejoins ICEdep gratuitement. Aucune carte requise.</p>
        <button className="btn-primary-lg" onClick={onRegister}>
          Commencer maintenant <ArrowRight size={16}/>
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
