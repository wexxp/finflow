import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './LandingIntro.css'

// ════════════════════════════════════════════════════════════
// LANDING INTRO V3 — "Materialize"
// Concept : noir profond + lettres BLANCHES qui se matérialisent
// une à une dans un ordre ALÉATOIRE, chaque apparition
// déclenchée par un FLASH DE GLOW CYAN derrière la lettre
// (comme une téléportation lumineuse).
// Cyan utilisé en accent (flashs, lignes, underline), pas en masse.
// ════════════════════════════════════════════════════════════

const STORAGE_KEY    = 'icedep_intro_seen_v3'
const TOTAL_DURATION = 4200 // ms
const BRAND          = ['I', 'C', 'E', 'd', 'e', 'p']

// Mélange une liste d'indices (Fisher-Yates)
function shuffled(n) {
  const arr = Array.from({ length: n }, (_, i) => i)
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export default function LandingIntro() {
  const [visible, setVisible] = useState(false)
  const [stage,   setStage]   = useState(0)

  // Génère un ordre aléatoire d'apparition des lettres, fixé pour la session
  const order = useMemo(() => shuffled(BRAND.length), [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const seen = sessionStorage.getItem(STORAGE_KEY)
    if (!seen) {
      setVisible(true)
      sessionStorage.setItem(STORAGE_KEY, '1')
      document.body.style.overflow = 'hidden'
    }
  }, [])

  useEffect(() => {
    if (!visible) return
    const timers = [
      setTimeout(() => setStage(1), 350),    // ligne se dessine
      setTimeout(() => setStage(2), 900),    // ligne s'écarte + lettres commencent
      setTimeout(() => setStage(3), 2500),   // underline
      setTimeout(() => setStage(4), 3000),   // subtitle
      setTimeout(() => setStage(5), 3800),   // exit prep
      setTimeout(() => {
        setVisible(false)
        document.body.style.overflow = ''
      }, TOTAL_DURATION),
    ]
    return () => timers.forEach(clearTimeout)
  }, [visible])

  function skip() {
    setVisible(false)
    document.body.style.overflow = ''
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="intro3-root"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, filter: 'blur(10px)' }}
          transition={{ duration: 0.7, ease: [0.65, 0, 0.35, 1] }}
        >
          {/* ─── Grille très très subtile ─── */}
          <motion.div
            className="intro3-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: stage >= 2 ? 0.08 : 0 }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
          />

          {/* ═══════════════════════════
              STAGE — composition centrée
              ═══════════════════════════ */}
          <div className="intro3-stage">

            {/* Ligne du haut */}
            <motion.div
              className="intro3-line intro3-line-top"
              initial={{ scaleX: 0, y: 0 }}
              animate={{
                scaleX: stage >= 1 ? 1 : 0,
                y: stage >= 2 ? -64 : 0,
                opacity: stage >= 4 ? 0.3 : 1,
              }}
              transition={{
                scaleX: { duration: 0.55, ease: [0.65, 0, 0.35, 1] },
                y:      { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
                opacity:{ duration: 0.6 },
              }}
            />

            {/* ─── "ICEdep" — lettres avec apparition aléatoire ─── */}
            <div className="intro3-brand-wrap">
              <AnimatePresence>
                {stage >= 2 && (
                  <motion.div
                    className="intro3-brand"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {BRAND.map((letter, i) => {
                      // Position de cette lettre dans l'ordre aléatoire
                      const orderIdx = order.indexOf(i)
                      const delay = 0.08 + orderIdx * 0.13
                      return (
                        <span key={i} className="intro3-letter-slot">
                          {/* Flash de glow derrière la lettre */}
                          <motion.span
                            className="intro3-flash"
                            initial={{ opacity: 0, scale: 0.3 }}
                            animate={{
                              opacity: [0, 1, 0],
                              scale: [0.3, 1.6, 2.4],
                            }}
                            transition={{
                              duration: 0.7,
                              ease: 'easeOut',
                              delay,
                              times: [0, 0.4, 1],
                            }}
                            aria-hidden="true"
                          />
                          {/* La lettre elle-même */}
                          <motion.span
                            className="intro3-letter"
                            initial={{
                              opacity: 0,
                              filter: 'blur(16px)',
                              scale: 1.4,
                            }}
                            animate={{
                              opacity: 1,
                              filter: 'blur(0px)',
                              scale: 1,
                            }}
                            transition={{
                              duration: 0.55,
                              ease: [0.16, 1, 0.3, 1],
                              delay: delay + 0.08,
                            }}
                          >
                            {letter}
                          </motion.span>
                        </span>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Ligne du bas */}
            <motion.div
              className="intro3-line intro3-line-bottom"
              initial={{ scaleX: 0, y: 0 }}
              animate={{
                scaleX: stage >= 1 ? 1 : 0,
                y: stage >= 2 ? 64 : 0,
                opacity: stage >= 4 ? 0.3 : 1,
              }}
              transition={{
                scaleX: { duration: 0.55, ease: [0.65, 0, 0.35, 1] },
                y:      { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
                opacity:{ duration: 0.6 },
              }}
            />

            {/* Underline cyan */}
            <motion.div
              className="intro3-underline"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: stage >= 3 ? 1 : 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            />

            {/* Sous-titre */}
            <motion.p
              className="intro3-subtitle"
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: stage >= 4 ? 1 : 0,
                y: stage >= 4 ? 0 : 10,
              }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              Gestion de reventes
            </motion.p>

          </div>

          {/* Skip button */}
          <motion.button
            className="intro3-skip"
            initial={{ opacity: 0 }}
            animate={{ opacity: stage >= 1 ? 1 : 0 }}
            transition={{ duration: 0.4 }}
            onClick={skip}
          >
            Skip ›
          </motion.button>

          {/* Progress bar */}
          <motion.div
            className="intro3-progress"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: TOTAL_DURATION / 1000, ease: 'linear' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
