const KEY = 'finflow_v1'

export function loadData() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function saveData(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)) } catch {}
}

export function getDefaultData() {
  return {
    recurring: [
      { id: 1, desc: 'Salaire', amount: 2200, cat: 'salaire', type: 'revenu', icon: '💼' },
      { id: 2, desc: 'Loyer', amount: 850, cat: 'logement', type: 'depense', icon: '🏠' },
    ],
    months: {
      '2026-04': {
        transactions: [
          { id: 10, type: 'revenu', desc: 'Salaire', amount: 2200, cat: 'salaire', icon: '💼', date: '2026-04-01', recurring: true },
          { id: 11, type: 'depense', desc: 'Loyer', amount: 850, cat: 'logement', icon: '🏠', date: '2026-04-01', recurring: true },
          { id: 12, type: 'depense', desc: 'Courses Carrefour', amount: 74, cat: 'alimentation', icon: '🛒', date: '2026-04-03' },
          { id: 13, type: 'depense', desc: 'Netflix', amount: 18, cat: 'loisirs', icon: '🎬', date: '2026-04-03' },
          { id: 14, type: 'depense', desc: "Plein d'essence", amount: 60, cat: 'transport', icon: '🚗', date: '2026-04-04' },
        ],
        reventes: [
          { id: 1, name: 'Nike Air Max 90', cat: 'vêtements', plat: 'Vinted', achat: 60, frais: 5, vente: 95, icon: '👟', date: '2026-04-02' },
          { id: 2, name: 'iPad 9e gen', cat: 'électronique', plat: 'Leboncoin', achat: 220, frais: 0, vente: 310, icon: '📱', date: '2026-04-03' },
        ],
        budget: 2000,
      },
      '2026-03': {
        transactions: [
          { id: 20, type: 'revenu', desc: 'Salaire', amount: 2200, cat: 'salaire', icon: '💼', date: '2026-03-01', recurring: true },
          { id: 21, type: 'depense', desc: 'Loyer', amount: 850, cat: 'logement', icon: '🏠', date: '2026-03-01', recurring: true },
          { id: 22, type: 'depense', desc: 'Courses', amount: 95, cat: 'alimentation', icon: '🛒', date: '2026-03-05' },
          { id: 23, type: 'depense', desc: 'Cinéma', amount: 22, cat: 'loisirs', icon: '🎬', date: '2026-03-10' },
          { id: 24, type: 'revenu', desc: 'Freelance', amount: 450, cat: 'freelance', icon: '💻', date: '2026-03-15' },
          { id: 25, type: 'depense', desc: 'Restaurant', amount: 48, cat: 'alimentation', icon: '🍽️', date: '2026-03-20' },
        ],
        reventes: [
          { id: 5, name: 'PS4 Pro', cat: 'jeux', plat: 'Leboncoin', achat: 150, frais: 10, vente: 210, icon: '🎮', date: '2026-03-12' },
        ],
        budget: 2000,
      },
      '2026-02': {
        transactions: [
          { id: 30, type: 'revenu', desc: 'Salaire', amount: 2200, cat: 'salaire', icon: '💼', date: '2026-02-01', recurring: true },
          { id: 31, type: 'depense', desc: 'Loyer', amount: 850, cat: 'logement', icon: '🏠', date: '2026-02-01', recurring: true },
          { id: 32, type: 'depense', desc: 'Courses', amount: 88, cat: 'alimentation', icon: '🛒', date: '2026-02-07' },
          { id: 33, type: 'depense', desc: 'Saint-Valentin', amount: 120, cat: 'loisirs', icon: '🎁', date: '2026-02-14' },
          { id: 34, type: 'depense', desc: 'Abonnements', amount: 35, cat: 'loisirs', icon: '📺', date: '2026-02-20' },
        ],
        reventes: [],
        budget: 2000,
      },
    },
    customCats: [],
    goals: [
      { id: 1, label: 'Vacances été', target: 1500, saved: 320, icon: '✈️', color: '#60a5fa' },
      { id: 2, label: 'Nouveau PC', target: 1200, saved: 800, icon: '💻', color: '#a78bfa' },
    ],
    nextId: 100,
  }
}

export const CAT_META = {
  // depenses
  alimentation:  { icon: '🛒', color: '#4ade80',  bg: 'rgba(74,222,128,0.12)',  text: '#4ade80'  },
  transport:     { icon: '🚗', color: '#60a5fa',  bg: 'rgba(96,165,250,0.12)',  text: '#60a5fa'  },
  loisirs:       { icon: '🎬', color: '#a78bfa',  bg: 'rgba(167,139,250,0.12)', text: '#a78bfa'  },
  santé:         { icon: '💊', color: '#f87171',  bg: 'rgba(248,113,113,0.12)', text: '#f87171'  },
  logement:      { icon: '🏠', color: '#fbbf24',  bg: 'rgba(251,191,36,0.12)',  text: '#fbbf24'  },
  vêtements:     { icon: '👕', color: '#f472b6',  bg: 'rgba(244,114,182,0.12)', text: '#f472b6'  },
  // revenus
  salaire:       { icon: '💼', color: '#4ade80',  bg: 'rgba(74,222,128,0.12)',  text: '#4ade80'  },
  freelance:     { icon: '💻', color: '#60a5fa',  bg: 'rgba(96,165,250,0.12)',  text: '#60a5fa'  },
  remboursement: { icon: '↩️', color: '#a78bfa',  bg: 'rgba(167,139,250,0.12)', text: '#a78bfa'  },
  cadeau:        { icon: '🎁', color: '#f472b6',  bg: 'rgba(244,114,182,0.12)', text: '#f472b6'  },
  revente:       { icon: '🔄', color: '#4ade80',  bg: 'rgba(74,222,128,0.12)',  text: '#4ade80'  },
  autre:         { icon: '📦', color: '#9997a0',  bg: 'rgba(153,151,160,0.12)', text: '#9997a0'  },
}

export const DEP_CATS = ['alimentation','transport','loisirs','santé','logement','vêtements','autre']
export const REV_CATS = ['salaire','freelance','remboursement','cadeau','revente','autre']

export function fmtMonth(key) {
  const [y, m] = key.split('-')
  return new Date(+y, +m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

export function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function fmt(n) {
  if (n === undefined || n === null || isNaN(n)) return '0 €'
  return Math.abs(n).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' €'
}

export function fmtSigned(n) {
  if (n >= 0) return '+' + fmt(n)
  return '−' + fmt(Math.abs(n))
}

export function computeStats(monthData) {
  const txs = monthData?.transactions || []
  const rvs = monthData?.reventes || []
  const totalRev = txs.filter(t => t.type === 'revenu').reduce((s, t) => s + t.amount, 0)
  const totalDep = txs.filter(t => t.type === 'depense').reduce((s, t) => s + t.amount, 0)
  const totalRvBenef = rvs.reduce((s, r) => s + (r.vente - r.achat - r.frais), 0)
  const balance = totalRev - totalDep + totalRvBenef
  const savingRate = totalRev > 0 ? Math.max(0, balance / totalRev * 100) : 0
  const healthScore = Math.min(100, Math.round(savingRate * 2))
  return { totalRev, totalDep, totalRvBenef, balance, savingRate, healthScore }
}
