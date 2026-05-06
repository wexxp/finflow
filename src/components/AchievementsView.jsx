import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Lock as LockIcon, Check } from 'lucide-react'
import { fmt } from '../utils/storage'
import { ACHIEVEMENTS, CATEGORIES, computeAchievements, getAllReventes, summary, TIER_COLORS } from '../utils/achievements'
import { AnimatedInt, EASE_OUT_EXPO, SPRING_GENTLE, fadeUpVariants, containerVariants } from '../utils/motion'
import { useT } from '../utils/i18n.jsx'
import './AchievementsView.css'

function fmtProgress(a) {
  // Affiche "12 / 50" pour des compteurs, "120 / 500 €" pour les bénéfices, "Débloqué" pour les flags
  if (a.target === 1) return a.unlocked ? 'Débloqué' : 'Verrouillé'
  if (a.id.startsWith('profit_')) return `${fmt(a.current)} / ${fmt(a.target)}`
  return `${a.current} / ${a.target}`
}

function AchievementCard({ a }) {
  const tc = TIER_COLORS[a.tier] || TIER_COLORS.bronze
  return (
    <motion.div
      className={`achievement-card ${a.unlocked ? 'unlocked' : 'locked'}`}
      style={a.unlocked ? { borderColor: tc.border, background: `linear-gradient(180deg, var(--bg1) 0%, ${tc.bg} 100%)` } : undefined}
      variants={fadeUpVariants}
      whileHover={a.unlocked ? { y: -4, scale: 1.015, transition: SPRING_GENTLE } : { y: -2, transition: SPRING_GENTLE }}
    >
      <div className="ach-top">
        <motion.div
          className="ach-icon-wrap"
          style={a.unlocked ? { background: tc.bg, color: tc.fg, borderColor: tc.border } : undefined}
          whileHover={a.unlocked ? { rotate: [0, -8, 8, 0], transition: { duration: 0.5 } } : undefined}
        >
          {a.unlocked ? <span className="ach-icon">{a.icon}</span> : <LockIcon size={20}/>}
        </motion.div>
        <div className="ach-info">
          <div className="ach-title-row">
            <span className="ach-title">{a.title}</span>
            <span className="ach-tier" style={{ color: tc.fg, borderColor: tc.border, background: tc.bg }}>
              {a.tier}
            </span>
          </div>
          <p className="ach-desc">{a.desc}</p>
        </div>
        {a.unlocked && (
          <motion.div
            className="ach-check"
            style={{ background: tc.bg, color: tc.fg }}
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ ...SPRING_GENTLE, delay: 0.2 }}
          >
            <Check size={14}/>
          </motion.div>
        )}
      </div>

      <div className="ach-progress-row">
        <div className="ach-progress-track">
          <motion.div
            className="ach-progress-fill"
            style={{ background: a.unlocked ? tc.fg : 'var(--text3)' }}
            initial={{ width: 0 }}
            animate={{ width: `${a.pct}%` }}
            transition={{ duration: 1, delay: 0.1, ease: EASE_OUT_EXPO }}
          />
        </div>
        <span className="ach-progress-label" style={a.unlocked ? { color: tc.fg } : undefined}>
          {fmtProgress(a)}
        </span>
      </div>
    </motion.div>
  )
}

export default function AchievementsView({ data }) {
  const t = useT()
  const allReventes = useMemo(() => getAllReventes(data), [data])
  const achievements = useMemo(() => computeAchievements(allReventes), [allReventes])
  const sum = useMemo(() => summary(achievements), [achievements])

  // Group by category, en respectant l'ordre défini dans CATEGORIES
  const byCat = useMemo(() => {
    const map = {}
    for (const cat of CATEGORIES) map[cat] = []
    achievements.forEach(a => {
      if (!map[a.cat]) map[a.cat] = []
      map[a.cat].push(a)
    })
    return map
  }, [achievements])

  return (
    <div className="achievements-view">
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
      >
        <div>
          <h1 className="page-title">
            <Trophy size={26} style={{ verticalAlign: '-3px', marginRight: 8, color: 'var(--gold)' }}/>
            {t('achievements.title')}
          </h1>
          <p className="page-sub">{t('achievements.subtitle')}</p>
        </div>
        <div className="ach-summary">
          <div className="ach-summary-num">
            <span className="ach-summary-current"><AnimatedInt value={sum.unlocked} duration={1.4}/></span>
            <span className="ach-summary-sep">/</span>
            <span className="ach-summary-total">{sum.total}</span>
          </div>
          <div className="ach-summary-label">{t('achievements.unlocked')}</div>
        </div>
      </motion.div>

      <motion.div
        className="ach-overall"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: EASE_OUT_EXPO }}
      >
        <div className="ach-overall-track">
          <motion.div
            className="ach-overall-fill"
            initial={{ width: 0 }}
            animate={{ width: `${sum.pct}%` }}
            transition={{ duration: 1.3, delay: 0.3, ease: EASE_OUT_EXPO }}
          />
        </div>
        <span className="ach-overall-label">{sum.pct.toFixed(0)} {t('achievements.progress')}</span>
      </motion.div>

      {allReventes.length === 0 && (
        <div className="ach-empty fade-up stagger-2">
          <Trophy size={40} style={{ color: 'var(--text3)', marginBottom: 12 }}/>
          <p>{t('achievements.empty_title')}</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>{t('achievements.empty_sub')}</p>
        </div>
      )}

      {CATEGORIES.map((cat, i) => {
        const list = byCat[cat] || []
        if (!list.length) return null
        const unlockedCount = list.filter(a => a.unlocked).length
        return (
          <motion.div
            key={cat}
            className="ach-category"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: 0.15 + i * 0.08, ease: EASE_OUT_EXPO }}
          >
            <div className="ach-category-header">
              <h2 className="ach-category-title">{cat}</h2>
              <span className="ach-category-count">{unlockedCount} / {list.length}</span>
            </div>
            <motion.div
              className="ach-grid"
              variants={containerVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-30px' }}
            >
              {list.map(a => <AchievementCard key={a.id} a={a}/>)}
            </motion.div>
          </motion.div>
        )
      })}
    </div>
  )
}
