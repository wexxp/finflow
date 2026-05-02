import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Receipt, Info, AlertTriangle, AlertOctagon, CheckCircle2,
  Globe, Gem, ChevronDown, ScrollText, Banknote, Sparkles
} from 'lucide-react'
import { fmt } from '../utils/storage'
import { getAllReventes } from '../utils/achievements'
import { computeFiscalSummary, getAvailableYears } from '../utils/fiscal'
import { AnimatedAmount, AnimatedInt, EASE_OUT_EXPO, SPRING_GENTLE, fadeUpVariants, containerVariants } from '../utils/motion'
import './FiscalView.css'

const SEVERITY_META = {
  ok:        { color: 'var(--green)', label: 'OK',          dot: 'var(--green)' },
  info:      { color: 'var(--blue)',  label: 'Information', dot: 'var(--blue)'  },
  warning:   { color: 'var(--gold)',  label: 'À surveiller',dot: 'var(--gold)'  },
  critical:  { color: 'var(--red)',   label: 'Important',   dot: 'var(--red)'   },
}

const ICON_MAP = {
  info:      Info,
  platforms: Globe,
  receipt:   ScrollText,
  diamond:   Gem,
  alert:     AlertOctagon,
}

function StatusIcon({ severity }) {
  if (severity === 'ok')      return <CheckCircle2 size={14}/>
  if (severity === 'warning') return <AlertTriangle size={14}/>
  if (severity === 'critical')return <AlertOctagon size={14}/>
  return <Info size={14}/>
}

// ════════════════════════════════════════════════════════════
// Carte d'alerte / information fiscale
// ════════════════════════════════════════════════════════════
function AlertCard({ alert }) {
  const meta = SEVERITY_META[alert.severity] || SEVERITY_META.info
  const Icon = ICON_MAP[alert.icon] || Info
  const [open, setOpen] = useState(alert.severity !== 'ok')

  return (
    <motion.article
      className={`fiscal-alert sev-${alert.severity}`}
      style={{ '--alert-color': meta.color }}
      variants={fadeUpVariants}
      whileHover={{ y: -2, transition: SPRING_GENTLE }}
    >
      <button
        className="fiscal-alert-head"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <div className="fiscal-alert-icon-wrap">
          <Icon size={18}/>
        </div>

        <div className="fiscal-alert-title-block">
          <div className="fiscal-alert-title">{alert.title}</div>
          <div className="fiscal-alert-status">
            <StatusIcon severity={alert.severity}/>
            <span>{meta.label}</span>
          </div>
        </div>

        <motion.div
          className="fiscal-alert-chevron"
          animate={{ rotate: open ? 180 : 0 }}
          transition={SPRING_GENTLE}
        >
          <ChevronDown size={16}/>
        </motion.div>
      </button>

      <motion.div
        className="fiscal-alert-body"
        initial={false}
        animate={{
          height: open ? 'auto' : 0,
          opacity: open ? 1 : 0,
        }}
        transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
        style={{ overflow: 'hidden' }}
      >
        <div className="fiscal-alert-body-inner">
          <p className="fiscal-alert-msg">{alert.message}</p>

          {alert.progress && alert.progress.length > 0 && (
            <div className="fiscal-progress-list">
              {alert.progress.map((p, i) => (
                <div key={i} className="fiscal-progress">
                  <div className="fiscal-progress-row">
                    <span className="fiscal-progress-label">{p.label}</span>
                    <span className="fiscal-progress-val">
                      {p.unit === '€' ? fmt(p.current) : p.current} / {p.unit === '€' ? fmt(p.target) : p.target}
                    </span>
                  </div>
                  <div className="fiscal-progress-track">
                    <motion.div
                      className="fiscal-progress-fill"
                      style={{ background: p.pct >= 100 ? meta.color : 'var(--text2)' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${p.pct}%` }}
                      transition={{ duration: 0.9, delay: 0.1, ease: EASE_OUT_EXPO }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.article>
  )
}

// ════════════════════════════════════════════════════════════
// Sélecteur d'année (pills)
// ════════════════════════════════════════════════════════════
function YearPicker({ year, years, onChange }) {
  return (
    <div className="fiscal-year-picker" role="tablist" aria-label="Année fiscale">
      {years.map(y => (
        <button
          key={y}
          role="tab"
          aria-selected={y === year}
          className={`fiscal-year-pill ${y === year ? 'active' : ''}`}
          onClick={() => onChange(y)}
        >
          {y === year && (
            <motion.span
              layoutId="fiscalYearActive"
              className="fiscal-year-pill-bg"
              transition={SPRING_GENTLE}
            />
          )}
          <span className="fiscal-year-pill-label">{y}</span>
        </button>
      ))}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// Vue principale
// ════════════════════════════════════════════════════════════
export default function FiscalView({ data }) {
  const allReventes = useMemo(() => getAllReventes(data), [data])
  const availableYears = useMemo(() => getAvailableYears(allReventes), [allReventes])
  const [year, setYear] = useState(availableYears[0] || String(new Date().getFullYear()))

  const summary = useMemo(
    () => computeFiscalSummary(allReventes, year),
    [allReventes, year]
  )

  return (
    <div className="fiscal-view">
      <motion.div
        className="page-header fiscal-header"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
      >
        <div>
          <h1 className="page-title">
            <Receipt size={26} style={{ verticalAlign: '-3px', marginRight: 8, color: 'var(--accent)' }}/>
            Fiscal
          </h1>
          <p className="page-sub">Synthèse fiscale de vos reventes</p>
        </div>
        <YearPicker year={year} years={availableYears} onChange={setYear}/>
      </motion.div>

      {/* ── KPIs ───────────────────────────────────────── */}
      <motion.div
        className="fiscal-kpis"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05, ease: EASE_OUT_EXPO }}
      >
        <div className="fiscal-kpi">
          <span className="fiscal-kpi-label">Chiffre d'affaires</span>
          <span className="fiscal-kpi-value blue">
            <AnimatedAmount value={summary.totalCA} duration={1.1}/>
          </span>
          <span className="fiscal-kpi-sub">total des ventes {year}</span>
        </div>

        <div className="fiscal-kpi">
          <span className="fiscal-kpi-label">Bénéfices</span>
          <span className={`fiscal-kpi-value ${summary.totalBenef >= 0 ? 'green' : 'red'}`}>
            <AnimatedAmount value={summary.totalBenef} signed duration={1.1}/>
          </span>
          <span className="fiscal-kpi-sub">après achats &amp; frais</span>
        </div>

        <div className="fiscal-kpi">
          <span className="fiscal-kpi-label">Ventes</span>
          <span className="fiscal-kpi-value">
            <AnimatedInt value={summary.nbVentes} duration={1.2}/>
          </span>
          <span className="fiscal-kpi-sub">articles vendus</span>
        </div>

        <div className="fiscal-kpi">
          <span className="fiscal-kpi-label">En attente</span>
          <span className="fiscal-kpi-value gold">
            <AnimatedInt value={summary.nbEnAttente} duration={1.2}/>
          </span>
          <span className="fiscal-kpi-sub">articles non vendus</span>
        </div>
      </motion.div>

      {/* ── Empty state ────────────────────────────────── */}
      {!summary.hasData && (
        <motion.div
          className="fiscal-empty"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Banknote size={36} style={{ color: 'var(--text3)', marginBottom: 10 }}/>
          <p className="fiscal-empty-title">Aucune revente en {year}</p>
          <p className="fiscal-empty-sub">Ajoutez des reventes dans l'onglet Reventes pour voir s'afficher votre synthèse fiscale.</p>
        </motion.div>
      )}

      {/* ── Liste des alertes ──────────────────────────── */}
      {summary.hasData && (
        <section className="fiscal-section">
          <div className="fiscal-section-head">
            <h2 className="fiscal-section-title">
              <Sparkles size={15} style={{ verticalAlign: '-2px', marginRight: 6, color: 'var(--accent)' }}/>
              Informations fiscales
            </h2>
            <span className="fiscal-section-sub">Calculé d'après les reventes de {year}</span>
          </div>

          <motion.div
            className="fiscal-alert-list"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {summary.alerts.map(a => <AlertCard key={a.id} alert={a}/>)}
          </motion.div>
        </section>
      )}

      {/* ── Disclaimer permanent ───────────────────────── */}
      <motion.div
        className="fiscal-disclaimer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        role="note"
      >
        <Info size={14} style={{ flexShrink: 0, marginTop: 2 }}/>
        <p>
          <strong>Information éducative.</strong> ICEdep n'est pas un cabinet fiscal et ne fournit pas de conseil personnalisé. Pour toute situation complexe ou en cas de doute, consultez le site officiel <a href="https://www.impots.gouv.fr" target="_blank" rel="noopener noreferrer">impots.gouv.fr</a> ou un expert-comptable.
        </p>
      </motion.div>
    </div>
  )
}
