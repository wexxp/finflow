import { useState } from 'react'
import { LayoutDashboard, Wallet, RefreshCw, BarChart2, Target, ChevronLeft, ChevronRight, Calendar, LogOut, Shield, Zap, Lock, MoreHorizontal, X } from 'lucide-react'
import { fmtMonth, computeStats, fmt } from '../utils/storage'
import './Sidebar.css'

const NAV = [
  { id: 'dashboard', label: 'Tableau de bord', shortLabel: 'Accueil', icon: LayoutDashboard, premium: false },
  { id: 'budget',    label: 'Budget',           shortLabel: 'Budget',  icon: Wallet,          premium: false },
  { id: 'reventes',  label: 'Reventes',         shortLabel: 'Reventes',icon: RefreshCw,       premium: true  },
  { id: 'annual',    label: 'Vue annuelle',     shortLabel: 'Annuel',  icon: BarChart2,       premium: true  },
  { id: 'goals',     label: 'Objectifs',        shortLabel: 'Objectifs',icon: Target,         premium: true  },
]

export default function Sidebar({ activeTab, setActiveTab, currentMonth, setCurrentMonth, allMonthKeys, navigateMonth, data, onSignOut, userEmail, isAdmin, isPremium }) {
  const [showMore, setShowMore] = useState(false)
  const stats = computeStats(data.months[currentMonth])

  function handleTabChange(id) {
    setActiveTab(id)
    setShowMore(false)
  }

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">◈</span>
          <span className="brand-name">ICEdep</span>
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
            const locked = item.premium && !isPremium
            return (
              <button
                key={item.id}
                className={`nav-item ${activeTab === item.id ? 'active' : ''} ${locked ? 'locked' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon size={18}/>
                <span>{item.label}</span>
                {locked && <Lock size={12} style={{ marginLeft: 'auto', color: 'var(--text3)' }}/>}
              </button>
            )
          })}

          <button
            className={`nav-item ${activeTab === 'subscription' ? 'active' : ''}`}
            onClick={() => setActiveTab('subscription')}
            style={{ marginTop: 4 }}
          >
            <Zap size={18} style={{ color: 'var(--gold)' }}/>
            <span style={{ color: 'var(--gold)' }}>{isPremium ? '⭐ Premium actif' : 'Passer Premium'}</span>
          </button>

          {isAdmin && (
            <button
              className={`nav-item ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
              style={{ marginTop: 4, borderTop: '1px solid var(--line)', paddingTop: 10 }}
            >
              <Shield size={18} style={{ color: 'var(--accent)' }}/>
              <span style={{ color: 'var(--accent)' }}>Administration</span>
            </button>
          )}
        </nav>

        <div className="sidebar-months">
          <div className="sm-title">Sessions</div>
          <div className="sm-list">
            {allMonthKeys.map(key => {
              const s = computeStats(data.months[key])
              return (
                <button key={key} className={`sm-item ${key === currentMonth ? 'active' : ''}`} onClick={() => setCurrentMonth(key)}>
                  <span className="sm-name">{fmtMonth(key)}</span>
                  <span className={`sm-bal ${s.balance >= 0 ? 'pos' : 'neg'}`}>{s.balance >= 0 ? '+' : '−'}{fmt(Math.abs(s.balance))}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="sidebar-user">
          <div className="user-email">
            {isAdmin && <Shield size={11} style={{ color: 'var(--accent)', marginRight: 4 }}/>}
            {isPremium && <Zap size={11} style={{ color: 'var(--gold)', marginRight: 4 }}/>}
            {userEmail}
          </div>
          <button className="signout-btn" onClick={onSignOut}>
            <LogOut size={12} style={{ marginRight: 5 }}/> Déconnexion
          </button>
        </div>
      </aside>

      {/* ── Mobile top header ── */}
      <header className="mobile-header">
        <div className="mobile-brand">
          <span className="brand-icon">◈</span>
          <span className="brand-name">ICEdep</span>
        </div>
        <div className="mobile-month-nav">
          <button className="month-arrow" onClick={() => navigateMonth(-1)}><ChevronLeft size={14}/></button>
          <span className="mobile-month-text">{fmtMonth(currentMonth)}</span>
          <button className="month-arrow" onClick={() => navigateMonth(1)}><ChevronRight size={14}/></button>
        </div>
        <div className={`mobile-bal ${stats.balance >= 0 ? 'pos' : 'neg'}`}>
          {stats.balance >= 0 ? '+' : '−'}{fmt(Math.abs(stats.balance))}
        </div>
      </header>

      {/* ── Mobile bottom nav ── */}
      <nav className="mobile-nav">
        {NAV.map(item => {
          const Icon = item.icon
          const locked = item.premium && !isPremium
          return (
            <button
              key={item.id}
              className={`mobile-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => handleTabChange(item.id)}
            >
              <div className="mobile-nav-icon">
                <Icon size={21}/>
                {locked && <span className="mobile-lock-dot"/>}
              </div>
              <span>{item.shortLabel}</span>
            </button>
          )
        })}
        <button
          className={`mobile-nav-item ${showMore ? 'active' : ''}`}
          onClick={() => setShowMore(v => !v)}
        >
          <div className="mobile-nav-icon"><MoreHorizontal size={21}/></div>
          <span>Plus</span>
        </button>
      </nav>

      {/* ── Mobile "Plus" drawer ── */}
      {showMore && (
        <div className="mobile-more-overlay" onClick={() => setShowMore(false)}>
          <div className="mobile-more-sheet" onClick={e => e.stopPropagation()}>
            <div className="mobile-more-header">
              <div className="mobile-more-user">
                {isAdmin && <Shield size={12} style={{ color: 'var(--accent)' }}/>}
                {isPremium && <Zap size={12} style={{ color: 'var(--gold)' }}/>}
                <span className="mobile-more-email">{userEmail}</span>
              </div>
              <button className="mobile-more-close" onClick={() => setShowMore(false)}><X size={18}/></button>
            </div>

            <div className="mobile-more-actions">
              <button
                className={`mobile-more-btn ${activeTab === 'subscription' ? 'active' : ''}`}
                onClick={() => handleTabChange('subscription')}
              >
                <Zap size={16} style={{ color: 'var(--gold)' }}/>
                <span>{isPremium ? '⭐ Premium actif' : 'Passer Premium'}</span>
              </button>
              {isAdmin && (
                <button
                  className={`mobile-more-btn ${activeTab === 'admin' ? 'active' : ''}`}
                  onClick={() => handleTabChange('admin')}
                >
                  <Shield size={16} style={{ color: 'var(--accent)' }}/>
                  <span>Administration</span>
                </button>
              )}
            </div>

            <div className="mobile-sessions-section">
              <div className="sm-title">Sessions</div>
              <div className="sm-list">
                {allMonthKeys.slice(0, 8).map(key => {
                  const s = computeStats(data.months[key])
                  return (
                    <button
                      key={key}
                      className={`sm-item ${key === currentMonth ? 'active' : ''}`}
                      onClick={() => { setCurrentMonth(key); setShowMore(false) }}
                    >
                      <span className="sm-name">{fmtMonth(key)}</span>
                      <span className={`sm-bal ${s.balance >= 0 ? 'pos' : 'neg'}`}>{s.balance >= 0 ? '+' : '−'}{fmt(Math.abs(s.balance))}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mobile-more-footer">
              <button className="mobile-signout-btn" onClick={onSignOut}>
                <LogOut size={14}/> Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
