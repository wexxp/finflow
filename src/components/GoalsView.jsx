import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Target } from 'lucide-react'
import { fmt } from '../utils/storage'
import { addGoal, updateGoal, deleteGoal, addTransaction } from '../utils/db'
import { AnimatedAmount, AnimatedPercent, EASE_OUT_EXPO, SPRING_GENTLE, fadeUpVariants, containerVariants } from '../utils/motion'
import './GoalsView.css'

const GOAL_COLORS=['#7c6aff','#4ade80','#60a5fa','#fbbf24','#f472b6','#f87171','#a78bfa']
const GOAL_ICONS=['✈️','🏠','💻','🚗','🎓','💍','🏋️','🎮','📱','🌴']

export default function GoalsView({ data, userId, refreshData, currentMonth }) {
  const [label,setLabel]=useState('')
  const [target,setTarget]=useState('')
  const [icon,setIcon]=useState(GOAL_ICONS[0])
  const [color,setColor]=useState(GOAL_COLORS[0])
  const [addAmounts,setAddAmounts]=useState({})
  const [errMsg,setErrMsg]=useState('')

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
    setErrMsg('')
    const newSaved=Math.min(g.target,g.saved+amt)
    const goalRes = await updateGoal(g.id,newSaved)
    if (goalRes?.error) { setErrMsg(`❌ Mise à jour objectif: ${goalRes.error.message}`); return }
    const { error: txErr } = await addTransaction(userId, {
      type: 'depense',
      desc: `Épargne — ${g.label}`,
      amount: amt,
      cat: 'épargne',
      icon: g.icon || '🏦',
      date: new Date().toISOString().split('T')[0],
    }, currentMonth)
    if (txErr) { setErrMsg(`❌ Création de la dépense: ${txErr.message}`); return }
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

      {errMsg && <div style={{marginBottom:'1rem',padding:'10px 14px',background:'var(--red-bg)',color:'var(--red)',borderRadius:'var(--radius)',fontSize:13}}>{errMsg}</div>}

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

      <motion.div
        className="goals-grid"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
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
            <motion.div
              key={g.id}
              className={`goal-card ${done?'done':''}`}
              style={{'--goal-color':g.color}}
              variants={fadeUpVariants}
              whileHover={{ y: -4, transition: SPRING_GENTLE }}
            >
              <div className="goal-card-top">
                <motion.div
                  className="goal-icon-big"
                  style={{background:g.color+'22',color:g.color}}
                  whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.5 } }}
                >{g.icon}</motion.div>
                <div className="goal-card-info">
                  <div className="goal-label">{g.label}</div>
                  <div className="goal-amounts">
                    <span style={{color:g.color}}><AnimatedAmount value={g.saved} duration={1.1}/></span>
                    <span className="goal-sep">sur</span>
                    <span>{fmt(g.target)}</span>
                  </div>
                </div>
                <button className="goal-del" onClick={()=>handleDeleteGoal(g.id)}><Trash2 size={14}/></button>
              </div>
              <div className="goal-progress-wrap">
                <div className="goal-progress-track">
                  <motion.div
                    className="goal-progress-fill"
                    style={{background:g.color}}
                    initial={{ width: 0 }}
                    animate={{ width: pct + '%' }}
                    transition={{ duration: 1.2, ease: EASE_OUT_EXPO, delay: 0.15 }}
                  />
                </div>
                <div className="goal-pct-row">
                  <span className="goal-pct" style={{color:g.color}}><AnimatedPercent value={pct} decimals={0}/></span>
                  {!done&&<span className="goal-remaining">encore {fmt(g.target-g.saved)}</span>}
                  {done&&<motion.span
                    className="goal-done-badge"
                    style={{background:g.color+'22',color:g.color}}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ ...SPRING_GENTLE, delay: 0.3 }}
                  >Objectif atteint !</motion.span>}
                </div>
              </div>
              {!done&&(
                <div className="goal-add-row">
                  <input type="number" placeholder="Ajouter (€)" min="0" step="0.01"
                    value={addAmounts[g.id]||''}
                    onChange={e=>setAddAmounts(prev=>({...prev,[g.id]:e.target.value}))}
                    onKeyDown={e=>e.key==='Enter'&&handleAddToGoal(g)}
                  />
                  <motion.button
                    className="goal-add-btn"
                    onClick={()=>handleAddToGoal(g)}
                    style={{background:g.color}}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    transition={SPRING_GENTLE}
                  >+</motion.button>
                </div>
              )}
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
