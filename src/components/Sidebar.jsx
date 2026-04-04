import { LayoutDashboard, Wallet, RefreshCw, BarChart2, Target, ChevronLeft, ChevronRight, Calendar, LogOut } from 'lucide-react'
import { fmtMonth, computeStats, fmt } from '../utils/storage'
import './Sidebar.css'

const NAV = [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { id: 'budget',    label: 'Budget',           icon: Wallet },
  { id: 'reventes',  label: 'Reventes',         icon: RefreshCw },
  { id: 'annual',    label: 'Vue annuelle',     icon: BarChart2 },
  { id: 'goals',     label: 'Objectifs',        icon: Target },
]

export default function Sidebar({ activeTab, setActiveTab, currentMonth, setCurrentMonth, allMonthKeys, navigateMonth, data, onSignOut, userEmail }) {
  const stats = computeStats(data.months[currentMonth])

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-icon">◈</span>
        <span className="brand-name">FinFlow</span>
      </div>

      <div className="month-nav">
        <button className="month-arrow" onClick={() => navigateMonth(-1)}><ChevronLeft size={16}/></button>
        <div className="month-current">
          <Calendar size={12} className="month-cal-icon"/>
          <span>{fmtMonth(currentMonth)}</span>
        </div>
        <button className="month-arrow" onClick={() => navigateMonth(1)}><ChevronRight size={16}/></button>
      </div>

      <div className="sidebar-balance">
        <div className="sb-label">Solde du mois</div>
        <div className={`sb-val ${stats.balance >= 0 ? 'positive' : 'negative'}`}>
          {stats.balance >= 0 ? '+' : '−'}{fmt(Math.abs(stats.balance))}
        </div>
        <div className="health-bar-wrap">
          <div className="health-bar-track">
            <div className="health-bar-fill" style={{ width: `${stats.healthScore}%` }}/>
          </div>
          <span className="health-label">Santé {stats.healthScore}/100</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(item => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon size={18}/>
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="sidebar-months">
        <div className="sm-title">Sessions</div>
        <div className="sm-list">
          {allMonthKeys.map(key => {
            const s = computeStats(data.months[key])
            return (
              <button
                key={key}
                className={`sm-item ${key === currentMonth ? 'active' : ''}`}
                onClick={() => setCurrentMonth(key)}
              >
                <span className="sm-name">{fmtMonth(key)}</span>
                <span className={`sm-bal ${s.balance >= 0 ? 'pos' : 'neg'}`}>
                  {s.balance >= 0 ? '+' : '−'}{fmt(Math.abs(s.balance))}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="sidebar-user">
        <div className="user-email">{userEmail}</div>
        <button className="signout-btn" onClick={onSignOut}>
          <LogOut size={12} style={{ marginRight: 5 }}/>
          Déconnexion
        </button>
      </div>
    </aside>
  )
}
