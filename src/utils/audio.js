// ════════════════════════════════════════════════════════════
// Audio UI : sons synthétisés via Web Audio API
// Pas de fichier audio à charger — tout est généré en temps réel
// ════════════════════════════════════════════════════════════

let _ctx = null

function getCtx() {
  if (_ctx) return _ctx
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return null
    _ctx = new Ctx()
  } catch {
    return null
  }
  return _ctx
}

// Mute toggle persisté (par défaut: actif)
const MUTE_KEY = 'icedep_audio_mute'
export function isMuted() {
  try { return localStorage.getItem(MUTE_KEY) === '1' } catch { return false }
}
export function setMuted(v) {
  try { localStorage.setItem(MUTE_KEY, v ? '1' : '0') } catch {}
}
export function toggleMuted() {
  const m = !isMuted()
  setMuted(m)
  return m
}

/**
 * Petit "tap" très fin pour le changement d'onglet.
 * Un seul sinus (pur, pas de doublage) avec un léger settle de pitch
 * pour un toucher plus tactile. ~110ms, volume très bas.
 */
export function playTabSwitch() {
  if (isMuted()) return
  const ctx = getCtx()
  if (!ctx) return

  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {})
  }

  try {
    const now = ctx.currentTime

    // Sinus pur — démarre légèrement plus haut puis settle (sensation tactile)
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(1050, now)
    osc.frequency.exponentialRampToValueAtTime(988, now + 0.04) // ~B5

    // Lowpass discret pour adoucir
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(4500, now)
    filter.Q.setValueAtTime(0.5, now)

    // Enveloppe : attack 7ms (smooth, pas de click), release exp 100ms
    const gain = ctx.createGain()
    const peak = 0.022 // ~50 % du volume précédent
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(peak, now + 0.007)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.11)
  } catch {
    // Audio non-critique
  }
}
