import { useState } from 'react'
import { Plus, Repeat, Trash2, ArrowUp, ArrowDown, Target, Edit3, Check, X } from 'lucide-react'
import { CAT_META, DEP_CATS, REV_CATS, fmt, fmtMonth } from '../utils/storage'
import { addTransaction, deleteTransaction, addRecurring, deleteRecurring, updateRecurring } from '../utils/db'
import { useT } from '../utils/i18n.jsx'
import './BudgetView.css'

// ════════════════════════════════════════════════════════════
// RecurringRow : ligne d'élément récurrent avec édition inline
// et confirmation de suppression (anti-misclick)
// ════════════════════════════════════════════════════════════
function RecurringRow({ item, onUpdate, onDelete, t }) {
  const [mode, setMode] = useState('view')   // 'view' | 'edit' | 'confirm-delete'
  const [editDesc, setEditDesc]     = useState(item.desc || item.label || '')
  const [editAmount, setEditAmount] = useState(String(item.amount))
  const [busy, setBusy] = useState(false)

  function startEdit() {
    setEditDesc(item.desc || item.label || '')
    setEditAmount(String(item.amount))
    setMode('edit')
  }

  async function save() {
    const amt = +editAmount
    if (!editDesc.trim() || isNaN(amt) || amt <= 0) return
    setBusy(true)
    await onUpdate(item.id, { label: editDesc.trim(), amount: amt })
    setBusy(false)
    setMode('view')
  }

  async function confirmDelete() {
    setBusy(true)
    await onDelete(item.id)
    // pas de setMode après — la ligne disparaît
  }

  // ── Mode édition ──────────────────────────────────────
  if (mode === 'edit') {
    return (
      <div className="rec-item editing">
        <span className="rec-icon">{item.icon}</span>
        <input
          className="rec-edit-input rec-edit-desc"
          value={editDesc}
          onChange={e => setEditDesc(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setMode('view') }}
          autoFocus
        />
        <span className="rec-cat">{item.cat}</span>
        <input
          type="number"
          step="0.01"
          className={`rec-edit-input rec-edit-amount ${item.type === 'revenu' ? 'pos' : 'neg'}`}
          value={editAmount}
          onChange={e => setEditAmount(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setMode('view') }}
        />
        <button className="rec-action ok" onClick={save} disabled={busy} title={t('common.save')}>
          <Check size={14}/>
        </button>
        <button className="rec-action cancel" onClick={() => setMode('view')} disabled={busy} title={t('common.cancel')}>
          <X size={14}/>
        </button>
      </div>
    )
  }

  // ── Mode confirmation suppression ─────────────────────
  if (mode === 'confirm-delete') {
    return (
      <div className="rec-item confirm-del">
        <span className="rec-confirm-text">
          {t('budget.confirm_delete_recurring')}
        </span>
        <button className="rec-action confirm-delete" onClick={confirmDelete} disabled={busy}>
          <Trash2 size={13}/> {t('common.delete')}
        </button>
        <button className="rec-action cancel" onClick={() => setMode('view')} disabled={busy}>
          {t('common.cancel')}
        </button>
      </div>
    )
  }

  // ── Mode lecture (par défaut) ─────────────────────────
  return (
    <div className="rec-item">
      <span className="rec-icon">{item.icon}</span>
      <span className="rec-desc">{item.desc || item.label}</span>
      <span className="rec-cat">{item.cat}</span>
      <span className={`rec-amount ${item.type === 'revenu' ? 'pos' : 'neg'}`}>
        {item.type === 'revenu' ? '+' : '−'}{fmt(item.amount)}
      </span>
      <button className="rec-action edit" onClick={startEdit} title={t('common.edit')}>
        <Edit3 size={13}/>
      </button>
      <button className="rec-action delete" onClick={() => setMode('confirm-delete')} title={t('common.delete')}>
        <Trash2 size={13}/>
      </button>
    </div>
  )
}

const ALL_ICONS = { alimentation:'🛒',transport:'🚗',loisirs:'🎬',santé:'💊',logement:'🏠',vêtements:'👕',salaire:'💼',freelance:'💻',remboursement:'↩️',cadeau:'🎁',revente:'🔄',autre:'📦' }

export default function BudgetView({ data, monthData, currentMonth, userId, refreshData, setActiveTab }) {
  const t = useT()
  const [txType, setTxType] = useState('depense')
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [cat, setCat] = useState('alimentation')
  const [isRecurring, setIsRecurring] = useState(false)
  const [filter, setFilter] = useState('tout')
  const [saving, setSaving] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState('')

  const txs = monthData?.transactions || []
  const cats = txType === 'depense' ? DEP_CATS : REV_CATS
  const goals = data.goals || []

  async function handleAdd() {
    if (!desc.trim() || !amount || isNaN(+amount) || +amount <= 0) return
    setSaving(true)
    const icon = ALL_ICONS[cat] || '📦'
    const today = new Date().toISOString().split('T')[0]
    const tx = { type: txType, desc: desc.trim(), amount: +amount, cat, icon, date: today, recurring: isRecurring }
    await addTransaction(userId, tx, currentMonth)
    if (isRecurring) await addRecurring(userId, tx)
    await refreshData()
    setDesc(''); setAmount(''); setIsRecurring(false); setSelectedGoal('')
    setSaving(false)
  }

  async function handleDeleteTx(id) {
    await deleteTransaction(id)
    await refreshData()
  }

  async function handleDeleteRecurring(id) {
    await deleteRecurring(id)
    await refreshData()
  }

  async function handleUpdateRecurring(id, fields) {
    await updateRecurring(id, fields)
    await refreshData()
  }

  const filtered = filter === 'tout' ? txs : txs.filter(t => t.type === filter)
  const totalRev = txs.filter(t => t.type === 'revenu').reduce((s, t) => s + t.amount, 0)
  const totalDep = txs.filter(t => t.type === 'depense').reduce((s, t) => s + t.amount, 0)

  const depBycat = {}
  txs.filter(t => t.type === 'depense').forEach(t => { depBycat[t.cat] = (depBycat[t.cat] || 0) + t.amount })
  const maxCat = Math.max(...Object.values(depBycat), 1)

  return (
    <div className="budget-view">
      <div className="page-header fade-up">
        <div>
          <h1 className="page-title">{fmtMonth(currentMonth)}</h1>
          <p className="page-sub">{t('sidebar.budget')}</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div className="budget-totals">
            <span className="bt-rev">+{fmt(totalRev)}</span>
            <span className="bt-sep">·</span>
            <span className="bt-dep">−{fmt(totalDep)}</span>
          </div>
          <button
            onClick={() => setActiveTab('goals')}
            style={{display:'flex',alignItems:'center',gap:6,padding:'8px 14px',border:'1px solid var(--line2)',borderRadius:'var(--radius)',background:'transparent',color:'var(--text2)',fontSize:13,cursor:'pointer',whiteSpace:'nowrap'}}
          >
            <Target size={14}/> {t('goals.title')}
          </button>
        </div>
      </div>

      {goals.length > 0 && (
        <div className="fade-up stagger-1" style={{display:'flex',gap:8,marginBottom:'1rem',flexWrap:'wrap'}}>
          {goals.filter(g => g.saved < g.target).map(g => {
            const pct = Math.min(100, g.target > 0 ? g.saved / g.target * 100 : 0)
            return (
              <div key={g.id} onClick={() => setActiveTab('goals')} style={{display:'flex',alignItems:'center',gap:8,background:'var(--bg1)',border:'1px solid var(--line)',borderRadius:'var(--radius)',padding:'8px 12px',cursor:'pointer',flex:'1',minWidth:160}}>
                <span style={{fontSize:18}}>{g.icon}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,color:'var(--text2)',marginBottom:3}}>{g.label}</div>
                  <div style={{height:4,background:'var(--bg3)',borderRadius:2,overflow:'hidden'}}>
                    <div style={{width:pct+'%',height:'100%',background:g.color,borderRadius:2}}/>
                  </div>
                </div>
                <span style={{fontSize:12,color:g.color,fontWeight:500,whiteSpace:'nowrap'}}>{pct.toFixed(0)}%</span>
              </div>
            )
          })}
        </div>
      )}

      <div className="add-box fade-up stagger-1">
        <div className="type-switch">
          <button className={`ts-btn ${txType==='depense'?'active-dep':''}`} onClick={()=>{setTxType('depense');setCat('alimentation')}}><ArrowDown size={15}/> {t('budget.add_expense')}</button>
          <button className={`ts-btn ${txType==='revenu'?'active-rev':''}`} onClick={()=>{setTxType('revenu');setCat('salaire')}}><ArrowUp size={15}/> {t('budget.add_revenue')}</button>
        </div>
        <div className="add-fields">
          <input placeholder={t('budget.desc_placeholder') + '…'} value={desc} onChange={e=>setDesc(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleAdd()}/>
          <input type="number" placeholder={t('budget.amount_placeholder') + ' €'} value={amount} onChange={e=>setAmount(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleAdd()} style={{width:140}}/>
          <select value={cat} onChange={e=>setCat(e.target.value)} style={{width:180}}>
            {cats.map(c=><option key={c} value={c}>{ALL_ICONS[c]} {c}</option>)}
          </select>
          <label className="recurring-toggle">
            <input type="checkbox" checked={isRecurring} onChange={e=>setIsRecurring(e.target.checked)}/>
            <Repeat size={14}/><span>{t('budget.recurring')}</span>
          </label>
          <button className={`add-btn ${txType==='depense'?'dep':'rev'}`} onClick={handleAdd} disabled={saving}><Plus size={16}/></button>
        </div>
      </div>

      {data.recurring.length > 0 && (
        <div className="recurring-box fade-up stagger-2">
          <div className="box-title"><Repeat size={14}/> {t('budget.recurring_items')}</div>
          <div className="recurring-list">
            {data.recurring.map(r => (
              <RecurringRow
                key={r.id}
                item={r}
                onUpdate={handleUpdateRecurring}
                onDelete={handleDeleteRecurring}
                t={t}
              />
            ))}
          </div>
        </div>
      )}

      <div className="budget-body fade-up stagger-3">
        <div className="tx-panel">
          <div className="tx-filters">
            {['tout','revenu','depense'].map(f=>(
              <button key={f} className={`filter-pill ${filter===f?'active':''}`} onClick={()=>setFilter(f)}>
                {f==='tout' ? t('budget.filter_all') : f==='revenu' ? t('budget.filter_revenues') : t('budget.filter_expenses')}
              </button>
            ))}
          </div>
          <div className="tx-list">
            {filtered.length===0 && <p className="empty-state">{t('budget.empty')}</p>}
            {[...filtered].reverse().map(t=>{
              const m=CAT_META[t.cat]||CAT_META.autre
              const d=new Date(t.date+'T00:00:00')
              return(
                <div key={t.id} className="tx-row">
                  <div className="tx-icon" style={{background:m.bg}}>{t.icon||m.icon}</div>
                  <div className="tx-info">
                    <span className="tx-name">{t.desc||t.label}</span>
                    <span className="tx-meta">{t.cat} · {d.toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}{t.recurring?' · ↻':''}</span>
                  </div>
                  <div className={`tx-amount ${t.type==='revenu'?'pos':'neg'}`}>{t.type==='revenu'?'+':'−'}{fmt(t.amount)}</div>
                  <button className="tx-del" onClick={()=>handleDeleteTx(t.id)}><Trash2 size={13}/></button>
                </div>
              )
            })}
          </div>
        </div>
        <div className="cat-panel">
          <div className="box-title">{t('budget.spending_by_cat')}</div>
          {Object.entries(depBycat).sort((a,b)=>b[1]-a[1]).map(([cat,val])=>{
            const m=CAT_META[cat]||CAT_META.autre
            return(
              <div key={cat} className="cat-bar-row">
                <div className="cat-bar-label"><span className="cat-icon">{m.icon}</span><span className="cat-name">{cat}</span></div>
                <div className="cat-bar-track"><div className="cat-bar-fill" style={{width:`${val/maxCat*100}%`,background:m.color}}/></div>
                <span className="cat-bar-val">{fmt(val)}</span>
              </div>
            )
          })}
          {Object.keys(depBycat).length===0 && <p className="empty-state">{t('dashboard.no_expense')}</p>}
        </div>
      </div>
    </div>
  )
}
