import { useState, useRef, useMemo } from 'react'
import Papa from 'papaparse'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { addRevente } from '../utils/db'
import { useT } from '../utils/i18n.jsx'
import './CsvImportModal.css'

// ════════════════════════════════════════════════════════════
// Détection automatique du format selon les en-têtes de colonnes
// ════════════════════════════════════════════════════════════
const FORMATS = {
  vinted: {
    label: 'Vinted',
    signals: ['vinted', 'transaction id', 'item title', 'item price'],
    map: {
      name:  ['item title', 'article', 'titre', 'nom'],
      vente: ['item price', 'sale price', 'prix vente', 'price', 'total'],
      frais: ['fee', 'fees', 'commission', 'frais'],
      achat: ['cost', 'prix achat', 'cost price'],
      date:  ['date', 'sale date', 'completed at', 'transaction date'],
      plat:  [], // forcé à 'Vinted'
    },
    defaultPlat: 'Vinted',
  },
  ebay: {
    label: 'eBay',
    signals: ['ebay', 'item id', 'buyer username', 'sale amount'],
    map: {
      name:  ['item title', 'title', 'listing title'],
      vente: ['sale amount', 'total amount', 'item price', 'sold for'],
      frais: ['ebay fees', 'final value fee', 'fees', 'commission'],
      achat: ['cost', 'purchase price'],
      date:  ['sale date', 'date sold', 'transaction date', 'date'],
      plat:  [],
    },
    defaultPlat: 'eBay',
  },
  vestiaire: {
    label: 'Vestiaire Collective',
    signals: ['vestiaire', 'designer', 'reference'],
    map: {
      name:  ['item', 'designer', 'product name', 'title'],
      vente: ['final price', 'sale price', 'paid', 'amount'],
      frais: ['commission', 'fees'],
      achat: ['cost'],
      date:  ['sold on', 'date', 'sale date'],
      plat:  [],
    },
    defaultPlat: 'Vestiaire Collectif',
  },
  generic: {
    label: 'Generic',
    signals: [],
    map: {
      name:  ['article', 'item', 'nom', 'name', 'title', 'produit', 'product'],
      vente: ['vente', 'sale', 'prix_vente', 'sale_price', 'price', 'prix', 'amount'],
      frais: ['frais', 'fees', 'fee', 'commission'],
      achat: ['achat', 'cost', 'prix_achat', 'cost_price', 'buy', 'purchase'],
      date:  ['date'],
      plat:  ['plateforme', 'platform', 'plat', 'marketplace'],
      cat:   ['catégorie', 'categorie', 'category', 'cat'],
    },
    defaultPlat: 'Autre',
  },
}

function detectFormat(headers) {
  const lowered = headers.map(h => h.toLowerCase().trim())
  for (const key of ['vinted', 'ebay', 'vestiaire']) {
    const fmt = FORMATS[key]
    if (fmt.signals.some(sig => lowered.some(h => h.includes(sig)))) {
      return key
    }
  }
  return 'generic'
}

// Renvoie le nom de colonne correspondant pour un champ donné (ou '')
function autoMap(field, headers, formatKey) {
  const fmt = FORMATS[formatKey]
  const candidates = (fmt.map[field] || []).concat(FORMATS.generic.map[field] || [])
  const lowered = headers.map(h => h.toLowerCase().trim())
  for (const cand of candidates) {
    const idx = lowered.findIndex(h => h === cand || h.includes(cand))
    if (idx !== -1) return headers[idx]
  }
  return ''
}

// Parse un nombre depuis une string CSV (gère "12,50", "12.50", "€12.50", "$12")
function parseNum(v) {
  if (v == null || v === '') return 0
  const cleaned = String(v).replace(/[^\d.,-]/g, '').replace(',', '.')
  const n = parseFloat(cleaned)
  return isNaN(n) ? 0 : n
}

// Parse une date depuis divers formats vers YYYY-MM-DD
function parseDate(v, fallback) {
  if (!v) return fallback
  const s = String(v).trim()
  // ISO
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  // DD/MM/YYYY ou DD-MM-YYYY
  const eu = s.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})/)
  if (eu) return `${eu[3]}-${eu[2]}-${eu[1]}`
  // MM/DD/YYYY
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

export default function CsvImportModal({ open, onClose, userId, currentMonth, refreshData, isPremium }) {
  const t = useT()
  const fileInputRef = useRef(null)
  const [step, setStep] = useState('drop') // drop | mapping | importing | done
  const [rows, setRows] = useState([])
  const [headers, setHeaders] = useState([])
  const [formatKey, setFormatKey] = useState('generic')
  const [mapping, setMapping] = useState({})
  const [defaultPlat, setDefaultPlat] = useState('Autre')
  const [defaultCat, setDefaultCat] = useState('autre')
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)
  const [imported, setImported] = useState(0)
  const [dragOver, setDragOver] = useState(false)

  function reset() {
    setStep('drop'); setRows([]); setHeaders([]); setFormatKey('generic')
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
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          setError(t('reventes.import_empty'))
          return
        }
        const heads = results.meta.fields || []
        const detected = detectFormat(heads)
        setHeaders(heads)
        setRows(results.data)
        setFormatKey(detected)
        setDefaultPlat(FORMATS[detected].defaultPlat)
        setMapping({
          name:  autoMap('name',  heads, detected),
          vente: autoMap('vente', heads, detected),
          frais: autoMap('frais', heads, detected),
          achat: autoMap('achat', heads, detected),
          date:  autoMap('date',  heads, detected),
          plat:  autoMap('plat',  heads, detected),
          cat:   autoMap('cat',   heads, detected),
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
      if (!name || vente <= 0) { setProgress(((i+1)/rows.length)*100); continue }
      const achat = mapping.achat ? parseNum(r[mapping.achat]) : 0
      const frais = mapping.frais ? parseNum(r[mapping.frais]) : 0
      const today = new Date().toISOString().split('T')[0]
      const date  = mapping.date ? parseDate(r[mapping.date], today) : today
      const monthKey = date.slice(0, 7) // YYYY-MM (peut différer du mois courant)
      const plat = mapping.plat ? (String(r[mapping.plat] || '').trim() || defaultPlat) : defaultPlat
      const cat  = mapping.cat
        ? (String(r[mapping.cat] || '').trim().toLowerCase() || defaultCat)
        : defaultCat
      const safeCat = CAT_ICONS[cat] ? cat : defaultCat
      const { error: err } = await addRevente(userId, {
        name, cat: safeCat, sub_cat: null, plat,
        achat, frais, vente,
        icon: CAT_ICONS[safeCat] || '📦',
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
              {error && <p className="csv-err">{error}</p>}
            </>
          )}

          {isPremium && step === 'mapping' && (
            <>
              <div className="csv-meta">
                <span className="csv-format-pill">
                  <FileSpreadsheet size={14}/>
                  {t('reventes.import_format_detected')} : <b>{FORMATS[formatKey].label}</b>
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
