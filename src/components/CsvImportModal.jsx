import { useState, useRef, useMemo } from 'react'
import Papa from 'papaparse'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, Download } from 'lucide-react'
import { addRevente } from '../utils/db'
import { useT } from '../utils/i18n.jsx'
import './CsvImportModal.css'

// ════════════════════════════════════════════════════════════
// Mapping intelligent des en-têtes (FR + EN, accents tolérés)
// Conçu pour les utilisateurs qui tenaient leur propre Excel/Sheets
// ════════════════════════════════════════════════════════════
const FIELD_HINTS = {
  name:  ['article', 'item', 'nom', 'name', 'title', 'titre', 'produit', 'product', 'designation', 'description'],
  vente: ['vente', 'sale', 'prix vente', 'prix de vente', 'sale price', 'sold for', 'sold', 'revenu', 'revenue', 'price', 'prix', 'amount', 'total', 'paid'],
  achat: ['achat', 'cost', 'prix achat', 'prix d achat', 'buy price', 'purchase', 'cout', 'cout achat', 'investissement', 'investment'],
  frais: ['frais', 'fees', 'fee', 'commission', 'taxe', 'tax', 'shipping', 'livraison'],
  date:  ['date', 'date vente', 'sale date', 'date sold', 'sold on', 'date de vente'],
  plat:  ['plateforme', 'plateform', 'platform', 'plat', 'marketplace', 'site', 'canal'],
  cat:   ['categorie', 'category', 'cat', 'type', 'genre'],
}

// Normalise pour matcher : minuscules, sans accent, sans tirets/underscores
function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[-_.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function autoMap(field, headers) {
  const candidates = FIELD_HINTS[field] || []
  const normed = headers.map(h => norm(h))
  // 1. Match exact
  for (const cand of candidates) {
    const idx = normed.findIndex(h => h === cand)
    if (idx !== -1) return headers[idx]
  }
  // 2. Match "contient"
  for (const cand of candidates) {
    const idx = normed.findIndex(h => h.includes(cand))
    if (idx !== -1) return headers[idx]
  }
  return ''
}

// Parse un nombre depuis une string CSV (gère "12,50", "12.50", "€12.50", "$12", "1 234,56")
function parseNum(v) {
  if (v == null || v === '') return 0
  let s = String(v).trim()
  // Supprime devise et espaces
  s = s.replace(/[€$£¥\s]/g, '')
  // Si format européen (virgule décimale), convertir
  // ex: "1.234,56" → "1234.56" ou "12,50" → "12.50"
  if (s.match(/,\d{1,2}$/)) {
    s = s.replace(/\./g, '').replace(',', '.')
  }
  // Garde seulement chiffres, point, signe
  s = s.replace(/[^\d.-]/g, '')
  const n = parseFloat(s)
  return isNaN(n) ? 0 : n
}

// Parse une date depuis divers formats vers YYYY-MM-DD
function parseDate(v, fallback) {
  if (!v) return fallback
  const s = String(v).trim()
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (iso) return `${iso[1]}-${String(iso[2]).padStart(2,'0')}-${String(iso[3]).padStart(2,'0')}`
  const eu = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/)
  if (eu) return `${eu[3]}-${String(eu[2]).padStart(2,'0')}-${String(eu[1]).padStart(2,'0')}`
  const us = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (us) return `${us[3]}-${String(us[1]).padStart(2,'0')}-${String(us[2]).padStart(2,'0')}`
  try {
    const d = new Date(s)
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
  } catch {}
  return fallback
}

const CAT_ICONS = {
  électronique: '📱', mobilier: '🪑', vêtements: '👕',
  matériel: '🔧', livres: '📚', jeux: '🎮', autre: '📦',
}

// Mappe une valeur catégorie libre vers nos clés internes
function normalizeCat(raw, fallback) {
  const n = norm(raw)
  if (!n) return fallback
  const candidates = {
    'électronique': ['electronique', 'electronic', 'electronics', 'tech', 'phone', 'telephone'],
    'mobilier':     ['mobilier', 'meuble', 'furniture', 'home'],
    'vêtements':    ['vetement', 'vetements', 'clothes', 'clothing', 'fashion', 'mode'],
    'matériel':     ['materiel', 'material', 'tools', 'outils'],
    'livres':       ['livre', 'livres', 'book', 'books'],
    'jeux':         ['jeu', 'jeux', 'game', 'games', 'gaming', 'console'],
    'autre':        ['autre', 'other', 'misc', 'divers'],
  }
  for (const [key, keywords] of Object.entries(candidates)) {
    if (keywords.some(k => n.includes(k))) return key
  }
  return fallback
}

function downloadTemplate() {
  const csv = [
    'article,categorie,plateforme,prix_achat,frais,prix_vente,date',
    'Nike Air Max 90,vetements,Vinted,18.00,3.50,45.00,2026-04-12',
    'Pull Zara beige,vetements,Leboncoin,5.00,0,18.00,2026-04-15',
    'iPhone 12 coque,electronique,Vinted,2.00,1.20,12.00,2026-04-18',
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'icedep-modele.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export default function CsvImportModal({ open, onClose, userId, currentMonth, refreshData, isPremium }) {
  const t = useT()
  const fileInputRef = useRef(null)
  const [step, setStep] = useState('drop') // drop | mapping | importing | done
  const [rows, setRows] = useState([])
  const [headers, setHeaders] = useState([])
  const [mapping, setMapping] = useState({})
  const [defaultPlat, setDefaultPlat] = useState('Autre')
  const [defaultCat, setDefaultCat] = useState('autre')
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)
  const [imported, setImported] = useState(0)
  const [dragOver, setDragOver] = useState(false)

  function reset() {
    setStep('drop'); setRows([]); setHeaders([])
    setMapping({}); setError(''); setProgress(0); setImported(0)
  }

  function handleClose() {
    reset()
    onClose()
  }

  function parseFile(file) {
    setError('')
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      // Détection auto du séparateur : Excel FR utilise ;, Excel EN utilise ,
      delimitersToGuess: [',', ';', '\t', '|'],
      transformHeader: h => h.trim(),
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          setError(t('reventes.import_empty'))
          return
        }
        const heads = (results.meta.fields || []).filter(Boolean)
        if (heads.length === 0) {
          setError(t('reventes.import_error'))
          return
        }
        setHeaders(heads)
        setRows(results.data)
        setMapping({
          name:  autoMap('name',  heads),
          vente: autoMap('vente', heads),
          frais: autoMap('frais', heads),
          achat: autoMap('achat', heads),
          date:  autoMap('date',  heads),
          plat:  autoMap('plat',  heads),
          cat:   autoMap('cat',   heads),
        })
        setStep('mapping')
      },
      error: () => setError(t('reventes.import_error')),
    })
  }

  function onDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) parseFile(file)
  }

  function onFileSelect(e) {
    const file = e.target.files?.[0]
    if (file) parseFile(file)
  }

  async function handleImport() {
    if (!mapping.name || !mapping.vente) {
      setError(t('reventes.import_required'))
      return
    }
    setError('')
    setStep('importing')
    let ok = 0
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      const name  = String(r[mapping.name] || '').trim()
      const vente = parseNum(r[mapping.vente])
      if (!name) { setProgress(((i+1)/rows.length)*100); continue }
      const achat = mapping.achat ? parseNum(r[mapping.achat]) : 0
      const frais = mapping.frais ? parseNum(r[mapping.frais]) : 0
      const today = new Date().toISOString().split('T')[0]
      const date  = mapping.date ? parseDate(r[mapping.date], today) : today
      const monthKey = date.slice(0, 7) // YYYY-MM
      const plat = mapping.plat ? (String(r[mapping.plat] || '').trim() || defaultPlat) : defaultPlat
      const cat  = mapping.cat
        ? normalizeCat(r[mapping.cat], defaultCat)
        : defaultCat
      const { error: err } = await addRevente(userId, {
        name, cat, sub_cat: null, plat,
        achat, frais, vente,
        icon: CAT_ICONS[cat] || '📦',
        date,
      }, monthKey)
      if (!err) ok++
      setProgress(((i+1)/rows.length)*100)
    }
    setImported(ok)
    setStep('done')
    await refreshData()
  }

  const previewRows = useMemo(() => rows.slice(0, 5), [rows])
  const ALL_CATS = Object.keys(CAT_ICONS)

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        className="csv-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <motion.div
          className="csv-modal"
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          onClick={e => e.stopPropagation()}
        >
          <div className="csv-header">
            <div className="csv-header-text">
              <h2>{t('reventes.import_title')}</h2>
              <p>{t('reventes.import_desc')}</p>
            </div>
            <button className="csv-close" onClick={handleClose}><X size={18}/></button>
          </div>

          {!isPremium && (
            <div className="csv-locked">
              <AlertCircle size={16}/>
              {t('reventes.import_premium_only')}
            </div>
          )}

          {isPremium && step === 'drop' && (
            <>
              <div
                className={`csv-drop ${dragOver ? 'over' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={32}/>
                <p>{t('reventes.import_drop')}</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={onFileSelect}
                  style={{ display: 'none' }}
                />
              </div>
              <p className="csv-hint">{t('reventes.import_hint')}</p>
              <button className="csv-template-btn" onClick={downloadTemplate}>
                <Download size={14}/> {t('reventes.import_template')}
              </button>
              {error && <p className="csv-err">{error}</p>}
            </>
          )}

          {isPremium && step === 'mapping' && (
            <>
              <div className="csv-meta">
                <span className="csv-format-pill">
                  <FileSpreadsheet size={14}/>
                  {headers.length} colonnes
                </span>
                <span className="csv-count">
                  {rows.length} {t('reventes.import_rows')}
                </span>
              </div>

              <div className="csv-section-title">{t('reventes.import_mapping')}</div>
              <div className="csv-mapping-grid">
                {[
                  ['name',  t('reventes.import_col_article'),  true],
                  ['vente', t('reventes.import_col_vente'),    true],
                  ['achat', t('reventes.import_col_achat'),    false],
                  ['frais', t('reventes.import_col_frais'),    false],
                  ['date',  t('reventes.import_col_date'),     false],
                  ['plat',  t('reventes.import_col_plat'),     false],
                  ['cat',   t('reventes.import_col_cat'),      false],
                ].map(([field, label, required]) => (
                  <div key={field} className="csv-map-row">
                    <label>
                      {label}
                      {required && <span className="csv-required">*</span>}
                    </label>
                    <select
                      value={mapping[field] || ''}
                      onChange={e => setMapping({ ...mapping, [field]: e.target.value })}
                    >
                      <option value="">{t('reventes.import_col_none')}</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                ))}
              </div>

              <div className="csv-defaults">
                <div className="csv-map-row">
                  <label>{t('reventes.import_default_plat')}</label>
                  <input type="text" value={defaultPlat} onChange={e => setDefaultPlat(e.target.value)}/>
                </div>
                <div className="csv-map-row">
                  <label>{t('reventes.import_default_cat')}</label>
                  <select value={defaultCat} onChange={e => setDefaultCat(e.target.value)}>
                    {ALL_CATS.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
                  </select>
                </div>
              </div>

              <div className="csv-section-title">{t('reventes.import_preview')}</div>
              <div className="csv-preview-wrap">
                <table className="csv-preview">
                  <thead>
                    <tr>
                      {Object.entries(mapping).filter(([,v])=>v).map(([k,v]) => (
                        <th key={k}>{k} <span>({v})</span></th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((r, i) => (
                      <tr key={i}>
                        {Object.entries(mapping).filter(([,v])=>v).map(([k,v]) => (
                          <td key={k}>{String(r[v] ?? '').slice(0, 30)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {error && <p className="csv-err">{error}</p>}

              <div className="csv-actions">
                <button className="csv-btn-ghost" onClick={() => setStep('drop')}>
                  {t('reventes.import_cancel')}
                </button>
                <button className="csv-btn-primary" onClick={handleImport}>
                  {t('reventes.import_confirm')} ({rows.length})
                </button>
              </div>
            </>
          )}

          {isPremium && step === 'importing' && (
            <div className="csv-progress">
              <Loader2 className="csv-spin" size={32}/>
              <p>{t('reventes.import_progress')}…</p>
              <div className="csv-bar-track">
                <div className="csv-bar-fill" style={{ width: `${progress}%` }}/>
              </div>
              <small>{Math.round(progress)}%</small>
            </div>
          )}

          {isPremium && step === 'done' && (
            <div className="csv-done">
              <CheckCircle size={40}/>
              <h3>{imported} {t('reventes.import_success')} ✨</h3>
              <button className="csv-btn-primary" onClick={handleClose}>OK</button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
