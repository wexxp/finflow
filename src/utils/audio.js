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
 * Petit "ping" cristallin pour le changement d'onglet.
 * Deux sinus harmoniques (fondamentale + quinte aiguë) avec filtre passe-bas
 * et enveloppe ADSR douce. ~130ms, volume bas.
 */
export function playTabSwitch() {
  if (isMuted()) return
  const ctx = getCtx()
  if (!ctx) return

  // Beaucoup de navigateurs suspendent l'AudioContext tant qu'il n'y a pas
  // eu d'interaction utilisateur. Le premier appel se fait toujours suite à
  // un click, donc resume() reprendra silencieusement.
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {})
  }

  try {
    const now = ctx.currentTime

    // Fondamentale (~ré aigu) + quinte une octave au-dessus
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    osc1.type = 'sine'
    osc2.type = 'sine'
    osc1.frequency.setValueAtTime(880, now)   // ~A5
    osc2.frequency.setValueAtTime(1318, now)  // ~E6 (quinte)

    // Lowpass doux pour adoucir le rendu
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(3500, now)
    filter.Q.setValueAtTime(0.7, now)

    // Enveloppe ADSR : attack rapide (5ms), release exponentiel (130ms)
    const gain = ctx.createGain()
    const peak = 0.045 // volume bas pour ne pas être intrusif
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(peak, now + 0.005)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.13)

    // Routing : oscillators → filter → gain → output
    osc1.connect(filter)
    osc2.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    osc1.start(now)
    osc2.start(now)
    osc1.stop(now + 0.14)
    osc2.stop(now + 0.14)
  } catch {
    // Audio est non-critique — on échoue silencieusement
  }
}
