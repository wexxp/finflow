import { useState, useEffect, useCallback } from 'react'
import { supabase } from './utils/supabase'
import { fetchAllUserData, applyRecurringToMonth } from './utils/db'
import { monthKey } from './utils/storage'
import Auth from './components/Auth'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import BudgetView from './components/BudgetView'
import ReventesView from './components/ReventesView'
import AnnualView from './components/AnnualView'
import GoalsView from './components/GoalsView'
import AdminDashboard from './components/AdminDashboard' // Chemin mis à jour !

export default function App() {
  const [session, setSession] = useState(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(monthKey())
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (!session) setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (!session) { 
        setData(null); 
        setIsAdmin(false);
        setLoading(false) 
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return
    setLoading(true)
    
    const checkAdminAndFetchData = async () => {
      const userData = await fetchAllUserData(session.user.id);
      setData(userData);

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();
      
      if (profile?.is_admin) {
        setIsAdmin(true);
      }
      setLoading(false);
    }

    checkAdminAndFetchData();
  }, [session])

  const refreshData = useCallback(async () => {
    if (!session) return
    const d = await fetchAllUserData(session.user.id)
    setData(d)
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

  async function signOut() {
    await supabase.auth.signOut()
  }

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'var(--text2)',fontFamily:'var(--font-body)'}}>
      Chargement…
    </div>
  )

  if (!session) return <Auth />

  if (!data) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'var(--text2)',fontFamily:'var(--font-body)'}}>
      Chargement des données…
    </div>
  )

  const monthData = data.months[currentMonth] || { transactions: [], reventes: [], budget: 2000 }
  const allMonthKeys = Object.keys(data.months).sort().reverse()
  
  const views = { 
    dashboard: Dashboard, 
    budget: BudgetView, 
    reventes: ReventesView, 
    annual: AnnualView, 
    goals: GoalsView,
    admin: AdminDashboard 
  }
  
  const View = views[activeTab] || Dashboard

  return (
    <div className="app-layout">
      <Sidebar
        activeTab={activeTab} setActiveTab={setActiveTab}
        currentMonth={currentMonth} setCurrentMonth={goToMonth}
        allMonthKeys={allMonthKeys} navigateMonth={navigateMonth}
        data={data} onSignOut={signOut} userEmail={session.user.email}
        isAdmin={isAdmin} // On envoie l'info à la sidebar
      />
      <main className="app-main">
        <View
          data={data} monthData={monthData} currentMonth={currentMonth}
          userId={session.user.id} refreshData={refreshData}
          navigateMonth={navigateMonth} setActiveTab={setActiveTab}
          updateData={setData}
        />
      </main>
    </div>
  )
}