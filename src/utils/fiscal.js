// ════════════════════════════════════════════════════════════
// Logique fiscale multi-pays (FR + GB pour l'instant)
// Calcul des seuils et alertes informatives à partir des reventes.
// ⚠️ Information éducative — ne remplace pas un conseil fiscal pro.
//
// Les messages des alertes sont retournés en CLÉS i18n (pas en texte
// brut) pour être traduits côté composant via t().
// ════════════════════════════════════════════════════════════

export const COUNTRIES = ['FR', 'GB']
export const DEFAULT_COUNTRY = 'FR'

export const FISCAL_THRESHOLDS = {
  FR: {
    DAC7_CA:           2000,    // €2,000 / an / plateforme
    DAC7_NB_VENTES:    30,      // OU 30 transactions / an / plateforme
    BIC_EXO:           305,     // exonération BIC non pro
    PRECIOUS_OBJECT:   5000,    // € — taxe forfaitaire si métaux/bijoux/art
    MICRO_BIC:         188700,  // plafond micro-BIC marchandises
    currency:          '€',
    locale:            'fr-FR',
  },
  GB: {
    TRADING_ALLOWANCE: 1000,    // £1,000 / an — au-delà : Self-Assessment
    PLATFORM_CA:       1700,    // ~ €2,000 en £ — DAC7 UK
    PLATFORM_SALES:    30,      // 30 ventes
    CGT_ANNUAL:        3000,    // £3,000 / an — annual exempt amount
    PERSONAL_ITEM:     6000,    // £6,000 / objet — CGT chargeable
    currency:          '£',
    locale:            'en-GB',
  },
}

/**
 * Récupère l'année (YYYY) d'une revente depuis month_key ou date
 */
function getYearOf(r) {
  const src = r.month_key || r.date || ''
  return src.slice(0, 4)
}

/**
 * Liste des années disponibles dans les données (triée descendant)
 */
export function getAvailableYears(reventes) {
  const years = new Set(reventes.map(getYearOf).filter(Boolean))
  if (years.size === 0) {
    years.add(String(new Date().getFullYear()))
  }
  return [...years].sort().reverse()
}

/**
 * Formatte un montant dans la devise du pays
 */
function fmtAmount(amount, country) {
  const t = FISCAL_THRESHOLDS[country] || FISCAL_THRESHOLDS.FR
  const num = Math.round(amount).toLocaleString(t.locale)
  // £ devant en GB, € après en FR (convention)
  return country === 'GB' ? `£${num}` : `${num} €`
}

/**
 * Calcule la synthèse fiscale pour une année + un pays
 */
export function computeFiscalSummary(allReventes, year, country = DEFAULT_COUNTRY) {
  const yearStr = String(year)
  const yearReventes = allReventes.filter(r => getYearOf(r) === yearStr)
  const sold = yearReventes.filter(r => r.vente > 0)

  const totalCA = sold.reduce((s, r) => s + r.vente, 0)
  const totalAchatYear = yearReventes.reduce(
    (s, r) => s + (r.achat || 0) + (r.frais || 0),
    0
  )
  const totalBenef = sold.reduce(
    (s, r) => s + (r.vente - (r.achat || 0) - (r.frais || 0)),
    0
  )
  const nbVentes = sold.length
  const nbEnAttente = yearReventes.length - nbVentes
  const maxSale = sold.reduce((max, r) => Math.max(max, r.vente), 0)

  const alerts = country === 'GB'
    ? computeAlertsGB({ totalCA, totalBenef, nbVentes, maxSale })
    : computeAlertsFR({ totalCA, totalBenef, nbVentes, maxSale })

  return {
    year: yearStr,
    country,
    currency: FISCAL_THRESHOLDS[country].currency,
    totalCA,
    totalBenef,
    totalAchat: totalAchatYear,
    nbVentes,
    nbEnAttente,
    maxSale,
    alerts,
    hasData: yearReventes.length > 0,
  }
}

// ── France ─────────────────────────────────────────────
function computeAlertsFR({ totalCA, totalBenef, nbVentes, maxSale }) {
  const T = FISCAL_THRESHOLDS.FR
  const list = []

  // Note éducative permanente
  list.push({
    id: 'edu',
    severity: 'info',
    icon: 'info',
    titleKey: 'fiscal.fr.edu.title',
    msgKey: 'fiscal.fr.edu.msg',
  })

  // Seuil DAC7
  const dac7Trigger = totalCA > T.DAC7_CA || nbVentes > T.DAC7_NB_VENTES
  list.push({
    id: 'dac7',
    severity: dac7Trigger ? 'warning' : 'ok',
    icon: 'platforms',
    titleKey: 'fiscal.fr.dac7.title',
    msgKey: dac7Trigger ? 'fiscal.fr.dac7.over' : 'fiscal.fr.dac7.under',
    progress: [
      { labelKey: 'fiscal.prog_ca', current: totalCA, target: T.DAC7_CA, kind: 'amount', pct: Math.min(100, (totalCA / T.DAC7_CA) * 100) },
      { labelKey: 'fiscal.prog_sales', current: nbVentes, target: T.DAC7_NB_VENTES, kind: 'count', pct: Math.min(100, (nbVentes / T.DAC7_NB_VENTES) * 100) },
    ],
  })

  // Seuil BIC 305€
  if (totalBenef > 0) {
    const exoTrigger = totalBenef > T.BIC_EXO
    list.push({
      id: 'bic_exo',
      severity: exoTrigger ? 'warning' : 'ok',
      icon: 'receipt',
      titleKey: 'fiscal.fr.bic.title',
      msgKey: exoTrigger ? 'fiscal.fr.bic.over' : 'fiscal.fr.bic.under',
      progress: [
        { labelKey: 'fiscal.prog_profit', current: totalBenef, target: T.BIC_EXO, kind: 'amount', pct: Math.min(100, (totalBenef / T.BIC_EXO) * 100) },
      ],
    })
  }

  // Vente >5000€ (objet précieux potentiel)
  if (maxSale >= T.PRECIOUS_OBJECT) {
    list.push({
      id: 'precious',
      severity: 'warning',
      icon: 'diamond',
      titleKey: 'fiscal.fr.precious.title',
      msgKey: 'fiscal.fr.precious.msg',
      msgVars: { amount: fmtAmount(maxSale, 'FR') },
    })
  }

  // Plafond micro-BIC
  if (totalCA > T.MICRO_BIC) {
    list.push({
      id: 'micro_bic_max',
      severity: 'critical',
      icon: 'alert',
      titleKey: 'fiscal.fr.micro.title',
      msgKey: 'fiscal.fr.micro.msg',
    })
  }

  return list
}

// ── United Kingdom ──────────────────────────────────────
function computeAlertsGB({ totalCA, totalBenef, nbVentes, maxSale }) {
  const T = FISCAL_THRESHOLDS.GB
  const list = []

  // Note éducative permanente
  list.push({
    id: 'edu',
    severity: 'info',
    icon: 'info',
    titleKey: 'fiscal.gb.edu.title',
    msgKey: 'fiscal.gb.edu.msg',
  })

  // Trading Allowance £1,000
  const allowanceTrigger = totalCA > T.TRADING_ALLOWANCE
  list.push({
    id: 'trading_allowance',
    severity: allowanceTrigger ? 'warning' : 'ok',
    icon: 'receipt',
    titleKey: 'fiscal.gb.allowance.title',
    msgKey: allowanceTrigger ? 'fiscal.gb.allowance.over' : 'fiscal.gb.allowance.under',
    progress: [
      { labelKey: 'fiscal.prog_ca', current: totalCA, target: T.TRADING_ALLOWANCE, kind: 'amount', pct: Math.min(100, (totalCA / T.TRADING_ALLOWANCE) * 100) },
    ],
  })

  // Platform reporting (HMRC, DAC7-equivalent UK)
  const platformTrigger = totalCA > T.PLATFORM_CA || nbVentes > T.PLATFORM_SALES
  list.push({
    id: 'platform_reporting',
    severity: platformTrigger ? 'warning' : 'ok',
    icon: 'platforms',
    titleKey: 'fiscal.gb.platform.title',
    msgKey: platformTrigger ? 'fiscal.gb.platform.over' : 'fiscal.gb.platform.under',
    progress: [
      { labelKey: 'fiscal.prog_ca', current: totalCA, target: T.PLATFORM_CA, kind: 'amount', pct: Math.min(100, (totalCA / T.PLATFORM_CA) * 100) },
      { labelKey: 'fiscal.prog_sales', current: nbVentes, target: T.PLATFORM_SALES, kind: 'count', pct: Math.min(100, (nbVentes / T.PLATFORM_SALES) * 100) },
    ],
  })

  // Capital Gains Tax annual exemption (sur les bénéfices)
  if (totalBenef > 0) {
    const cgtTrigger = totalBenef > T.CGT_ANNUAL
    list.push({
      id: 'cgt_annual',
      severity: cgtTrigger ? 'warning' : 'ok',
      icon: 'receipt',
      titleKey: 'fiscal.gb.cgt.title',
      msgKey: cgtTrigger ? 'fiscal.gb.cgt.over' : 'fiscal.gb.cgt.under',
      progress: [
        { labelKey: 'fiscal.prog_profit', current: totalBenef, target: T.CGT_ANNUAL, kind: 'amount', pct: Math.min(100, (totalBenef / T.CGT_ANNUAL) * 100) },
      ],
    })
  }

  // Vente > £6,000 — objet personnel haute valeur
  if (maxSale >= T.PERSONAL_ITEM) {
    list.push({
      id: 'precious',
      severity: 'warning',
      icon: 'diamond',
      titleKey: 'fiscal.gb.precious.title',
      msgKey: 'fiscal.gb.precious.msg',
      msgVars: { amount: fmtAmount(maxSale, 'GB') },
    })
  }

  return list
}
