import { useState } from 'react'
import { Plus, Trash2, Clock, CheckCircle, Edit3, X } from 'lucide-react'
import { fmt, fmtMonth } from '../utils/storage'
import { addRevente, deleteRevente } from '../utils/db'
import { supabase } from '../utils/supabase'
import './ReventesView.css'

const RV_CATS={électronique:'📱',mobilier:'🪑',vêtements:'👕',matériel:'🔧',livres:'📚',jeux:'🎮',autre:'📦'}
const PLATFORMS=['Leboncoin','Vinted','eBay','Facebook','De main en main','Autre']
const CAT_COLORS={électronique:'#60a5fa',mobilier:'#fbbf24',vêtements:'#f472b6',matériel:'#a78bfa',livres:'#4ade80',jeux:'#f87171',autre:'#9997a0'}

export default function ReventesView({ monthData, currentMonth, userId, refreshData }) {
  const [name,setName]=useState('')
  const [cat,setCat]=useState('électronique')
  const [plat,setPlat]=useState('Leboncoin')
  const [achat,setAchat]=useState('')
  const [frais,setFrais]=useState('0')
  const [vente,setVente]=useState('')
  const [saving,setSaving]=useState(false)
  const [editingId,setEditingId]=useState(null)
  const [editVente,setEditVente]=useState('')
  const [editFrais,setEditFrais]=useState('')
  const [filterStatus,setFilterStatus]=useState('tout')

  const rvs=monthData?.reventes||[]

  // Sépare vendu et en attente
  const vendu = rvs.filter(r => r.vente > 0)
  const enAttente = rvs.filter(r => !r.vente || r.vente === 0)

  // Marge moyenne — ignore les achats à 0€
  const rvsPourMarge = vendu.filter(r => r.achat > 0)
  const avgMarge = rvsPourMarge.length
    ? rvsPourMarge.reduce((s,r)=>{ const c=r.achat+r.frais; return s+(c>0?(r.vente-c)/c*100:0) },0)/rvsPourMarge.length
    : 0

  const totalBenef = vendu.reduce((s,r)=>s+(r.vente-r.achat-r.frais),0)
  const totalVente = vendu.reduce((s,r)=>s+r.vente,0)

  const a=+achat||0,f=+frais||0,v=+vente||0
  const previewBenef=v-(a+f)
  const previewMarge=(a+f)>0?previewBenef/(a+f)*100:0
  const showPreview=(a>0||v>0)&&v>0

  async function handleAdd() {
    if(!name.trim()||isNaN(+achat)||+achat<0)return
    setSaving(true)
    const today=new Date().toISOString().split('T')[0]
    await addRevente(userId,{
      name:name.trim(),cat,plat,
      achat:+achat,
      frais:+frais||0,
      vente:+vente||0,
      icon:RV_CATS[cat],
      date:today
    },currentMonth)
    await refreshData()
    setName('');setAchat('');setFrais('0');setVente('')
    setSaving(false)
  }

  async function handleSellNow(r) {
    setEditingId(r.id)
    setEditVente('')
    setEditFrais(String(r.frais||0))
  }

  async function handleConfirmSell(r) {
    if(!editVente||isNaN(+editVente)||+editVente<0)return
    await supabase.from('reventes').update({ vente: +editVente, frais: +editFrais||0 }).eq('id', r.id)
    await refreshData()
    setEditingId(null)
  }

  async function handleDelete(id) {
    await deleteRevente(id)
    await refreshData()
  }

  const filtered = filterStatus==='tout' ? rvs : filterStatus==='vendu' ? vendu : enAttente

  return(
    <div className="reventes-view">
      <div className="page-header fade-up">
        <div><h1 className="page-title">{fmtMonth(currentMonth)}</h1><p className="page-sub">Suivi des reventes</p></div>
        <div className="rv-summary">
          <div className="rv-sum-item"><span className="rv-sum-label">Revendu</span><span className="rv-sum-val blue">{fmt(totalVente)}</span></div>
          <div className="rv-sum-sep"/>
          <div className="rv-sum-item"><span className="rv-sum-label">Bénéfice</span><span className={`rv-sum-val ${totalBenef>=0?'green':'red'}`}>{totalBenef>=0?'+':'−'}{fmt(Math.abs(totalBenef))}</span></div>
          <div className="rv-sum-sep"/>
          <div className="rv-sum-item"><span className="rv-sum-label">Marge moy.</span><span className="rv-sum-val purple">{avgMarge.toFixed(1)} %</span></div>
          <div className="rv-sum-sep"/>
          <div className="rv-sum-item"><span className="rv-sum-label">En attente</span><span className="rv-sum-val" style={{color:'var(--gold)'}}>{enAttente.length} article{enAttente.length>1?'s':''}</span></div>
        </div>
      </div>

      <div className="add-box fade-up stagger-1">
        <div className="add-grid-3">
          <div className="field"><label>Article</label><input placeholder="Ex: iPhone 13…" value={name} onChange={e=>setName(e.target.value)}/></div>
          <div className="field"><label>Catégorie</label><select value={cat} onChange={e=>setCat(e.target.value)}>{Object.entries(RV_CATS).map(([k,v])=><option key={k} value={k}>{v} {k}</option>)}</select></div>
          <div className="field"><label>Plateforme</label><select value={plat} onChange={e=>setPlat(e.target.value)}>{PLATFORMS.map(p=><option key={p}>{p}</option>)}</select></div>
        </div>
        <div className="add-grid-4">
          <div className="field"><label>Prix d'achat (€)</label><input type="number" placeholder="0" value={achat} onChange={e=>setAchat(e.target.value)} min="0" step="0.01"/></div>
          <div className="field"><label>Frais annexes (€)</label><input type="number" placeholder="0" value={frais} onChange={e=>setFrais(e.target.value)} min="0" step="0.01"/></div>
          <div className="field"><label>Prix de vente (€) <span style={{color:'var(--text3)',fontWeight:400}}>— optionnel</span></label><input type="number" placeholder="Laisser vide si pas encore vendu" value={vente} onChange={e=>setVente(e.target.value)} min="0" step="0.01"/></div>
          <div className="field"><label>&nbsp;</label><button className="add-btn-rv" onClick={handleAdd} disabled={saving}><Plus size={16}/> Ajouter</button></div>
        </div>
        {showPreview&&(
          <div className="rv-preview fade-in">
            <div className="preview-row"><span>Coût total</span><span>{fmt(a+f)}</span></div>
            <div className="preview-row"><span>Prix de vente</span><span>{fmt(v)}</span></div>
            <div className="preview-divider"/>
            <div className="preview-row bold"><span>Bénéfice</span><span style={{color:previewBenef>=0?'var(--green)':'var(--red)'}}>{previewBenef>=0?'+':'−'}{fmt(Math.abs(previewBenef))}</span></div>
            {a > 0 && <div className="preview-row"><span>Marge</span><span className={`marge-badge ${previewMarge>=20?'good':previewMarge>=0?'ok':'bad'}`}>{previewMarge.toFixed(1)} %</span></div>}
            {a === 0 && <div className="preview-row"><span style={{color:'var(--text3)',fontSize:12}}>Marge non calculée (article gratuit)</span></div>}
          </div>
        )}
      </div>

      <div style={{display:'flex',gap:6,marginBottom:'1rem'}}>
        {['tout','vendu','en attente'].map(f=>(
          <button key={f} className={`filter-pill ${filterStatus===f?'active':''}`} onClick={()=>setFilterStatus(f)} style={{padding:'5px 14px',borderRadius:99,fontSize:12,fontWeight:500,border:'1px solid var(--line2)',background:filterStatus===f?'var(--accent-bg)':'transparent',color:filterStatus===f?'var(--accent)':'var(--text2)',cursor:'pointer'}}>
            {f==='tout'?'Tout':f==='vendu'?`Vendus (${vendu.length})`:`En attente (${enAttente.length})`}
          </button>
        ))}
      </div>

      <div className="rv-list fade-up stagger-2">
        {filtered.length===0&&<p className="empty-state">Aucun article ici !</p>}
        {[...filtered].reverse().map(r=>{
          const estVendu = r.vente > 0
          const cout=r.achat+r.frais
          const benef=r.vente-cout
          const marge=cout>0&&r.achat>0?benef/cout*100:null
          const col=marge!==null?(marge>=20?'#4ade80':marge>=0?'#60a5fa':'#f87171'):'var(--text2)'
          const bgcol=CAT_COLORS[r.cat]||'#9997a0'
          const d=new Date(r.date+'T00:00:00')

          return(
            <div key={r.id} className="rv-card" style={{opacity:estVendu?1:0.85,borderStyle:estVendu?'solid':'dashed'}}>
              <div className="rv-card-left">
                <div className="rv-card-icon" style={{background:bgcol+'22',color:bgcol}}>{r.icon||'📦'}</div>
                <div>
                  <div className="rv-card-name" style={{display:'flex',alignItems:'center',gap:7}}>
                    {r.name}
                    {!estVendu && <span style={{fontSize:11,padding:'2px 7px',borderRadius:99,background:'var(--gold-bg)',color:'var(--gold)',display:'inline-flex',alignItems:'center',gap:4}}><Clock size={10}/> En attente</span>}
                    {estVendu && <span style={{fontSize:11,padding:'2px 7px',borderRadius:99,background:'var(--green-bg)',color:'var(--green)',display:'inline-flex',alignItems:'center',gap:4}}><CheckCircle size={10}/> Vendu</span>}
                  </div>
                  <div className="rv-card-meta">
                    <span className="rv-cat-badge" style={{background:bgcol+'22',color:bgcol}}>{r.cat}</span>
                    <span className="rv-plat">{r.plat}</span>
                    <span className="rv-date">{d.toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</span>
                  </div>
                </div>
              </div>

              {editingId===r.id ? (
                <div style={{flex:1,display:'flex',gap:8,alignItems:'flex-end'}}>
                  <div style={{flex:1}}>
                    <label style={{fontSize:11,color:'var(--text3)',display:'block',marginBottom:4}}>Prix de vente (€)</label>
                    <input type="number" placeholder="0" value={editVente} onChange={e=>setEditVente(e.target.value)} style={{height:36}} autoFocus/>
                  </div>
                  <div style={{flex:1}}>
                    <label style={{fontSize:11,color:'var(--text3)',display:'block',marginBottom:4}}>Frais (€)</label>
                    <input type="number" value={editFrais} onChange={e=>setEditFrais(e.target.value)} style={{height:36}}/>
                  </div>
                  <button onClick={()=>handleConfirmSell(r)} style={{height:36,padding:'0 14px',background:'var(--green)',color:'#111',border:'none',borderRadius:'var(--radius)',fontSize:13,fontWeight:500,cursor:'pointer',whiteSpace:'nowrap'}}>✓ Confirmer</button>
                  <button onClick={()=>setEditingId(null)} style={{height:36,width:36,background:'transparent',border:'1px solid var(--line2)',borderRadius:'var(--radius)',color:'var(--text2)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><X size={14}/></button>
                </div>
              ) : (
                <div className="rv-card-nums">
                  <div className="rv-num"><span className="rv-num-label">Acheté</span><span className="rv-num-val">{r.achat===0?'Gratuit':fmt(r.achat)}</span></div>
                  <div className="rv-num"><span className="rv-num-label">Frais</span><span className="rv-num-val muted">{fmt(r.frais)}</span></div>
                  <div className="rv-num"><span className="rv-num-label">Vendu</span><span className="rv-num-val blue">{estVendu?fmt(r.vente):'—'}</span></div>
                  <div className="rv-num">
                    <span className="rv-num-label">Bénéf · Marge</span>
                    {estVendu
                      ? <span className="rv-num-val" style={{color:col}}>{benef>=0?'+':'−'}{fmt(Math.abs(benef))}{marge!==null?` · ${marge.toFixed(1)}%`:' · —'}</span>
                      : <span className="rv-num-val" style={{color:'var(--text3)'}}>En attente</span>
                    }
                  </div>
                </div>
              )}

              <div style={{display:'flex',flexDirection:'column',gap:5,flexShrink:0}}>
                {!estVendu && editingId!==r.id && (
                  <button onClick={()=>handleSellNow(r)} style={{height:32,padding:'0 10px',background:'var(--green-bg)',color:'var(--green)',border:'1px solid var(--green)',borderRadius:'var(--radius)',fontSize:12,fontWeight:500,cursor:'pointer',display:'flex',alignItems:'center',gap:4,whiteSpace:'nowrap'}}>
                    <Edit3 size={11}/> Vendu !
                  </button>
                )}
                <button className="rv-del" onClick={()=>handleDelete(r.id)}><Trash2 size={14}/></button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
