import { computeStats, fmt, fmtMonth } from '../utils/storage'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line, CartesianGrid } from 'recharts'
import { useT } from '../utils/i18n.jsx'
import './AnnualView.css'

export default function AnnualView({ data, setActiveTab }) {
  const t = useT()
  const allKeys = Object.keys(data.months).sort()
  const chartData = allKeys.map(key => {
    const s = computeStats(data.months[key])
    const label = fmtMonth(key).split(' ')[0]
    const yr = fmtMonth(key).split(' ')[1]
    return {
      key, label, year: yr,
      revenus: Math.round(s.totalRev),
      depenses: Math.round(s.totalDep),
      balance: Math.round(s.balance),
      reventes: Math.round(s.totalRvBenef),
      sante: s.healthScore,
    }
  })

  const totalRev = chartData.reduce((s, d) => s + d.revenus, 0)
  const totalDep = chartData.reduce((s, d) => s + d.depenses, 0)
  const totalBal = chartData.reduce((s, d) => s + d.balance, 0)
  const bestMonth = [...chartData].sort((a, b) => b.balance - a.balance)[0]

  const tooltipStyle = { background: 'var(--bg2)', border: '1px solid #ffffff18', borderRadius: 10, color: 'var(--text)', fontSize: 13 }

  return (
    <div className="annual-view">
      <div className="page-header fade-up">
        <div>
          <h1 className="page-title">{t('annual.title')}</h1>
          <p className="page-sub">{t('annual.subtitle')}</p>
        </div>
      </div>

      <div className="annual-kpis fade-up stagger-1">
        <div className="ann-kpi">
          <span className="ann-kpi-label">{t('annual.kpi_revenue')}</span>
          <span className="ann-kpi-val green">+{fmt(totalRev)}</span>
        </div>
        <div className="ann-kpi">
          <span className="ann-kpi-label">{t('annual.kpi_expenses')}</span>
          <span className="ann-kpi-val red">−{fmt(totalDep)}</span>
        </div>
        <div className="ann-kpi">
          <span className="ann-kpi-label">{t('annual.kpi_balance')}</span>
          <span className={`ann-kpi-val ${totalBal >= 0 ? 'green' : 'red'}`}>{totalBal >= 0 ? '+' : '−'}{fmt(Math.abs(totalBal))}</span>
        </div>
        {bestMonth && (
          <div className="ann-kpi">
            <span className="ann-kpi-label">{t('annual.kpi_resale')}</span>
            <span className="ann-kpi-val gold">{bestMonth.label}</span>
          </div>
        )}
      </div>

      <div className="ann-chart-card fade-up stagger-2">
        <div className="card-title">{t('annual.evolution')}</div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} barCategoryGap="30%" barGap={4} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
            <XAxis dataKey="label" tick={{ fill: 'var(--text3)', fontSize: 12 }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fill: 'var(--text3)', fontSize: 12 }} axisLine={false} tickLine={false}/>
            <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [fmt(v), n]}/>
            <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text2)', paddingTop: 8 }}/>
            <Bar dataKey="revenus" name={t('annual.col_revenue')} fill="#4ade80" radius={[4,4,0,0]} fillOpacity={0.85}/>
            <Bar dataKey="depenses" name={t('annual.col_expenses')} fill="#f87171" radius={[4,4,0,0]} fillOpacity={0.85}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="ann-row fade-up stagger-3">
        <div className="ann-chart-card">
          <div className="card-title">{t('annual.col_balance')}</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false}/>
              <XAxis dataKey="label" tick={{ fill: 'var(--text3)', fontSize: 12 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill: 'var(--text3)', fontSize: 12 }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [fmt(v), t('annual.col_balance')]}/>
              <Line type="monotone" dataKey="balance" stroke="var(--accent)" strokeWidth={2.5} dot={{ fill: 'var(--accent)', r: 4 }}/>
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="ann-chart-card">
          <div className="card-title">{t('annual.col_health')}</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fill: 'var(--text3)', fontSize: 12 }} axisLine={false} tickLine={false}/>
              <YAxis domain={[0, 100]} tick={{ fill: 'var(--text3)', fontSize: 12 }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v + '/100', t('annual.col_health')]}/>
              <Bar dataKey="sante" name={t('annual.col_health')} fill="var(--gold)" radius={[4,4,0,0]} fillOpacity={0.85}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="ann-table fade-up stagger-4">
        <div className="card-title" style={{ marginBottom: '1rem' }}>{t('annual.detail')}</div>
        <table className="month-table">
          <thead>
            <tr>
              <th>{t('annual.col_month')}</th><th>{t('annual.col_revenue')}</th><th>{t('annual.col_expenses')}</th><th>{t('annual.kpi_resale')}</th><th>{t('annual.col_balance')}</th><th>{t('annual.col_health')}</th>
            </tr>
          </thead>
          <tbody>
            {[...chartData].reverse().map(d => (
              <tr key={d.key}>
                <td className="month-cell">{d.label} {d.year}</td>
                <td style={{ color: 'var(--green)' }}>+{fmt(d.revenus)}</td>
                <td style={{ color: 'var(--red)' }}>−{fmt(d.depenses)}</td>
                <td style={{ color: 'var(--purple)' }}>{d.reventes >= 0 ? '+' : '−'}{fmt(Math.abs(d.reventes))}</td>
                <td style={{ color: d.balance >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 500 }}>{d.balance >= 0 ? '+' : '−'}{fmt(Math.abs(d.balance))}</td>
                <td>
                  <div className="health-mini">
                    <div className="health-mini-track"><div className="health-mini-fill" style={{ width: d.sante + '%' }}/></div>
                    <span>{d.sante}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
