// ════════════════════════════════════════════════════════════
// Logique fiscale FR pour les revendeurs
// Calcul des seuils et alertes informatives à partir des reventes
// ⚠️ Ces informations sont éducatives — ne remplacent pas un conseil
//    fiscal professionnel.
// ════════════════════════════════════════════════════════════

export const FISCAL_THRESHOLDS = {
  // DAC7 (Directive Européenne, en vigueur depuis 2024)
  // Au-delà, les plateformes (Vinted, Leboncoin, eBay…) doivent transmettre
  // automatiquement les données du vendeur à la DGFiP
  DAC7_CA: 2000,           // 2 000 € de CA / an / plateforme
  DAC7_NB_VENTES: 30,      // OU 30 transactions / an / plateforme

  // Seuil 305€ : exonération BIC non professionnel (CGI art 50-0)
  // Si activité non habituelle ET recettes < 305€/an : exonéré
  BIC_EXO: 305,

  // Cession d'objets précieux (or, bijoux, œuvres d'art, métaux)
  // Au-delà de 5000€ par objet : taxe forfaitaire applicable
  PRECIOUS_OBJECT: 5000,

  // Plafond micro-BIC vente de marchandises (LF 2024)
  // Au-delà : passage au régime réel obligatoire
  MICRO_BIC_MARCHANDISES: 188700,
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
    // Fallback : année courante
    years.add(String(new Date().getFullYear()))
  }
  return [...years].sort().reverse()
}

/**
 * Calcule la synthèse fiscale pour une année donnée
 */
export function computeFiscalSummary(allReventes, year) {
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

  const alerts = computeAlerts({ totalCA, totalBenef, nbVentes, maxSale })

  return {
    year: yearStr,
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

function computeAlerts({ totalCA, totalBenef, nbVentes, maxSale }) {
  const list = []

  // ── Note éducative permanente ──────────────────────────
  list.push({
    id: 'edu_occasionnel',
    severity: 'info',
    icon: 'info',
    title: 'Vente d\'occasion vs achat-revente',
    message: 'Si vous revendez vos affaires personnelles déjà possédées, c\'est généralement non imposable. Si vous achetez pour revendre régulièrement, c\'est une activité commerciale (BIC) à déclarer aux impôts.',
  })

  // ── Seuil DAC7 ─────────────────────────────────────────
  const dac7CaPct  = (totalCA / FISCAL_THRESHOLDS.DAC7_CA) * 100
  const dac7NbPct  = (nbVentes / FISCAL_THRESHOLDS.DAC7_NB_VENTES) * 100
  const dac7Trigger = totalCA > FISCAL_THRESHOLDS.DAC7_CA || nbVentes > FISCAL_THRESHOLDS.DAC7_NB_VENTES

  list.push({
    id: 'dac7',
    severity: dac7Trigger ? 'warning' : 'ok',
    icon: 'platforms',
    title: 'Déclaration automatique des plateformes (DAC7)',
    message: dac7Trigger
      ? 'Vous dépassez le seuil DAC7 (2 000 € OU 30 ventes par an et par plateforme). Vinted, Leboncoin, eBay… transmettent automatiquement vos données à la DGFiP. Cela ne signifie pas que vous devez payer un impôt — mais le fisc est informé de votre activité.'
      : 'Vous êtes sous le seuil DAC7. Les plateformes ne transmettent pas vos données à la DGFiP cette année.',
    progress: [
      { label: 'Chiffre d\'affaires', current: totalCA, target: FISCAL_THRESHOLDS.DAC7_CA, unit: '€', pct: Math.min(100, dac7CaPct) },
      { label: 'Nombre de ventes',   current: nbVentes, target: FISCAL_THRESHOLDS.DAC7_NB_VENTES, unit: '', pct: Math.min(100, dac7NbPct) },
    ],
  })

  // ── Seuil BIC exonération (305€) ───────────────────────
  // Pertinent uniquement si l'utilisateur fait de l'achat-revente
  if (totalBenef > 0) {
    const exoTrigger = totalBenef > FISCAL_THRESHOLDS.BIC_EXO
    list.push({
      id: 'bic_exo',
      severity: exoTrigger ? 'warning' : 'ok',
      icon: 'receipt',
      title: 'Bénéfices BIC — seuil 305 €',
      message: exoTrigger
        ? `Vos bénéfices reventes dépassent 305 € pour ${nbVentes > 0 ? 'cette année' : 'ce périmètre'}. Si vous achetez pour revendre, ces gains sont à déclarer en BIC sur votre déclaration de revenus.`
        : 'Vos bénéfices restent sous le seuil de 305 €. Si votre activité est non habituelle, l\'exonération BIC peut s\'appliquer.',
      progress: [
        { label: 'Bénéfices cumulés', current: totalBenef, target: FISCAL_THRESHOLDS.BIC_EXO, unit: '€', pct: Math.min(100, (totalBenef / FISCAL_THRESHOLDS.BIC_EXO) * 100) },
      ],
    })
  }

  // ── Vente >5000€ (objet précieux potentiel) ────────────
  if (maxSale >= FISCAL_THRESHOLDS.PRECIOUS_OBJECT) {
    list.push({
      id: 'precious',
      severity: 'warning',
      icon: 'diamond',
      title: 'Vente supérieure à 5 000 € détectée',
      message: `Vous avez réalisé une vente à ${formatEur(maxSale)}. Pour les métaux précieux, bijoux, œuvres d'art ou objets de collection, une taxe forfaitaire (6,5 % ou 11 %) peut s'appliquer. Vérifiez la nature de l'article.`,
    })
  }

  // ── Plafond micro-BIC ──────────────────────────────────
  if (totalCA > FISCAL_THRESHOLDS.MICRO_BIC_MARCHANDISES) {
    list.push({
      id: 'micro_bic_max',
      severity: 'critical',
      icon: 'alert',
      title: 'Plafond micro-BIC dépassé',
      message: `Votre chiffre d'affaires dépasse 188 700 € (plafond du régime micro-BIC pour la vente de marchandises). Vous devez basculer sur le régime réel d'imposition.`,
    })
  }

  return list
}

function formatEur(n) {
  return Math.round(n).toLocaleString('fr-FR') + ' €'
}
