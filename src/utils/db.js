import { supabase } from './supabase'

export async function fetchAllUserData(userId) {
  const [txRes, rvRes, recRes, goalsRes] = await Promise.all([
    supabase.from('transactions').select('*').eq('user_id', userId),
    supabase.from('reventes').select('*').eq('user_id', userId),
    supabase.from('recurring_items').select('*').eq('user_id', userId),
    supabase.from('goals').select('*').eq('user_id', userId),
  ])

  const transactions = txRes.data || []
  const reventes = rvRes.data || []
  const recurring = recRes.data || []
  const goals = goalsRes.data || []

  // Group transactions and reventes by month_key
  const months = {}
  transactions.forEach(t => {
    if (!months[t.month_key]) months[t.month_key] = { transactions: [], reventes: [], budget: 2000 }
    months[t.month_key].transactions.push({ ...t, desc: t.label })
  })
  reventes.forEach(r => {
    if (!months[r.month_key]) months[r.month_key] = { transactions: [], reventes: [], budget: 2000 }
    months[r.month_key].reventes.push(r)
  })

  return {
    months,
    recurring: recurring.map(r => ({ ...r, desc: r.label })),
    goals,
    nextId: Date.now(),
  }
}

export async function addTransaction(userId, tx, monthKey) {
  const { data, error } = await supabase.from('transactions').insert({
    user_id: userId,
    type: tx.type,
    label: tx.desc,
    amount: tx.amount,
    cat: tx.cat,
    icon: tx.icon,
    date: tx.date,
    month_key: monthKey,
    recurring: tx.recurring || false,
  }).select().single()
  return { data, error }
}

export async function deleteTransaction(id) {
  return supabase.from('transactions').delete().eq('id', id)
}

export async function addRevente(userId, rv, monthKey) {
  const insertObj = {
    user_id: userId,
    name: rv.name,
    cat: rv.cat,
    plat: rv.plat,
    achat: rv.achat,
    frais: rv.frais,
    vente: rv.vente,
    icon: rv.icon,
    date: rv.date,
    month_key: monthKey,
  }
  // Inclus sub_cat seulement si renseigné (évite les erreurs si la colonne n'existe pas encore)
  if (rv.sub_cat) insertObj.sub_cat = rv.sub_cat

  let { data, error } = await supabase.from('reventes').insert(insertObj).select().single()

  // Si la colonne sub_cat n'existe pas encore, retry sans
  if (error && rv.sub_cat && /sub_cat/i.test(error.message || '')) {
    delete insertObj.sub_cat
    const retry = await supabase.from('reventes').insert(insertObj).select().single()
    data = retry.data
    error = retry.error
  }
  return { data, error }
}

export async function deleteRevente(id) {
  return supabase.from('reventes').delete().eq('id', id)
}

export async function updateProfile(userId, fields) {
  return supabase.from('profiles').update(fields).eq('id', userId)
}

export async function fetchProfile(userId) {
  return supabase.from('profiles').select('is_admin, is_premium, display_name, avatar_url').eq('id', userId).single()
}

export async function addRecurring(userId, item) {
  const { data, error } = await supabase.from('recurring_items').insert({
    user_id: userId,
    type: item.type,
    label: item.desc,
    amount: item.amount,
    cat: item.cat,
    icon: item.icon,
  }).select().single()
  return { data, error }
}

export async function deleteRecurring(id) {
  return supabase.from('recurring_items').delete().eq('id', id)
}

export async function addGoal(userId, goal) {
  const { data, error } = await supabase.from('goals').insert({
    user_id: userId,
    label: goal.label,
    target: goal.target,
    saved: 0,
    icon: goal.icon,
    color: goal.color,
  }).select().single()
  return { data, error }
}

export async function updateGoal(id, saved) {
  return supabase.from('goals').update({ saved }).eq('id', id)
}

export async function deleteGoal(id) {
  return supabase.from('goals').delete().eq('id', id)
}

export async function applyRecurringToMonth(userId, recurring, monthKey) {
  const existing = await supabase.from('transactions').select('id').eq('user_id', userId).eq('month_key', monthKey).eq('recurring', true)
  if (existing.data && existing.data.length > 0) return
  if (!recurring.length) return
  const rows = recurring.map(r => ({
    user_id: userId,
    type: r.type,
    label: r.label || r.desc,
    amount: r.amount,
    cat: r.cat,
    icon: r.icon,
    date: monthKey + '-01',
    month_key: monthKey,
    recurring: true,
  }))
  await supabase.from('transactions').insert(rows)
}
