import { useState } from 'react'
import { Plus, Trash2, Target } from 'lucide-react'
import { fmt } from '../utils/storage'
import { addGoal, updateGoal, deleteGoal, addTransaction } from '../utils/db'
import './GoalsView.css'

const GOAL_COLORS=['#7c6aff','#4ade80','#60a5fa','#fbbf24','#f472b6','#f87171','#a78bfa']
const GOAL_ICONS=['✈️','🏠','💻','🚗','🎓','💍','🏋️','🎮','📱','🌴']

export default function GoalsView({ data, userId, refreshData, currentMonth }) {
  const [label,setLabel]=useState('')
  const [target,setTarget]=useState('')
  const [icon,setIcon]=useState(GOAL_ICONS[0])
  const [color,setColor]=useState(GOAL_COLORS[0])
  const [addAmounts,setAddAmounts]=useState({})

  const goals=data.goals||[]
  const totalTarget=goals.reduce((s,g)=>s+g.target,0)
  const totalSaved=goals.reduce((s,g)=>s+g.saved,0)

  async function handleAddGoal() {
    if(!label.trim()||!target||isNaN(+target)||+target<=0)return
    await addGoal(userId,{label:label.trim(),target:+target,icon,color})
    await refreshData()
    setLabel('');setTarget('')
  }

  async function handleDeleteGoal(id) {
    await deleteGoal(id)
    await refreshData()
  }

  async function handleAddToGoal(g) {
    const amt=+addAmounts[g.id]
    if(!amt||isNaN(amt)||amt<=0)return
    const newSaved=Math.min(g.target,g.saved+amt)
    await updateGoal(g.id,newSaved)
    await addTransaction(userId, {
      type: 'depense',
      desc: `Épargne — ${g.label}`,
      amount: amt,
      cat: 'épargne',
      icon: g.icon,
      date: new Date().toISOString().split('T')[0],
    }, currentMonth)
    await refreshData()
    setAddAmounts(prev=>({...prev,[g.id]:''}))
  }

  return(
    <div className="goals-view">
      <div className="page-header fade-up">
        <div><h1 className="page-title">Objectifs</h1><p className="page-sub">Suis ta progression vers tes projets</p></div>
        {goals.length>0&&(
          <div className="goals-summary">
            <div className="gs-item"><span className="gs-label">Épargné</span><span className="gs-val green">{fmt(totalSaved)}</span></div>
            <div className="gs-sep"/>
            <div className="gs-item"><span className="gs-label">Objectif total</span><span className="gs-val">{fmt(totalTarget)}</span></div>
          </div>
        )}
      </div>

      <div className="add-box fade-up stagger-1">
        <div className="add-box-title"><Plus size={14}/> Nouvel objectif</div>
        <div className="goal-icon-row">
          {GOAL_ICONS.map(ic=>(
            <button key={ic} className={`goal-icon-btn ${icon===ic?'active':''}`} onClick={()=>setIcon(ic)}
              style={{borderColor:icon===ic?color:'transparent',background:icon===ic?color+'22':'var(--bg2)'}}>
              {ic}
            </button>
          ))}
        </div>
        <div className="goal-color-row">
          {GOAL_COLORS.map(c=>(
            <button key={c} className="color-dot" style={{background:c,borderColor:color===c?'var(--text)':'transparent'}} onClick={()=>setColor(c)}/>
          ))}
        </div>
        <div className="add-goal-fields">
          <input placeholder="Nom de l'objectif (ex: Vacances Japon…)" value={label} onChange={e=>setLabel(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleAddGoal()}/>
          <input type="number" placeholder="Montant cible (€)" value={target} onChange={e=>setTarget(e.target.value)} style={{width:200}} onKeyDown={e=>e.key==='Enter'&&handleAddGoal()}/>
          <button className="btn-create" onClick={handleAddGoal} style={{background:color}}>Créer</button>
        </div>
      </div>

      <div className="goals-grid fade-up stagger-2">
        {goals.length===0&&(
          <div className="empty-goals">
            <Target size={40} style={{color:'var(--text3)',marginBottom:12}}/>
            <p>Aucun objectif pour l'instant</p>
            <p style={{fontSize:13,marginTop:4}}>Crée ton premier objectif d'épargne ci-dessus</p>
          </div>
        )}
        {goals.map(g=>{
          const pct=Math.min(100,g.target>0?(g.saved/g.target*100):0)
          const done=pct>=100
          return(
            <div key={g.id} className={`goal-card ${done?'done':''}`} style={{'--goal-color':g.color}}>
              <div className="goal-card-top">
                <div className="goal-icon-big" style={{background:g.color+'22',color:g.color}}>{g.icon}</div>
                <div className="goal-card-info">
                  <div className="goal-label">{g.label}</div>
                  <div className="goal-amounts"><span style={{color:g.color}}>{fmt(g.saved)}</span><span className="goal-sep">sur</span><span>{fmt(g.target)}</span></div>
                </div>
                <button className="goal-del" onClick={()=>handleDeleteGoal(g.id)}><Trash2 size={14}/></button>
              </div>
              <div className="goal-progress-wrap">
                <div className="goal-progress-track"><div className="goal-progress-fill" style={{width:pct+'%',background:g.color}}/></div>
                <div className="goal-pct-row">
                  <span className="goal-pct" style={{color:g.color}}>{pct.toFixed(0)} %</span>
                  {!done&&<span className="goal-remaining">encore {fmt(g.target-g.saved)}</span>}
                  {done&&<span className="goal-done-badge" style={{background:g.color+'22',color:g.color}}>Objectif atteint !</span>}
                </div>
              </div>
              {!done&&(
                <div className="goal-add-row">
                  <input type="number" placeholder="Ajouter (€)" min="0" step="0.01"
                    value={addAmounts[g.id]||''}
                    onChange={e=>setAddAmounts(prev=>({...prev,[g.id]:e.target.value}))}
                    onKeyDown={e=>e.key==='Enter'&&handleAddToGoal(g)}
                  />
                  <button className="goal-add-btn" onClick={()=>handleAddToGoal(g)} style={{background:g.color}}>+</button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
