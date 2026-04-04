import { TrendingUp, TrendingDown, RefreshCw, Activity, ArrowRight } from 'lucide-react'
import { computeStats, fmt, fmtSigned, fmtMonth, CAT_META } from '../utils/storage'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'
import './Dashboard.css'

function KpiCard({ label, value, color, icon: Icon, sub, delay }) {
  return (
    <div className={`kpi-card fade-up stagger-${delay}`} style={{ '--accent-color': color }}>
      <div className="kpi-top">
        <span className="kpi-label">{label}</span>
        <div className="kpi-icon-wrap" style={{ background: color + '22' }}>
          <Icon size={16} style={{ color }} />
        </div>
      </div>
      <div className="kpi-value" style={{ color }}>{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  )
}

export default function Dashboard({ data, monthData, currentMonth, setActiveTab }) {
  const stats = computeStats(monthData)
  const txs = monthData?.transactions || []
  const rvs = monthData?.reventes || []

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

  // Predict end of month (extrapolate based on spending rate)
  const dayOfMonth = new Date().getDate()
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
  const ratio = daysInMonth / Math.max(dayOfMonth, 1)
  const predictedDep = Math.round(stats.totalDep * ratio)
  const predictedBalance = Math.round(stats.totalRev - predictedDep + stats.totalRvBenef)

  return (
    <div className="dashboard">
      <div className="page-header fade-up">
        <div>
          <h1 className="page-title">{fmtMonth(currentMonth)}</h1>
          <p className="page-sub">Tableau de bord — vue d'ensemble</p>
        </div>
        <div className="prediction-badge">
          <Activity size={14} />
          <span>Prévision fin de mois : <strong style={{ color: predictedBalance >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmtSigned(predictedBalance)}</strong></span>
        </div>
      </div>

      <div className="kpi-grid">
        <KpiCard label="Revenus" value={fmt(stats.totalRev)} color="var(--green)" icon={TrendingUp} sub={`${txs.filter(t=>t.type==='revenu').length} entrées`} delay={1}/>
        <KpiCard label="Dépenses" value={fmt(stats.totalDep)} color="var(--red)" icon={TrendingDown} sub={`${txs.filter(t=>t.type==='depense').length} sorties`} delay={2}/>
        <KpiCard label="Reventes" value={fmtSigned(stats.totalRvBenef)} color="var(--purple)" icon={RefreshCw} sub={`${rvs.length} articles`} delay={3}/>
        <KpiCard label="Taux d'épargne" value={stats.savingRate.toFixed(1) + ' %'} color="var(--gold)" icon={Activity} sub={`Score santé : ${stats.healthScore}/100`} delay={4}/>
      </div>

      <div className="dash-row">
        <div className="dash-card chart-card fade-up stagger-3">
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
        </div>

        <div className="dash-card pie-card fade-up stagger-4">
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
        </div>
      </div>

      <div className="dash-card fade-up stagger-5">
        <div className="card-header">
          <span className="card-title">Transactions récentes</span>
          <button className="card-link" onClick={() => setActiveTab('budget')}>Voir tout <ArrowRight size={13}/></button>
        </div>
        <div className="tx-mini-list">
          {recent.length === 0 && <p style={{ color: 'var(--text3)', fontSize: 13, padding: '0.5rem 0' }}>Aucune transaction</p>}
          {recent.map(t => {
            const m = CAT_META[t.cat] || CAT_META.autre
            return (
              <div key={t.id} className="tx-mini">
                <div className="tx-mini-icon" style={{ background: m.bg }}>{t.icon || m.icon}</div>
                <div className="tx-mini-info">
                  <span className="tx-mini-name">{t.desc}</span>
                  <span className="tx-mini-cat">{t.cat}</span>
                </div>
                <div className="tx-mini-amount" style={{ color: t.type === 'revenu' ? 'var(--green)' : 'var(--red)' }}>
                  {t.type === 'revenu' ? '+' : '−'}{fmt(t.amount)}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
