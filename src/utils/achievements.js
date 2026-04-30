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

// ── Liste des trophées ──────────────────────────────────
export const ACHIEVEMENTS = [
  // ━━━ Démarrage ━━━
  { id: 'first_revente', cat: 'Démarrage', icon: '🎯', tier: 'bronze', title: 'Premier pas',
    desc: 'Ajoute ta première revente',
    compute: (rvs) => clamp(rvs.length, 1) },

  { id: 'first_sale', cat: 'Démarrage', icon: '💰', tier: 'bronze', title: 'Première vente',
    desc: 'Vends ton premier article',
    compute: (rvs) => clamp(SOLD_COUNT(rvs), 1) },

  { id: 'first_profit', cat: 'Démarrage', icon: '💸', tier: 'bronze', title: 'Au noir',
    desc: 'Réalise ton premier bénéfice positif',
    compute: (rvs) => flag(sold(rvs).some(r => benefOf(r) > 0)) },

  // ━━━ Volume ━━━
  { id: 'sales_10',  cat: 'Volume', icon: '🔟',  tier: 'bronze',   title: 'Petit revendeur',
    desc: 'Vends 10 articles',  compute: (rvs) => clamp(SOLD_COUNT(rvs), 10) },
  { id: 'sales_50',  cat: 'Volume', icon: '🔥',  tier: 'silver',   title: 'Revendeur confirmé',
    desc: 'Vends 50 articles',  compute: (rvs) => clamp(SOLD_COUNT(rvs), 50) },
  { id: 'sales_100', cat: 'Volume', icon: '💯',  tier: 'gold',     title: 'Centurion',
    desc: 'Vends 100 articles', compute: (rvs) => clamp(SOLD_COUNT(rvs), 100) },
  { id: 'sales_500', cat: 'Volume', icon: '🏆',  tier: 'platinum', title: 'Légende vivante',
    desc: 'Vends 500 articles', compute: (rvs) => clamp(SOLD_COUNT(rvs), 500) },

  // ━━━ Bénéfices cumulés ━━━
  { id: 'profit_100',   cat: 'Bénéfices', icon: '💵', tier: 'bronze',   title: 'Premier billet',
    desc: 'Cumule 100€ de bénéfices',     compute: (rvs) => clamp(TOTAL_PROFIT(rvs), 100) },
  { id: 'profit_500',   cat: 'Bénéfices', icon: '💴', tier: 'silver',   title: 'Pile de billets',
    desc: 'Cumule 500€ de bénéfices',     compute: (rvs) => clamp(TOTAL_PROFIT(rvs), 500) },
  { id: 'profit_1000',  cat: 'Bénéfices', icon: '💎', tier: 'gold',     title: 'Mille euros',
    desc: 'Cumule 1 000€ de bénéfices',   compute: (rvs) => clamp(TOTAL_PROFIT(rvs), 1000) },
  { id: 'profit_5000',  cat: 'Bénéfices', icon: '👑', tier: 'platinum', title: 'Cinq mille',
    desc: 'Cumule 5 000€ de bénéfices',   compute: (rvs) => clamp(TOTAL_PROFIT(rvs), 5000) },
  { id: 'profit_10000', cat: 'Bénéfices', icon: '🚀', tier: 'platinum', title: 'Dix mille',
    desc: 'Cumule 10 000€ de bénéfices',  compute: (rvs) => clamp(TOTAL_PROFIT(rvs), 10000) },

  // ━━━ Marges ━━━
  { id: 'margin_50',  cat: 'Marges', icon: '📈', tier: 'bronze', title: 'Bon flair',
    desc: 'Une vente avec >50% de marge',  compute: (rvs) => flag(BEST_MARGIN(rvs) >= 50) },
  { id: 'margin_100', cat: 'Marges', icon: '🎲', tier: 'silver', title: 'Doublé',
    desc: 'Une vente avec >100% de marge', compute: (rvs) => flag(BEST_MARGIN(rvs) >= 100) },
  { id: 'margin_300', cat: 'Marges', icon: '🌟', tier: 'gold',   title: 'Jackpot',
    desc: 'Une vente avec >300% de marge', compute: (rvs) => flag(BEST_MARGIN(rvs) >= 300) },

  // ━━━ Coups de maître ━━━
  { id: 'best_50',  cat: 'Coups de maître', icon: '✨', tier: 'bronze', title: 'Belle prise',
    desc: 'Une vente avec +50€ de bénéfice',  compute: (rvs) => flag(BEST_SALE(rvs) >= 50) },
  { id: 'best_100', cat: 'Coups de maître', icon: '💎', tier: 'silver', title: 'Coup de maître',
    desc: 'Une vente avec +100€ de bénéfice', compute: (rvs) => flag(BEST_SALE(rvs) >= 100) },
  { id: 'best_500', cat: 'Coups de maître', icon: '🏅', tier: 'gold',   title: 'Vente du siècle',
    desc: 'Une vente avec +500€ de bénéfice', compute: (rvs) => flag(BEST_SALE(rvs) >= 500) },

  // ━━━ Diversification ━━━
  { id: 'multi_platform', cat: 'Diversification', icon: '🌍', tier: 'silver', title: 'Multi-plateforme',
    desc: 'Vends sur 3 plateformes différentes',
    compute: (rvs) => clamp(new Set(sold(rvs).map(r => r.plat)).size, 3) },

  { id: 'multi_cat', cat: 'Diversification', icon: '🎨', tier: 'silver', title: 'Polyvalent',
    desc: 'Vends dans 5 catégories différentes',
    compute: (rvs) => clamp(new Set(sold(rvs).map(r => r.cat)).size, 5) },

  // ━━━ Mois productifs ━━━
  { id: 'month_5',  cat: 'Mois productifs', icon: '🔥', tier: 'bronze', title: 'Mois productif',
    desc: '5 ventes dans le même mois',     compute: (rvs) => clamp(maxMonthSales(rvs), 5) },
  { id: 'month_10', cat: 'Mois productifs', icon: '⚡', tier: 'silver', title: 'Mois en feu',
    desc: '10 ventes dans le même mois',    compute: (rvs) => clamp(maxMonthSales(rvs), 10) },
  { id: 'month_20', cat: 'Mois productifs', icon: '🌟', tier: 'gold',   title: 'Mois exceptionnel',
    desc: '20 ventes dans le même mois',    compute: (rvs) => clamp(maxMonthSales(rvs), 20) },

  // ━━━ Régularité ━━━
  { id: 'streak_3',  cat: 'Régularité', icon: '📅', tier: 'silver',   title: 'Trimestre régulier',
    desc: 'Au moins 1 vente / mois sur 3 mois consécutifs',
    compute: (rvs) => clamp(longestMonthlyStreak(rvs), 3) },
  { id: 'streak_12', cat: 'Régularité', icon: '🗓️', tier: 'platinum', title: 'Année régulière',
    desc: 'Au moins 1 vente / mois sur 12 mois consécutifs',
    compute: (rvs) => clamp(longestMonthlyStreak(rvs), 12) },
]

// ── Catégories ordonnées (pour l'affichage groupé) ───────
export const CATEGORIES = [
  'Démarrage', 'Volume', 'Bénéfices', 'Marges',
  'Coups de maître', 'Diversification', 'Mois productifs', 'Régularité',
]

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
