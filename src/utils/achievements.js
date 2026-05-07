// ════════════════════════════════════════════════════════════
// Système de trophées pour la revente
// Stateless : tout est calculé à la volée depuis la liste reventes
// ════════════════════════════════════════════════════════════

// ── Helpers ──────────────────────────────────────────────
const sold = (rvs) => rvs.filter(r => r.vente > 0)

const benefOf = (r) => (r.vente || 0) - (r.achat || 0) - (r.frais || 0)
const margeOf = (r) => {
  const cost = (r.achat || 0) + (r.frais || 0)
  return cost > 0 ? (benefOf(r) / cost) * 100 : 0
}

const SOLD_COUNT  = (rvs) => sold(rvs).length
const TOTAL_PROFIT = (rvs) => sold(rvs).reduce((s, r) => s + benefOf(r), 0)
const BEST_SALE   = (rvs) => sold(rvs).reduce((max, r) => Math.max(max, benefOf(r)), 0)
const BEST_MARGIN = (rvs) => sold(rvs).filter(r => r.achat > 0).reduce((max, r) => Math.max(max, margeOf(r)), 0)

const monthKeyOf = (r) => r.month_key || (r.date ? r.date.slice(0, 7) : null)

// Plafonne la progression à la cible et empêche les valeurs négatives
const clamp = (current, target) => ({
  current: Math.max(0, Math.min(current, target)),
  target,
})

// Trophée binaire (oui/non)
const flag = (condition) => ({ current: condition ? 1 : 0, target: 1 })

// Max de ventes sur un mois calendaire
const maxMonthSales = (rvs) => {
  const counts = {}
  sold(rvs).forEach(r => {
    const k = monthKeyOf(r)
    if (!k) return
    counts[k] = (counts[k] || 0) + 1
  })
  const values = Object.values(counts)
  return values.length ? Math.max(...values) : 0
}

// Plus longue série de mois consécutifs avec au moins 1 vente
const longestMonthlyStreak = (rvs) => {
  const months = new Set()
  sold(rvs).forEach(r => {
    const k = monthKeyOf(r)
    if (k) months.add(k)
  })
  const sorted = [...months].sort()
  if (!sorted.length) return 0
  let best = 1, cur = 1
  for (let i = 1; i < sorted.length; i++) {
    const [py, pm] = sorted[i - 1].split('-').map(Number)
    const [cy, cm] = sorted[i].split('-').map(Number)
    const diff = (cy - py) * 12 + (cm - pm)
    if (diff === 1) { cur++; if (cur > best) best = cur }
    else cur = 1
  }
  return best
}

// ── Liste des trophées (titres/descs en clés i18n) ─────
export const ACHIEVEMENTS = [
  // ━━━ Démarrage ━━━
  { id: 'first_revente', catKey: 'starter', icon: '🎯', tier: 'bronze',
    titleKey: 'ach.first_revente.title', descKey: 'ach.first_revente.desc',
    compute: (rvs) => clamp(rvs.length, 1) },

  { id: 'first_sale', catKey: 'starter', icon: '💰', tier: 'bronze',
    titleKey: 'ach.first_sale.title', descKey: 'ach.first_sale.desc',
    compute: (rvs) => clamp(SOLD_COUNT(rvs), 1) },

  { id: 'first_profit', catKey: 'starter', icon: '💸', tier: 'bronze',
    titleKey: 'ach.first_profit.title', descKey: 'ach.first_profit.desc',
    compute: (rvs) => flag(sold(rvs).some(r => benefOf(r) > 0)) },

  // ━━━ Volume ━━━
  { id: 'sales_10',  catKey: 'volume', icon: '🔟',  tier: 'bronze',   titleKey: 'ach.sales_10.title',  descKey: 'ach.sales_10.desc',  compute: (rvs) => clamp(SOLD_COUNT(rvs), 10) },
  { id: 'sales_50',  catKey: 'volume', icon: '🔥',  tier: 'silver',   titleKey: 'ach.sales_50.title',  descKey: 'ach.sales_50.desc',  compute: (rvs) => clamp(SOLD_COUNT(rvs), 50) },
  { id: 'sales_100', catKey: 'volume', icon: '💯',  tier: 'gold',     titleKey: 'ach.sales_100.title', descKey: 'ach.sales_100.desc', compute: (rvs) => clamp(SOLD_COUNT(rvs), 100) },
  { id: 'sales_500', catKey: 'volume', icon: '🏆',  tier: 'platinum', titleKey: 'ach.sales_500.title', descKey: 'ach.sales_500.desc', compute: (rvs) => clamp(SOLD_COUNT(rvs), 500) },

  // ━━━ Bénéfices cumulés ━━━
  { id: 'profit_100',   catKey: 'profit', icon: '💵', tier: 'bronze',   titleKey: 'ach.profit_100.title',   descKey: 'ach.profit_100.desc',   compute: (rvs) => clamp(TOTAL_PROFIT(rvs), 100) },
  { id: 'profit_500',   catKey: 'profit', icon: '💴', tier: 'silver',   titleKey: 'ach.profit_500.title',   descKey: 'ach.profit_500.desc',   compute: (rvs) => clamp(TOTAL_PROFIT(rvs), 500) },
  { id: 'profit_1000',  catKey: 'profit', icon: '💎', tier: 'gold',     titleKey: 'ach.profit_1000.title',  descKey: 'ach.profit_1000.desc',  compute: (rvs) => clamp(TOTAL_PROFIT(rvs), 1000) },
  { id: 'profit_5000',  catKey: 'profit', icon: '👑', tier: 'platinum', titleKey: 'ach.profit_5000.title',  descKey: 'ach.profit_5000.desc',  compute: (rvs) => clamp(TOTAL_PROFIT(rvs), 5000) },
  { id: 'profit_10000', catKey: 'profit', icon: '🚀', tier: 'platinum', titleKey: 'ach.profit_10000.title', descKey: 'ach.profit_10000.desc', compute: (rvs) => clamp(TOTAL_PROFIT(rvs), 10000) },

  // ━━━ Marges ━━━
  { id: 'margin_50',  catKey: 'margin', icon: '📈', tier: 'bronze', titleKey: 'ach.margin_50.title',  descKey: 'ach.margin_50.desc',  compute: (rvs) => flag(BEST_MARGIN(rvs) >= 50) },
  { id: 'margin_100', catKey: 'margin', icon: '🎲', tier: 'silver', titleKey: 'ach.margin_100.title', descKey: 'ach.margin_100.desc', compute: (rvs) => flag(BEST_MARGIN(rvs) >= 100) },
  { id: 'margin_300', catKey: 'margin', icon: '🌟', tier: 'gold',   titleKey: 'ach.margin_300.title', descKey: 'ach.margin_300.desc', compute: (rvs) => flag(BEST_MARGIN(rvs) >= 300) },

  // ━━━ Coups de maître ━━━
  { id: 'best_50',  catKey: 'bigwin', icon: '✨', tier: 'bronze', titleKey: 'ach.best_50.title',  descKey: 'ach.best_50.desc',  compute: (rvs) => flag(BEST_SALE(rvs) >= 50) },
  { id: 'best_100', catKey: 'bigwin', icon: '💎', tier: 'silver', titleKey: 'ach.best_100.title', descKey: 'ach.best_100.desc', compute: (rvs) => flag(BEST_SALE(rvs) >= 100) },
  { id: 'best_500', catKey: 'bigwin', icon: '🏅', tier: 'gold',   titleKey: 'ach.best_500.title', descKey: 'ach.best_500.desc', compute: (rvs) => flag(BEST_SALE(rvs) >= 500) },

  // ━━━ Diversification ━━━
  { id: 'multi_platform', catKey: 'diversification', icon: '🌍', tier: 'silver',
    titleKey: 'ach.multi_platform.title', descKey: 'ach.multi_platform.desc',
    compute: (rvs) => clamp(new Set(sold(rvs).map(r => r.plat)).size, 3) },

  { id: 'multi_cat', catKey: 'diversification', icon: '🎨', tier: 'silver',
    titleKey: 'ach.multi_cat.title', descKey: 'ach.multi_cat.desc',
    compute: (rvs) => clamp(new Set(sold(rvs).map(r => r.cat)).size, 5) },

  // ━━━ Mois productifs ━━━
  { id: 'month_5',  catKey: 'month', icon: '🔥', tier: 'bronze', titleKey: 'ach.month_5.title',  descKey: 'ach.month_5.desc',  compute: (rvs) => clamp(maxMonthSales(rvs), 5) },
  { id: 'month_10', catKey: 'month', icon: '⚡', tier: 'silver', titleKey: 'ach.month_10.title', descKey: 'ach.month_10.desc', compute: (rvs) => clamp(maxMonthSales(rvs), 10) },
  { id: 'month_20', catKey: 'month', icon: '🌟', tier: 'gold',   titleKey: 'ach.month_20.title', descKey: 'ach.month_20.desc', compute: (rvs) => clamp(maxMonthSales(rvs), 20) },

  // ━━━ Régularité ━━━
  { id: 'streak_3',  catKey: 'streak', icon: '📅', tier: 'silver',   titleKey: 'ach.streak_3.title',  descKey: 'ach.streak_3.desc',  compute: (rvs) => clamp(longestMonthlyStreak(rvs), 3) },
  { id: 'streak_12', catKey: 'streak', icon: '🗓️', tier: 'platinum', titleKey: 'ach.streak_12.title', descKey: 'ach.streak_12.desc', compute: (rvs) => clamp(longestMonthlyStreak(rvs), 12) },
]

// ── Catégories ordonnées (clés i18n pour l'affichage groupé) ───────
export const CATEGORIES = ['starter', 'volume', 'profit', 'margin', 'bigwin', 'diversification', 'month', 'streak']

// Récupère TOUTES les reventes du user (toutes périodes confondues)
export function getAllReventes(data) {
  if (!data?.months) return []
  return Object.values(data.months).flatMap(m => m.reventes || [])
}

// Calcule le statut de chaque trophée
export function computeAchievements(rvs) {
  return ACHIEVEMENTS.map(a => {
    const { current, target } = a.compute(rvs)
    const unlocked = current >= target
    const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0
    return { ...a, current, target, unlocked, pct }
  })
}

export function summary(achievements) {
  const unlocked = achievements.filter(a => a.unlocked).length
  return { unlocked, total: achievements.length, pct: achievements.length > 0 ? (unlocked / achievements.length) * 100 : 0 }
}

// Couleurs des tiers (utilisés en JSX inline + CSS)
export const TIER_COLORS = {
  bronze:   { bg: 'rgba(205, 127, 50, 0.15)',  fg: '#cd7f32', border: 'rgba(205, 127, 50, 0.4)' },
  silver:   { bg: 'rgba(192, 192, 192, 0.15)', fg: '#c0c0c0', border: 'rgba(192, 192, 192, 0.4)' },
  gold:     { bg: 'rgba(251, 191, 36, 0.15)',  fg: '#fbbf24', border: 'rgba(251, 191, 36, 0.5)' },
  platinum: { bg: 'rgba(124, 106, 255, 0.15)', fg: '#a78bfa', border: 'rgba(124, 106, 255, 0.5)' },
}
