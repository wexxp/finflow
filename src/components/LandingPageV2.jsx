// ════════════════════════════════════════════════════════════
// ICEdep — Landing Page V2 (futuriste, néon, motion-heavy)
// Backup de l'ancienne : LandingPage.jsx reste intact
// ════════════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import {
  motion, AnimatePresence, useScroll, useTransform,
  useMotionValue, useSpring, useInView, useMotionTemplate,
} from 'framer-motion'
import {
  ArrowRight, Sparkles, Brain, Wallet, Target, BarChart3,
  RefreshCw, Zap, Shield, Check, ChevronDown,
} from 'lucide-react'
import Logo from './Logo.jsx'
import './LandingPageV2.css'

// ════════════════════════════════════════════════════════════
// 1. CURSEUR PERSONNALISÉ — petit ring néon qui suit la souris
// ════════════════════════════════════════════════════════════
function CustomCursor() {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  // Spring partagé : dot ET ring utilisent les mêmes valeurs lissées
  // → ils restent toujours parfaitement centrés l'un sur l'autre
  const springConfig = { damping: 28, stiffness: 350, mass: 0.4 }
  const sx = useSpring(x, springConfig)
  const sy = useSpring(y, springConfig)
  const [variant, setVariant] = useState('default')

  useEffect(() => {
    const onMove = (e) => {
      x.set(e.clientX)
      y.set(e.clientY)
    }
    const onEnter = (e) => {
      if (e.target?.closest?.('a, button, .magnetic, [data-cursor="hover"]'))
        setVariant('hover')
    }
    const onLeave = (e) => {
      if (e.target?.closest?.('a, button, .magnetic, [data-cursor="hover"]'))
        setVariant('default')
    }
    window.addEventListener('mousemove', onMove)
    document.addEventListener('mouseover', onEnter)
    document.addEventListener('mouseout', onLeave)
    return () => {
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', onEnter)
      document.removeEventListener('mouseout', onLeave)
    }
  }, [x, y])

  return (
    <>
      <motion.div
        className="cursor-dot"
        style={{ left: sx, top: sy }}
      />
      <motion.div
        className="cursor-ring"
        style={{ left: sx, top: sy }}
        animate={{
          scale: variant === 'hover' ? 2.5 : 1,
          opacity: variant === 'hover' ? 0.4 : 1,
        }}
        transition={{ duration: 0.3 }}
      />
    </>
  )
}

// ════════════════════════════════════════════════════════════
// 2. GRILLE ANIMÉE — fond avec perspective + scroll
// ════════════════════════════════════════════════════════════
function AnimatedGrid() {
  const { scrollYProgress } = useScroll()
  const rotateX = useTransform(scrollYProgress, [0, 1], [60, 80])
  const translateY = useTransform(scrollYProgress, [0, 1], [0, -200])
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.3, 0.15, 0.05])

  return (
    <motion.div
      className="grid-bg"
      style={{
        rotateX,
        y: translateY,
        opacity,
      }}
      aria-hidden="true"
    />
  )
}

// ════════════════════════════════════════════════════════════
// 3. ORBES GLOW — flottent et suivent souris en parallax
// ════════════════════════════════════════════════════════════
function MeshOrbs() {
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const smx = useSpring(mx, { damping: 50, stiffness: 80 })
  const smy = useSpring(my, { damping: 50, stiffness: 80 })

  useEffect(() => {
    const onMove = (e) => {
      const cx = window.innerWidth / 2
      const cy = window.innerHeight / 2
      mx.set((e.clientX - cx) / 30)
      my.set((e.clientY - cy) / 30)
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [mx, my])

  const x1 = useTransform(smx, v => v * 1.2)
  const y1 = useTransform(smy, v => v * 1.2)
  const x2 = useTransform(smx, v => v * -0.8)
  const y2 = useTransform(smy, v => v * -0.8)
  const x3 = useTransform(smx, v => v * 0.5)
  const y3 = useTransform(smy, v => v * 0.5)

  return (
    <div className="mesh-orbs" aria-hidden="true">
      <motion.div className="orb orb-cyan"   style={{ x: x1, y: y1 }} />
      <motion.div className="orb orb-violet" style={{ x: x2, y: y2 }} />
      <motion.div className="orb orb-gold"   style={{ x: x3, y: y3 }} />
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// 4. SCROLL PROGRESS — barre néon en haut
// ════════════════════════════════════════════════════════════
function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30 })
  return <motion.div className="scroll-progress" style={{ scaleX }} />
}

// ════════════════════════════════════════════════════════════
// 5. MAGNETIC BUTTON — le bouton suit légèrement la souris
// ════════════════════════════════════════════════════════════
function MagneticBtn({ children, className = '', strength = 0.3, ...rest }) {
  const ref = useRef(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { damping: 15, stiffness: 200 })
  const sy = useSpring(y, { damping: 15, stiffness: 200 })

  const handleMove = (e) => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    x.set((e.clientX - cx) * strength)
    y.set((e.clientY - cy) * strength)
  }
  const handleLeave = () => { x.set(0); y.set(0) }

  return (
    <motion.button
      ref={ref}
      className={`magnetic ${className}`}
      style={{ x: sx, y: sy }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      {...rest}
    >
      {children}
    </motion.button>
  )
}

// ════════════════════════════════════════════════════════════
// 6. TILT CARD — 3D tilt sur mouse position
// ════════════════════════════════════════════════════════════
function TiltCard({ children, className = '', max = 8, glare = true, ...rest }) {
  const ref = useRef(null)
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const gx = useMotionValue(50)
  const gy = useMotionValue(50)
  const srx = useSpring(rx, { damping: 20, stiffness: 250 })
  const sry = useSpring(ry, { damping: 20, stiffness: 250 })

  const handleMove = (e) => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    const px = (e.clientX - r.left) / r.width   // 0..1
    const py = (e.clientY - r.top) / r.height
    rx.set((0.5 - py) * max)
    ry.set((px - 0.5) * max)
    gx.set(px * 100)
    gy.set(py * 100)
  }
  const handleLeave = () => { rx.set(0); ry.set(0) }

  const glareBg = useMotionTemplate`radial-gradient(400px circle at ${gx}% ${gy}%, rgba(38, 238, 235, 0.18), transparent 50%)`

  return (
    <motion.div
      ref={ref}
      className={`tilt ${className}`}
      style={{
        rotateX: srx,
        rotateY: sry,
        transformStyle: 'preserve-3d',
        transformPerspective: 1000,
      }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      {...rest}
    >
      {children}
      {glare && (
        <motion.div
          className="tilt-glare"
          style={{ background: glareBg }}
          aria-hidden="true"
        />
      )}
    </motion.div>
  )
}

// ════════════════════════════════════════════════════════════
// 7. TEXTE QUI SE RÉVÈLE MOT PAR MOT
// ════════════════════════════════════════════════════════════
function RevealText({ text, className = '', delay = 0, stagger = 0.06 }) {
  const words = text.split(' ')
  return (
    <span className={className}>
      {words.map((word, i) => (
        <span key={i} className="reveal-word-wrap">
          <motion.span
            className="reveal-word"
            initial={{ y: '110%', opacity: 0 }}
            animate={{ y: '0%', opacity: 1 }}
            transition={{
              duration: 0.65,
              delay: delay + i * stagger,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {word}
          </motion.span>
          {i < words.length - 1 && <span>&nbsp;</span>}
        </span>
      ))}
    </span>
  )
}

// ════════════════════════════════════════════════════════════
// 8. COMPTEUR ANIMÉ AU SCROLL
// ════════════════════════════════════════════════════════════
function ScrollCounter({ from = 0, to, suffix = '', duration = 1.4 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  const [value, setValue] = useState(from)

  useEffect(() => {
    if (!inView) return
    const start = performance.now()
    let raf
    const tick = (t) => {
      const p = Math.min((t - start) / (duration * 1000), 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(from + (to - from) * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, from, to, duration])

  return <span ref={ref}>{value}{suffix}</span>
}

// ════════════════════════════════════════════════════════════
// 9. NAVIGATION GLASS + scroll-aware
// ════════════════════════════════════════════════════════════
function NavV2({ onLogin, onRegister }) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const scrollTo = (id) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <motion.nav
      className={`nav-v2 ${scrolled ? 'scrolled' : ''}`}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="nav-v2-inner">
        <div className="nav-v2-brand">
          <Logo size={28} className="nav-v2-logo"/>
          <span className="nav-v2-name">ICEdep</span>
        </div>
        <div className="nav-v2-mid">
          <button onClick={() => scrollTo('features')}>Fonctionnalités</button>
          <button onClick={() => scrollTo('pricing')}>Tarifs</button>
        </div>
        <div className="nav-v2-actions">
          <button className="nav-v2-ghost magnetic" onClick={onLogin}>Connexion</button>
          <MagneticBtn className="nav-v2-cta" onClick={onRegister}>
            Démarrer <ArrowRight size={14}/>
          </MagneticBtn>
        </div>
      </div>
    </motion.nav>
  )
}

// ════════════════════════════════════════════════════════════
// 10. HERO — titre reveal + mockup tilt + magnetic CTAs
// ════════════════════════════════════════════════════════════
function HeroV2({ onLogin, onRegister }) {
  const { scrollYProgress } = useScroll()
  const mockupY = useTransform(scrollYProgress, [0, 0.3], [0, -100])
  const mockupOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0.4])
  const mockupScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.92])

  return (
    <section className="hero-v2">
      <div className="hero-v2-content">
        <motion.div
          className="hero-v2-eyebrow"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <span className="eyebrow-dot-v2" />
          <span>Gérez vos finances intelligemment</span>
        </motion.div>

        <h1 className="hero-v2-title">
          <RevealText text="Gardez la" delay={0.4}/>
          <br/>
          {/* "tête froide" : un seul span pour préserver le gradient text intact
              (le découpage mot par mot casse background-clip:text sur Safari mobile) */}
          <span className="reveal-word-wrap">
            <motion.span
              className="hero-v2-title-em reveal-word"
              initial={{ y: '110%', opacity: 0 }}
              animate={{ y: '0%', opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              tête froide
            </motion.span>
          </span>
          <br/>
          <RevealText text="sur vos dépenses." delay={0.85}/>
        </h1>

        <motion.p
          className="hero-v2-sub"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
        >
          ICEdep, c'est le gestionnaire de finances pensé pour les revendeurs et ceux qui veulent vraiment maîtriser leur budget — sans la complexité d'Excel.
        </motion.p>

        <motion.div
          className="hero-v2-ctas"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.15 }}
        >
          <MagneticBtn className="cta-primary" onClick={onRegister}>
            <span>Commencer gratuitement</span>
            <ArrowRight size={16}/>
          </MagneticBtn>
          <MagneticBtn className="cta-ghost" onClick={onLogin} strength={0.2}>
            J'ai déjà un compte
          </MagneticBtn>
        </motion.div>

        <motion.div
          className="hero-v2-trust"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.4 }}
        >
          <span><Check size={11}/> Aucune CB requise</span>
          <span><Shield size={11}/> Données chiffrées</span>
          <span><Zap size={11}/> Setup en 2 min</span>
        </motion.div>
      </div>

      <motion.div
        className="hero-v2-mockup-wrap"
        style={{ y: mockupY, opacity: mockupOpacity, scale: mockupScale }}
      >
        <TiltCard className="hero-v2-mockup" max={10}>
          <DashMockup/>
        </TiltCard>
      </motion.div>

      <motion.div
        className="hero-v2-scroll-hint"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ChevronDown size={20}/>
      </motion.div>
    </section>
  )
}

// Mini-mockup dashboard (HTML/CSS pur)
function DashMockup() {
  return (
    <div className="dm-v2">
      <div className="dm-v2-glow" aria-hidden="true"/>
      <div className="dm-v2-head">
        <div className="dm-v2-pill"><span className="dm-v2-dot"/> Avril 2026</div>
        <div className="dm-v2-balance">
          <span className="dm-v2-balance-label">Solde du mois</span>
          <span className="dm-v2-balance-value">+1 247€</span>
        </div>
      </div>
      <div className="dm-v2-kpis">
        <div className="dm-v2-kpi"><span>Revenus</span><span className="pos">+2 850€</span></div>
        <div className="dm-v2-kpi"><span>Dépenses</span><span className="neg">−1 603€</span></div>
        <div className="dm-v2-kpi"><span>Bénéf. revente</span><span className="gold">+312€</span></div>
      </div>
      <div className="dm-v2-chart">
        {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
          <motion.span
            key={i}
            className="dm-v2-bar"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.8, delay: 1.5 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <div className="dm-v2-tx">
        <div className="dm-v2-tx-row">
          <span>🛒</span><span>Courses Carrefour</span><span className="neg">−74€</span>
        </div>
        <div className="dm-v2-tx-row">
          <span>🔄</span><span>Vente Nike Air Max</span><span className="pos">+95€</span>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// 11. STATS — counters au scroll
// ════════════════════════════════════════════════════════════
function StatsV2() {
  return (
    <section className="stats-v2">
      <div className="stat-v2">
        <span className="stat-v2-num"><ScrollCounter to={100} suffix="%"/></span>
        <span className="stat-v2-label">Données chiffrées<br/>côté serveur</span>
      </div>
      <div className="stat-v2-divider"/>
      <div className="stat-v2">
        <span className="stat-v2-num"><ScrollCounter to={0}/></span>
        <span className="stat-v2-label">Pub ni tracker.<br/>On ne revend pas vos données.</span>
      </div>
      <div className="stat-v2-divider"/>
      <div className="stat-v2">
        <span className="stat-v2-num"><ScrollCounter to={0}/>€</span>
        <span className="stat-v2-label">Pour commencer.<br/>Carte non requise.</span>
      </div>
    </section>
  )
}

// ════════════════════════════════════════════════════════════
// 12. FEATURES BENTO avec tilt + glow on hover
// ════════════════════════════════════════════════════════════
function FeaturesV2() {
  return (
    <section className="features-v2" id="features">
      <motion.div
        className="section-head-v2"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="eyebrow-v2">Fonctionnalités</span>
        <h2 className="section-title-v2">
          Tout ce qu'il faut.<br/>Rien d'autre.
        </h2>
        <p className="section-sub-v2">
          Conçu par et pour des revendeurs. Chaque fonctionnalité résout un vrai problème.
        </p>
      </motion.div>

      <div className="bento-v2">
        <BentoCard size="lg" delay={0}>
          <BentoHead icon={<RefreshCw size={18}/>} tag="Premium"/>
          <h3>Suivi des reventes</h3>
          <p>Entrez votre prix d'achat, vos frais et votre prix de vente. ICEdep calcule votre marge et votre bénéfice automatiquement.</p>
          <ReventesMock/>
        </BentoCard>

        <BentoCard size="md" delay={0.05}>
          <BentoHead icon={<Wallet size={18}/>}/>
          <h3>Budget mensuel</h3>
          <p>Suivez vos dépenses et revenus mois par mois. Ajoutez des récurrents automatiques et visualisez où va votre argent.</p>
        </BentoCard>

        <BentoCard size="md" delay={0.1}>
          <BentoHead icon={<Target size={18}/>} tag="Premium"/>
          <h3>Objectifs d'épargne</h3>
          <p>Définissez des projets (vacances, achat...) et suivez votre progression vers chaque objectif mois après mois.</p>
        </BentoCard>

        <BentoCard size="sm" delay={0.15}>
          <BentoHead icon={<BarChart3 size={18}/>} tag="Premium"/>
          <h3>Vue annuelle</h3>
          <p>Visualisez l'évolution de votre solde sur toute l'année avec des graphiques clairs et votre score de santé.</p>
        </BentoCard>

        <BentoCard size="sm" delay={0.2}>
          <BentoHead icon={<Zap size={18}/>}/>
          <h3>Revenus récurrents</h3>
          <p>Configurez votre salaire, votre loyer une seule fois. Ils apparaissent automatiquement chaque nouveau mois.</p>
        </BentoCard>

        <BentoCard size="wide" delay={0.25}>
          <BentoHead icon={<Brain size={18}/>}/>
          <h3>Des décisions réfléchies, pas impulsives</h3>
          <p>ICEdep vous aide à garder la tête froide sur vos finances. Pas de notifications anxiogènes, pas de gamification toxique — juste des chiffres clairs pour des décisions éclairées.</p>
        </BentoCard>
      </div>
    </section>
  )
}

function BentoCard({ children, size = 'md', delay = 0 }) {
  return (
    <motion.article
      className={`bento-v2-card bento-v2-${size}`}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <TiltCard max={4} glare className="bento-v2-tilt">
        {children}
      </TiltCard>
    </motion.article>
  )
}

function BentoHead({ icon, tag }) {
  return (
    <div className="bento-v2-head">
      <div className="bento-v2-icon">{icon}</div>
      {tag && <span className="bento-v2-tag">{tag}</span>}
    </div>
  )
}

function ReventesMock() {
  const items = [
    { icon: '👟', name: 'Nike Air Max',  meta: 'Vinted',     state: 'Vendu',     marge: '+58%', good: true },
    { icon: '📱', name: 'iPhone 13',     meta: 'Leboncoin',  state: 'Vendu',     marge: '+22%', good: true },
    { icon: '🎮', name: 'PS5 + 2 jeux',  meta: 'Vestiaire',  state: 'En attente',marge: '—',     pending: true },
  ]
  return (
    <div className="rv-mock-v2">
      {items.map((it, i) => (
        <motion.div
          key={i}
          className={`rv-mock-row ${it.pending ? 'pending' : ''}`}
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="rv-mock-icon">{it.icon}</span>
          <div className="rv-mock-info">
            <div className="rv-mock-name">{it.name}</div>
            <div className="rv-mock-meta">
              {it.meta} · <span className={it.good ? 'pos' : 'pending-tag'}>{it.state}</span>
            </div>
          </div>
          <span className={`rv-mock-marge ${it.good ? 'pos' : 'muted'}`}>{it.marge}</span>
        </motion.div>
      ))}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// 13. PRICING avec glow + tilt
// ════════════════════════════════════════════════════════════
function PricingV2({ onRegister }) {
  return (
    <section className="pricing-v2" id="pricing">
      <motion.div
        className="section-head-v2 center"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="eyebrow-v2">Tarifs</span>
        <h2 className="section-title-v2">Simple. Transparent.</h2>
        <p className="section-sub-v2">Démarre gratos. Premium quand tu en as besoin.</p>
      </motion.div>

      <div className="pricing-v2-grid">
        <motion.article
          className="price-v2-card"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <TiltCard max={3} className="price-v2-tilt">
            <h3 className="price-v2-name">Gratuit</h3>
            <p className="price-v2-tagline">Pour démarrer en douceur</p>
            <div className="price-v2-amount">
              <span className="price-v2-num">0€</span>
              <span className="price-v2-period">pour toujours</span>
            </div>
            <ul className="price-v2-features">
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
            <MagneticBtn className="price-v2-btn outline" onClick={onRegister}>
              Créer un compte
            </MagneticBtn>
          </TiltCard>
        </motion.article>

        <motion.article
          className="price-v2-card featured"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <TiltCard max={3} className="price-v2-tilt">
            <div className="price-v2-glow"/>
            <span className="price-v2-badge"><Sparkles size={11}/> Premium</span>
            <h3 className="price-v2-name">Premium</h3>
            <p className="price-v2-tagline">Pour les revendeurs sérieux</p>
            <div className="price-v2-amount">
              <span className="price-v2-num gradient">4,99€</span>
              <span className="price-v2-period">/ mois</span>
            </div>
            <ul className="price-v2-features">
              <li><Check size={13}/> Tout du plan Gratuit</li>
              <li><Check size={13}/> Suivi reventes &amp; calcul de marges</li>
              <li><Check size={13}/> Vue annuelle complète</li>
              <li><Check size={13}/> Objectifs d'épargne illimités</li>
              <li><Check size={13}/> 24 trophées de revendeur</li>
              <li><Check size={13}/> Plateformes &amp; sous-cat. perso</li>
              <li><Check size={13}/> Articles en attente de vente</li>
              <li><Check size={13}/> Score de santé bonifié</li>
            </ul>
            <MagneticBtn className="price-v2-btn solid" onClick={onRegister}>
              Passer Premium
            </MagneticBtn>
            <span className="price-v2-cancel">Résiliable en 1 click</span>
          </TiltCard>
        </motion.article>
      </div>
    </section>
  )
}

// ════════════════════════════════════════════════════════════
// 14. CTA FINAL
// ════════════════════════════════════════════════════════════
function CTAV2({ onRegister }) {
  return (
    <section className="cta-v2">
      <motion.div
        className="cta-v2-glow"
        animate={{
          background: [
            'radial-gradient(ellipse at center, rgba(38, 238, 235, 0.18), transparent 60%)',
            'radial-gradient(ellipse at center, rgba(124, 106, 255, 0.18), transparent 60%)',
            'radial-gradient(ellipse at center, rgba(38, 238, 235, 0.18), transparent 60%)',
          ],
        }}
        transition={{ duration: 6, repeat: Infinity }}
      />
      <motion.h2
        className="cta-v2-title"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        Prêt à garder la <span className="hero-v2-title-em">tête froide</span><br/>sur vos finances ?
      </motion.h2>
      <motion.p
        className="cta-v2-sub"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.2 }}
      >
        Rejoignez ICEdep gratuitement. Aucune carte requise.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.35 }}
      >
        <MagneticBtn className="cta-primary cta-v2-btn" onClick={onRegister}>
          Créer mon compte gratuit <ArrowRight size={16}/>
        </MagneticBtn>
      </motion.div>
    </section>
  )
}

// ════════════════════════════════════════════════════════════
// 15. FOOTER
// ════════════════════════════════════════════════════════════
function FooterV2() {
  return (
    <footer className="footer-v2">
      <div className="footer-v2-brand">
        <Logo size={22}/>
        <span className="footer-v2-name">ICEdep</span>
      </div>
      <span className="footer-v2-copy">© 2026 ICEdep — Made in France 🇫🇷</span>
    </footer>
  )
}

// ════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ════════════════════════════════════════════════════════════
export default function LandingPageV2({ onLogin, onRegister }) {
  return (
    <div className="landing-v2">
      <CustomCursor/>
      <AnimatedGrid/>
      <MeshOrbs/>
      <div className="noise-v2" aria-hidden="true"/>
      <ScrollProgress/>

      <NavV2 onLogin={onLogin} onRegister={onRegister}/>
      <HeroV2 onLogin={onLogin} onRegister={onRegister}/>
      <StatsV2/>
      <FeaturesV2/>
      <PricingV2 onRegister={onRegister}/>
      <CTAV2 onRegister={onRegister}/>
      <FooterV2/>
    </div>
  )
}
