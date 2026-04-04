import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { fmt, fmtMonth } from '../utils/storage'
import { addRevente, deleteRevente } from '../utils/db'
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

  const rvs=monthData?.reventes||[]
  const totalBenef=rvs.reduce((s,r)=>s+(r.vente-r.achat-r.frais),0)
  const totalVente=rvs.reduce((s,r)=>s+r.vente,0)
  const avgMarge=rvs.length?rvs.reduce((s,r)=>{const c=r.achat+r.frais;return s+(c>0?(r.vente-c)/c*100:0)},0)/rvs.length:0

  const a=+achat||0,f=+frais||0,v=+vente||0
  const previewBenef=v-(a+f)
  const previewMarge=(a+f)>0?previewBenef/(a+f)*100:0
  const showPreview=a>0||v>0

  async function handleAdd() {
    if(!name.trim()||isNaN(+achat)||isNaN(+vente)||+achat<0||+vente<0)return
    setSaving(true)
    const today=new Date().toISOString().split('T')[0]
    await addRevente(userId,{name:name.trim(),cat,plat,achat:+achat,frais:+frais||0,vente:+vente,icon:RV_CATS[cat],date:today},currentMonth)
    await refreshData()
    setName('');setAchat('');setFrais('0');setVente('')
    setSaving(false)
  }

  async function handleDelete(id) {
    await deleteRevente(id)
    await refreshData()
  }

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
          <div className="field"><label>Prix de vente (€)</label><input type="number" placeholder="0" value={vente} onChange={e=>setVente(e.target.value)} min="0" step="0.01"/></div>
          <div className="field"><label>&nbsp;</label><button className="add-btn-rv" onClick={handleAdd} disabled={saving}><Plus size={16}/> Ajouter</button></div>
        </div>
        {showPreview&&(
          <div className="rv-preview fade-in">
            <div className="preview-row"><span>Coût total</span><span>{fmt(a+f)}</span></div>
            <div className="preview-row"><span>Prix de vente</span><span>{fmt(v)}</span></div>
            <div className="preview-divider"/>
            <div className="preview-row bold"><span>Bénéfice</span><span style={{color:previewBenef>=0?'var(--green)':'var(--red)'}}>{previewBenef>=0?'+':'−'}{fmt(Math.abs(previewBenef))}</span></div>
            <div className="preview-row"><span>Marge</span><span className={`marge-badge ${previewMarge>=20?'good':previewMarge>=0?'ok':'bad'}`}>{previewMarge.toFixed(1)} %</span></div>
          </div>
        )}
      </div>

      <div className="rv-list fade-up stagger-2">
        {rvs.length===0&&<p className="empty-state">Aucune revente ce mois !</p>}
        {[...rvs].reverse().map(r=>{
          const cout=r.achat+r.frais,benef=r.vente-cout,marge=cout>0?benef/cout*100:0
          const col=marge>=20?'#4ade80':marge>=0?'#60a5fa':'#f87171'
          const bgcol=CAT_COLORS[r.cat]||'#9997a0'
          const d=new Date(r.date+'T00:00:00')
          return(
            <div key={r.id} className="rv-card">
              <div className="rv-card-left">
                <div className="rv-card-icon" style={{background:bgcol+'22',color:bgcol}}>{r.icon||'📦'}</div>
                <div>
                  <div className="rv-card-name">{r.name}</div>
                  <div className="rv-card-meta">
                    <span className="rv-cat-badge" style={{background:bgcol+'22',color:bgcol}}>{r.cat}</span>
                    <span className="rv-plat">{r.plat}</span>
                    <span className="rv-date">{d.toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</span>
                  </div>
                </div>
              </div>
              <div className="rv-card-nums">
                <div className="rv-num"><span className="rv-num-label">Acheté</span><span className="rv-num-val">{fmt(r.achat)}</span></div>
                <div className="rv-num"><span className="rv-num-label">Frais</span><span className="rv-num-val muted">{fmt(r.frais)}</span></div>
                <div className="rv-num"><span className="rv-num-label">Vendu</span><span className="rv-num-val blue">{fmt(r.vente)}</span></div>
                <div className="rv-num"><span className="rv-num-label">Bénéf · Marge</span><span className="rv-num-val" style={{color:col}}>{benef>=0?'+':'−'}{fmt(Math.abs(benef))} · {marge.toFixed(1)}%</span></div>
              </div>
              <button className="rv-del" onClick={()=>handleDelete(r.id)}><Trash2 size={14}/></button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
