import { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Receipt, Info, AlertTriangle, AlertOctagon, CheckCircle2,
  Globe, Gem, ChevronDown, ScrollText, Banknote, Sparkles
} from 'lucide-react'
import { fmt } from '../utils/storage'
import { getAllReventes } from '../utils/achievements'
import { computeFiscalSummary, getAvailableYears, COUNTRIES, DEFAULT_COUNTRY, FISCAL_THRESHOLDS } from '../utils/fiscal'
import { AnimatedAmount, AnimatedInt, EASE_OUT_EXPO, SPRING_GENTLE, fadeUpVariants, containerVariants } from '../utils/motion'
import { useT } from '../utils/i18n.jsx'
import './FiscalView.css'

const COUNTRY_KEY = 'icedep_fiscal_country'

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

// Interpolation simple {var} → value
function interp(str, vars = {}) {
  if (!vars) return str
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v)),
    str
  )
}

// Format un montant dans la devise du pays (GB = £ avant, FR = € après)
function fmtCurrency(amount, country) {
  const t = FISCAL_THRESHOLDS[country] || FISCAL_THRESHOLDS.FR
  const num = Math.round(amount).toLocaleString(t.locale)
  return country === 'GB' ? `£${num}` : `${num} €`
}

// ════════════════════════════════════════════════════════════
// Carte d'alerte / information fiscale
// ════════════════════════════════════════════════════════════
function AlertCard({ alert, t, country }) {
  const SEVERITY = {
    ok:        { color: 'var(--green)', label: t('fiscal.severity_ok') },
    info:      { color: 'var(--blue)',  label: t('fiscal.severity_info') },
    warning:   { color: 'var(--gold)',  label: t('fiscal.severity_warning') },
    critical:  { color: 'var(--red)',   label: t('fiscal.severity_critical') },
  }
  const meta = SEVERITY[alert.severity] || SEVERITY.info
  const Icon = ICON_MAP[alert.icon] || Info
  const [open, setOpen] = useState(alert.severity !== 'ok')

  const title   = t(alert.titleKey)
  const message = interp(t(alert.msgKey), alert.msgVars)

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
          <div className="fiscal-alert-title">{title}</div>
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
          <p className="fiscal-alert-msg">{message}</p>

          {alert.progress && alert.progress.length > 0 && (
            <div className="fiscal-progress-list">
              {alert.progress.map((p, i) => (
                <div key={i} className="fiscal-progress">
                  <div className="fiscal-progress-row">
                    <span className="fiscal-progress-label">{t(p.labelKey)}</span>
                    <span className="fiscal-progress-val">
                      {p.kind === 'amount'
                        ? `${fmtCurrency(p.current, country)} / ${fmtCurrency(p.target, country)}`
                        : `${p.current} / ${p.target}`}
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
    <div className="fiscal-year-picker" role="tablist" aria-label="Year">
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
// Sélecteur de pays (pills avec drapeau)
// ════════════════════════════════════════════════════════════
function CountryPicker({ country, onChange, t }) {
  return (
    <div className="fiscal-country-picker" role="tablist" aria-label={t('fiscal.country_label')}>
      {COUNTRIES.map(c => (
        <button
          key={c}
          role="tab"
          aria-selected={c === country}
          className={`fiscal-country-pill ${c === country ? 'active' : ''}`}
          onClick={() => onChange(c)}
        >
          {c === country && (
            <motion.span
              layoutId="fiscalCountryActive"
              className="fiscal-country-pill-bg"
              transition={SPRING_GENTLE}
            />
          )}
          <span className="fiscal-country-pill-label">{t(`fiscal.country.${c.toLowerCase()}`)}</span>
        </button>
      ))}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// Vue principale
// ════════════════════════════════════════════════════════════
export default function FiscalView({ data }) {
  const t = useT()
  const allReventes = useMemo(() => getAllReventes(data), [data])
  const availableYears = useMemo(() => getAvailableYears(allReventes), [allReventes])
  const [year, setYear] = useState(availableYears[0] || String(new Date().getFullYear()))

  // Pays : persisté en localStorage
  const [country, setCountryState] = useState(() => {
    try {
      const stored = localStorage.getItem(COUNTRY_KEY)
      if (COUNTRIES.includes(stored)) return stored
    } catch {}
    return DEFAULT_COUNTRY
  })
  useEffect(() => {
    try { localStorage.setItem(COUNTRY_KEY, country) } catch {}
  }, [country])
  const setCountry = (c) => { if (COUNTRIES.includes(c)) setCountryState(c) }

  const summary = useMemo(
    () => computeFiscalSummary(allReventes, year, country),
    [allReventes, year, country]
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
            {t('fiscal.title')}
          </h1>
          <p className="page-sub">{t('fiscal.subtitle')}</p>
        </div>
        <div className="fiscal-pickers">
          <CountryPicker country={country} onChange={setCountry} t={t}/>
          <YearPicker year={year} years={availableYears} onChange={setYear}/>
        </div>
      </motion.div>

      {/* ── KPIs ───────────────────────────────────────── */}
      <motion.div
        className="fiscal-kpis"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05, ease: EASE_OUT_EXPO }}
      >
        <div className="fiscal-kpi">
          <span className="fiscal-kpi-label">{t('fiscal.kpi_ca')}</span>
          <span className="fiscal-kpi-value blue">
            <AnimatedAmount value={summary.totalCA} duration={1.1}/>
          </span>
          <span className="fiscal-kpi-sub">{interp(t('fiscal.kpi_ca_sub'), { year })}</span>
        </div>

        <div className="fiscal-kpi">
          <span className="fiscal-kpi-label">{t('fiscal.kpi_profit')}</span>
          <span className={`fiscal-kpi-value ${summary.totalBenef >= 0 ? 'green' : 'red'}`}>
            <AnimatedAmount value={summary.totalBenef} signed duration={1.1}/>
          </span>
          <span className="fiscal-kpi-sub">{t('fiscal.kpi_profit_sub')}</span>
        </div>

        <div className="fiscal-kpi">
          <span className="fiscal-kpi-label">{t('fiscal.kpi_sales')}</span>
          <span className="fiscal-kpi-value">
            <AnimatedInt value={summary.nbVentes} duration={1.2}/>
          </span>
          <span className="fiscal-kpi-sub">{t('fiscal.kpi_sales_sub')}</span>
        </div>

        <div className="fiscal-kpi">
          <span className="fiscal-kpi-label">{t('fiscal.kpi_pending')}</span>
          <span className="fiscal-kpi-value gold">
            <AnimatedInt value={summary.nbEnAttente} duration={1.2}/>
          </span>
          <span className="fiscal-kpi-sub">{t('fiscal.kpi_pending_sub')}</span>
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
          <p className="fiscal-empty-title">{interp(t('fiscal.empty_title'), { year })}</p>
          <p className="fiscal-empty-sub">{t('fiscal.empty_sub')}</p>
        </motion.div>
      )}

      {/* ── Liste des alertes ──────────────────────────── */}
      {summary.hasData && (
        <section className="fiscal-section">
          <div className="fiscal-section-head">
            <h2 className="fiscal-section-title">
              <Sparkles size={15} style={{ verticalAlign: '-2px', marginRight: 6, color: 'var(--accent)' }}/>
              {t('fiscal.section_title')}
            </h2>
            <span className="fiscal-section-sub">{interp(t('fiscal.section_sub'), { year })}</span>
          </div>

          <motion.div
            className="fiscal-alert-list"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            key={`${country}-${year}`} /* re-stagger quand on change pays/année */
          >
            {summary.alerts.map(a => <AlertCard key={a.id} alert={a} t={t} country={country}/>)}
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
          <strong>{t('fiscal.disclaimer_intro')}</strong>{' '}
          {country === 'GB' ? t('fiscal.disclaimer_gb') : t('fiscal.disclaimer_fr')}{' '}
          {country === 'FR' && (
            <a href="https://www.impots.gouv.fr" target="_blank" rel="noopener noreferrer">impots.gouv.fr</a>
          )}
          {country === 'GB' && (
            <a href="https://www.gov.uk/government/organisations/hm-revenue-customs" target="_blank" rel="noopener noreferrer">gov.uk/HMRC</a>
          )}
        </p>
      </motion.div>
    </div>
  )
}
