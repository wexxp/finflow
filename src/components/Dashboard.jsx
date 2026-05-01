import { TrendingUp, TrendingDown, RefreshCw, Activity, ArrowRight, Trophy } from 'lucide-react'
import { motion } from 'framer-motion'
import { computeStats, fmt, fmtSigned, fmtMonth, CAT_META } from '../utils/storage'
import { computeAchievements, getAllReventes, summary as achSummary } from '../utils/achievements'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'
import { AnimatedAmount, AnimatedPercent, SPRING_GENTLE, EASE_OUT_EXPO } from '../utils/motion'
import './Dashboard.css'

function KpiCard({ label, rawValue, displayValue, color, icon: Icon, sub, index, animatedKind = 'amount', signed = false, suffix = '€' }) {
  let animatedNode
  if (animatedKind === 'amount') {
    animatedNode = <AnimatedAmount value={rawValue} signed={signed} suffix={suffix}/>
  } else if (animatedKind === 'percent') {
    animatedNode = <AnimatedPercent value={rawValue}/>
  } else {
    animatedNode = displayValue
  }

  return (
    <motion.div
      className="kpi-card"
      style={{ '--accent-color': color }}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.05 + index * 0.07, ease: EASE_OUT_EXPO }}
      whileHover={{ y: -4, transition: SPRING_GENTLE }}
    >
      <div className="kpi-top">
        <span className="kpi-label">{label}</span>
        <motion.div
          className="kpi-icon-wrap"
          style={{ background: color + '22' }}
          whileHover={{ rotate: -6, scale: 1.08 }}
          transition={SPRING_GENTLE}
        >
          <Icon size={16} style={{ color }} />
        </motion.div>
      </div>
      <div className="kpi-value" style={{ color }}>{animatedNode}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </motion.div>
  )
}

export default function Dashboard({ data, monthData, currentMonth, setActiveTab, isPremium }) {
  const stats = computeStats(monthData)
  const txs = monthData?.transactions || []
  const rvs = monthData?.reventes || []

  // Trophées (toutes périodes confondues)
  const allRvs = getAllReventes(data)
  const achievements = computeAchievements(allRvs)
  const ach = achSummary(achievements)
  const lastUnlocked = [...achievements].filter(a => a.unlocked).slice(-3).reverse()

  // Spending by cat for pie
  const depBycat = {}
  txs.filter(t => t.type === 'depense').forEach(t => {
    depBycat[t.cat] = (depBycat[t.cat] || 0) + t.amount
  })
  const pieData = Object.entries(depBycat).map(([cat, val]) => ({
    name: cat, value: val, color: CAT_META[cat]?.color || '#9997a0'
  })).sort((a, b) => b.value - a.value).slice(0, 6)

  // Mini area for last 6 months
  const allKeys = Object.keys(data.months).sort()
  const last6 = allKeys.slice(-6)
  const areaData = last6.map(key => {
    const s = computeStats(data.months[key])
    return { month: fmtMonth(key).split(' ')[0], balance: Math.round(s.balance), depenses: Math.round(s.totalDep) }
  })

  // Recent transactions
  const recent = [...txs].reverse().slice(0, 5)

  // Predict end of month (extrapolate based on spending/earning rate so far)
  const dayOfMonth = new Date().getDate()
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
  const ratio = daysInMonth / Math.max(dayOfMonth, 1)
  const predictedRev = Math.round(stats.effectiveRev * ratio)
  const predictedDep = Math.round(stats.effectiveDep * ratio)
  const predictedBalance = predictedRev - predictedDep

  return (
    <div className="dashboard">
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
      >
        <div>
          <h1 className="page-title">{fmtMonth(currentMonth)}</h1>
          <p className="page-sub">Tableau de bord — vue d'ensemble</p>
        </div>
        <div className="prediction-badge">
          <Activity size={14} />
          <span>Prévision fin de mois : <strong style={{ color: predictedBalance >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmtSigned(predictedBalance)}</strong></span>
        </div>
      </motion.div>

      <div className="kpi-grid">
        <KpiCard label="Revenus"        rawValue={stats.effectiveRev}    color="var(--green)"  icon={TrendingUp}   sub={stats.totalRvVente > 0 ? `dont ${fmt(stats.totalRvVente)} reventes` : `${txs.filter(t=>t.type==='revenu').length} entrées`} index={0}/>
        <KpiCard label="Dépenses"       rawValue={stats.effectiveDep}    color="var(--red)"    icon={TrendingDown} sub={stats.totalRvAchat > 0 ? `dont ${fmt(stats.totalRvAchat)} achats reventes` : `${txs.filter(t=>t.type==='depense').length} sorties`} index={1}/>
        <KpiCard label="Bénéf. reventes" rawValue={stats.totalRvBenef}    signed                color="var(--purple)" icon={RefreshCw}    sub={`${rvs.length} article${rvs.length > 1 ? 's' : ''} · ${rvs.filter(r=>r.vente>0).length} vendu${rvs.filter(r=>r.vente>0).length > 1 ? 's' : ''}`} index={2}/>
        <KpiCard label="Taux d'épargne"  rawValue={stats.savingRate}      animatedKind="percent" color="var(--gold)"   icon={Activity}     sub={`Score santé : ${stats.healthScore}/100`} index={3}/>
      </div>

      {isPremium && allRvs.length > 0 && (
        <motion.button
          className="trophy-widget"
          onClick={() => setActiveTab('achievements')}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45, ease: EASE_OUT_EXPO }}
          whileHover={{ y: -2, transition: SPRING_GENTLE }}
          whileTap={{ scale: 0.985 }}
        >
          <div className="trophy-widget-icon">
            <Trophy size={20}/>
          </div>
          <div className="trophy-widget-info">
            <div className="trophy-widget-top">
              <span className="trophy-widget-title">Trophées</span>
              <span className="trophy-widget-count">{ach.unlocked} / {ach.total}</span>
            </div>
            <div className="trophy-widget-track">
              <motion.div
                className="trophy-widget-fill"
                initial={{ width: 0 }}
                animate={{ width: `${ach.pct}%` }}
                transition={{ duration: 1.1, delay: 0.65, ease: EASE_OUT_EXPO }}
              />
            </div>
            {lastUnlocked.length > 0 && (
              <div className="trophy-widget-last">
                Dernier : {lastUnlocked.map(a => `${a.icon} ${a.title}`).join(' · ')}
              </div>
            )}
          </div>
          <ArrowRight size={16} className="trophy-widget-arrow"/>
        </motion.button>
      )}

      <div className="dash-row">
        <motion.div
          className="dash-card chart-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.55, ease: EASE_OUT_EXPO }}
          whileHover={{ y: -2, transition: SPRING_GENTLE }}
        >
          <div className="card-header">
            <span className="card-title">Évolution du solde</span>
            <button className="card-link" onClick={() => setActiveTab('annual')}>Vue annuelle <ArrowRight size={13}/></button>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={areaData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c6aff" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#7c6aff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false}/>
              <Tooltip
                contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--line2)', borderRadius: 10, color: 'var(--text)', fontSize: 13 }}
                formatter={(v) => [fmt(v), 'Solde']}
              />
              <Area type="monotone" dataKey="balance" stroke="var(--accent)" strokeWidth={2} fill="url(#balGrad)"/>
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          className="dash-card pie-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.65, ease: EASE_OUT_EXPO }}
          whileHover={{ y: -2, transition: SPRING_GENTLE }}
        >
          <div className="card-header">
            <span className="card-title">Dépenses</span>
          </div>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={42} outerRadius={65} paddingAngle={3} dataKey="value" strokeWidth={0}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color}/>)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--line2)', borderRadius: 10, color: 'var(--text)', fontSize: 13 }} formatter={(v, n) => [fmt(v), n]}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="pie-legend">
                {pieData.map((d, i) => (
                  <div key={i} className="legend-item">
                    <span className="legend-dot" style={{ background: d.color }}/>
                    <span className="legend-name">{d.name}</span>
                    <span className="legend-val">{fmt(d.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <p style={{ color: 'var(--text3)', fontSize: 13, padding: '1rem 0' }}>Aucune dépense ce mois</p>}
        </motion.div>
      </div>

      <motion.div
        className="dash-card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.75, ease: EASE_OUT_EXPO }}
      >
        <div className="card-header">
          <span className="card-title">Transactions récentes</span>
          <button className="card-link" onClick={() => setActiveTab('budget')}>Voir tout <ArrowRight size={13}/></button>
        </div>
        <div className="tx-mini-list">
          {recent.length === 0 && <p style={{ color: 'var(--text3)', fontSize: 13, padding: '0.5rem 0' }}>Aucune transaction</p>}
          {recent.map((t, i) => {
            const m = CAT_META[t.cat] || CAT_META.autre
            return (
              <motion.div
                key={t.id}
                className="tx-mini"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: 0.85 + i * 0.06, ease: EASE_OUT_EXPO }}
                whileHover={{ x: 3, transition: SPRING_GENTLE }}
              >
                <div className="tx-mini-icon" style={{ background: m.bg }}>{t.icon || m.icon}</div>
                <div className="tx-mini-info">
                  <span className="tx-mini-name">{t.desc}</span>
                  <span className="tx-mini-cat">{t.cat}</span>
                </div>
                <div className="tx-mini-amount" style={{ color: t.type === 'revenu' ? 'var(--green)' : 'var(--red)' }}>
                  {t.type === 'revenu' ? '+' : '−'}{fmt(t.amount)}
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
