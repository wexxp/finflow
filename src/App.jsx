import { useState, useEffect, useRef, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { supabase } from './utils/supabase'
import { fetchAllUserData, applyRecurringToMonth, fetchProfile } from './utils/db'
import { monthKey } from './utils/storage'
import { PageTransition } from './utils/motion'
import { playTabSwitch } from './utils/audio'
import LandingPage from './components/LandingPage'
import Auth from './components/Auth'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import BudgetView from './components/BudgetView'
import ReventesView from './components/ReventesView'
import AnnualView from './components/AnnualView'
import GoalsView from './components/GoalsView'
import AdminView from './components/AdminView'
import SubscriptionView from './components/SubscriptionView'
import LockedView from './components/LockedView'
import ProfileView from './components/ProfileView'
import AchievementsView from './components/AchievementsView'

const PREMIUM_TABS = { reventes:'Reventes', annual:'Vue annuelle', goals:'Objectifs', achievements:'Trophées' }

export default function App() {
  const [session, setSession] = useState(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(monthKey())
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isAdmin, setIsAdmin] = useState(false)
  const [isPremium, setIsPremium] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [authMode, setAuthMode] = useState(null) // null=landing, 'login', 'register'

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (!session) { setData(null); setAuthMode(null) }
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return
    setLoading(true)
    Promise.all([
      fetchAllUserData(session.user.id),
      fetchProfile(session.user.id)
    ]).then(([d, profileRes]) => {
      setData(d)
      const p = profileRes.data || {}
      setIsAdmin(p.is_admin || false)
      setIsPremium(p.is_premium || p.is_admin || false)
      setDisplayName(p.display_name || '')
      setAvatarUrl(p.avatar_url || '')
      setLoading(false)
    })
  }, [session])

  const refreshData = useCallback(async () => {
    if (!session) return
    const d = await fetchAllUserData(session.user.id)
    setData(d)
  }, [session])

  const refreshProfile = useCallback(async () => {
    if (!session) return
    const { data: p } = await fetchProfile(session.user.id)
    if (!p) return
    setIsAdmin(p.is_admin || false)
    setIsPremium(p.is_premium || p.is_admin || false)
    setDisplayName(p.display_name || '')
    setAvatarUrl(p.avatar_url || '')
  }, [session])

  const ensureMonth = useCallback(async (key) => {
    if (!session || !data) return
    if (!data.months[key]) {
      await applyRecurringToMonth(session.user.id, data.recurring, key)
      await refreshData()
    }
  }, [session, data, refreshData])

  const navigateMonth = useCallback(async (dir) => {
    const [y, m] = currentMonth.split('-').map(Number)
    const key = monthKey(new Date(y, m - 1 + dir, 1))
    setCurrentMonth(key)
    await ensureMonth(key)
  }, [currentMonth, ensureMonth])

  const goToMonth = useCallback(async (key) => {
    setCurrentMonth(key)
    await ensureMonth(key)
  }, [ensureMonth])

  async function signOut() { await supabase.auth.signOut() }

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'var(--text2)',fontFamily:'var(--font-body)'}}>Chargement…</div>

  // Not logged in
  if (!session) {
    if (authMode === 'login' || authMode === 'register') {
      return <Auth defaultMode={authMode}/>
    }
    return <LandingPage onLogin={() => setAuthMode('login')} onRegister={() => setAuthMode('register')}/>
  }

  if (!data) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'var(--text2)',fontFamily:'var(--font-body)'}}>Chargement des données…</div>

  const monthData = data.months[currentMonth] || { transactions: [], reventes: [], budget: 2000 }
  const allMonthKeys = Object.keys(data.months).sort().reverse()
  const views = { dashboard: Dashboard, budget: BudgetView, reventes: ReventesView, annual: AnnualView, goals: GoalsView, achievements: AchievementsView }
  const View = views[activeTab]
  const isLocked = PREMIUM_TABS[activeTab] && !isPremium

  function renderContent() {
    if (activeTab === 'admin' && isAdmin) return <AdminView />
    if (activeTab === 'subscription') return <SubscriptionView userEmail={session.user.email} isPremium={isPremium} isAdmin={isAdmin}/>
    if (activeTab === 'profile') return <ProfileView userId={session.user.id} userEmail={session.user.email} displayName={displayName} avatarUrl={avatarUrl} isPremium={isPremium} isAdmin={isAdmin} refreshProfile={refreshProfile}/>
    if (isLocked) return <LockedView featureName={PREMIUM_TABS[activeTab]} setActiveTab={setActiveTab}/>
    if (View) return <View data={data} monthData={monthData} currentMonth={currentMonth} userId={session.user.id} refreshData={refreshData} navigateMonth={navigateMonth} setActiveTab={setActiveTab} updateData={setData} isPremium={isPremium}/>
    return null
  }

  return (
    <div className="app-layout">
      <Sidebar
        activeTab={activeTab} setActiveTab={setActiveTab}
        currentMonth={currentMonth} setCurrentMonth={goToMonth}
        allMonthKeys={allMonthKeys} navigateMonth={navigateMonth}
        data={data} onSignOut={signOut} userEmail={session.user.email}
        displayName={displayName} avatarUrl={avatarUrl}
        isAdmin={isAdmin} isPremium={isPremium}
      />
      <main className="app-main">
        <AnimatePresence mode="wait">
          <PageTransition viewKey={activeTab}>
            {renderContent()}
          </PageTransition>
        </AnimatePresence>
      </main>
    </div>
  )
}
