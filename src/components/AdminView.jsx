import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { Users, TrendingUp, TrendingDown, RefreshCw, Shield } from 'lucide-react'
import { fmt } from '../utils/storage'
import './AdminView.css'

export default function AdminView() {
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState({ total: 0, totalTx: 0, totalRv: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const [profilesRes, txRes, rvRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('transactions').select('user_id, amount, type'),
      supabase.from('reventes').select('user_id, vente, achat, frais'),
    ])

    const profiles = profilesRes.data || []
    const txs = txRes.data || []
    const rvs = rvRes.data || []

    const enriched = profiles.map(p => {
      const userTxs = txs.filter(t => t.user_id === p.id)
      const userRvs = rvs.filter(r => r.user_id === p.id)
      const revenus = userTxs.filter(t => t.type === 'revenu').reduce((s, t) => s + t.amount, 0)
      const depenses = userTxs.filter(t => t.type === 'depense').reduce((s, t) => s + t.amount, 0)
      const benefRv = userRvs.reduce((s, r) => s + (r.vente - r.achat - r.frais), 0)
      return { ...p, revenus, depenses, benefRv, nbTx: userTxs.length, nbRv: userRvs.length }
    })

    setUsers(enriched)
    setStats({
      total: profiles.length,
      totalTx: txs.length,
      totalRv: rvs.length,
    })
    setLoading(false)
  }

  if (loading) return <div style={{ padding: '2rem', color: 'var(--text2)' }}>Chargement…</div>

  return (
    <div className="admin-view">
      <div className="page-header fade-up">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Shield size={28} style={{ color: 'var(--accent)' }}/> Administration
          </h1>
          <p className="page-sub">Vue globale de tous les utilisateurs</p>
        </div>
        <button onClick={loadData} style={{ display:'flex',alignItems:'center',gap:6,padding:'8px 14px',border:'1px solid var(--line2)',borderRadius:'var(--radius)',background:'transparent',color:'var(--text2)',fontSize:13,cursor:'pointer' }}>
          <RefreshCw size={14}/> Actualiser
        </button>
      </div>

      <div className="admin-kpis fade-up stagger-1">
        <div className="admin-kpi">
          <Users size={20} style={{ color: 'var(--accent)' }}/>
          <div>
            <div className="admin-kpi-val">{stats.total}</div>
            <div className="admin-kpi-label">Utilisateurs</div>
          </div>
        </div>
        <div className="admin-kpi">
          <TrendingUp size={20} style={{ color: 'var(--green)' }}/>
          <div>
            <div className="admin-kpi-val">{stats.totalTx}</div>
            <div className="admin-kpi-label">Transactions</div>
          </div>
        </div>
        <div className="admin-kpi">
          <TrendingDown size={20} style={{ color: 'var(--purple)' }}/>
          <div>
            <div className="admin-kpi-val">{stats.totalRv}</div>
            <div className="admin-kpi-label">Reventes</div>
          </div>
        </div>
      </div>

      <div className="admin-table fade-up stagger-2">
        <div className="box-title" style={{ marginBottom: '1rem' }}>Utilisateurs inscrits</div>
        {users.length === 0 && <p style={{ color: 'var(--text3)', fontSize: 14 }}>Aucun utilisateur</p>}
        <table className="user-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Inscrit le</th>
              <th>Transactions</th>
              <th>Revenus</th>
              <th>Dépenses</th>
              <th>Reventes</th>
              <th>Bénéf. reventes</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td className="user-email-cell">
                  {u.is_admin && <Shield size={12} style={{ color: 'var(--accent)', marginRight: 5 }}/>}
                  {u.email}
                </td>
                <td>{u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : '—'}</td>
                <td>{u.nbTx}</td>
                <td style={{ color: 'var(--green)' }}>+{fmt(u.revenus)}</td>
                <td style={{ color: 'var(--red)' }}>−{fmt(u.depenses)}</td>
                <td>{u.nbRv}</td>
                <td style={{ color: u.benefRv >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {u.benefRv >= 0 ? '+' : '−'}{fmt(Math.abs(u.benefRv))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
