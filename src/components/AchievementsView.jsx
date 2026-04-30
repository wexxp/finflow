import { useMemo } from 'react'
import { Trophy, Lock as LockIcon, Check } from 'lucide-react'
import { fmt } from '../utils/storage'
import { ACHIEVEMENTS, CATEGORIES, computeAchievements, getAllReventes, summary, TIER_COLORS } from '../utils/achievements'
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
    <div
      className={`achievement-card ${a.unlocked ? 'unlocked' : 'locked'}`}
      style={a.unlocked ? { borderColor: tc.border, background: `linear-gradient(180deg, var(--bg1) 0%, ${tc.bg} 100%)` } : undefined}
    >
      <div className="ach-top">
        <div
          className="ach-icon-wrap"
          style={a.unlocked ? { background: tc.bg, color: tc.fg, borderColor: tc.border } : undefined}
        >
          {a.unlocked ? <span className="ach-icon">{a.icon}</span> : <LockIcon size={20}/>}
        </div>
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
          <div className="ach-check" style={{ background: tc.bg, color: tc.fg }}>
            <Check size={14}/>
          </div>
        )}
      </div>

      <div className="ach-progress-row">
        <div className="ach-progress-track">
          <div
            className="ach-progress-fill"
            style={{ width: `${a.pct}%`, background: a.unlocked ? tc.fg : 'var(--text3)' }}
          />
        </div>
        <span className="ach-progress-label" style={a.unlocked ? { color: tc.fg } : undefined}>
          {fmtProgress(a)}
        </span>
      </div>
    </div>
  )
}

export default function AchievementsView({ data }) {
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
      <div className="page-header fade-up">
        <div>
          <h1 className="page-title">
            <Trophy size={26} style={{ verticalAlign: '-3px', marginRight: 8, color: 'var(--gold)' }}/>
            Trophées
          </h1>
          <p className="page-sub">Tes accomplissements de revendeur</p>
        </div>
        <div className="ach-summary">
          <div className="ach-summary-num">
            <span className="ach-summary-current">{sum.unlocked}</span>
            <span className="ach-summary-sep">/</span>
            <span className="ach-summary-total">{sum.total}</span>
          </div>
          <div className="ach-summary-label">débloqués</div>
        </div>
      </div>

      <div className="ach-overall fade-up stagger-1">
        <div className="ach-overall-track">
          <div className="ach-overall-fill" style={{ width: `${sum.pct}%` }}/>
        </div>
        <span className="ach-overall-label">{sum.pct.toFixed(0)} % de progression</span>
      </div>

      {allReventes.length === 0 && (
        <div className="ach-empty fade-up stagger-2">
          <Trophy size={40} style={{ color: 'var(--text3)', marginBottom: 12 }}/>
          <p>Aucune revente pour l'instant.</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>Ajoute ta première dans l'onglet Reventes pour débloquer tes premiers trophées !</p>
        </div>
      )}

      {CATEGORIES.map((cat, i) => {
        const list = byCat[cat] || []
        if (!list.length) return null
        const unlockedCount = list.filter(a => a.unlocked).length
        return (
          <div key={cat} className={`ach-category fade-up stagger-${(i % 4) + 2}`}>
            <div className="ach-category-header">
              <h2 className="ach-category-title">{cat}</h2>
              <span className="ach-category-count">{unlockedCount} / {list.length}</span>
            </div>
            <div className="ach-grid">
              {list.map(a => <AchievementCard key={a.id} a={a}/>)}
            </div>
          </div>
        )
      })}
    </div>
  )
}
