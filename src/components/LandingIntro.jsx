import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './LandingIntro.css'

// ════════════════════════════════════════════════════════════
// LANDING INTRO V2 — "Reveal through the line"
// Concept : une ligne cyan unique se dessine, puis s'ouvre
// verticalement comme un coffre pour révéler la marque ICEdep.
// Aucun élément ne se chevauche. Composition propre.
// ════════════════════════════════════════════════════════════

const STORAGE_KEY  = 'icedep_intro_seen_v2'
const TOTAL_DURATION = 4000 // ms
const BRAND        = ['I', 'C', 'E', 'd', 'e', 'p']

export default function LandingIntro() {
  const [visible, setVisible] = useState(false)
  const [stage, setStage]     = useState(0)

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
      setTimeout(() => setStage(1), 400),    // ligne se dessine
      setTimeout(() => setStage(2), 1000),   // ligne s'écarte + mot apparaît
      setTimeout(() => setStage(3), 2200),   // underline draws
      setTimeout(() => setStage(4), 2800),   // subtitle fades
      setTimeout(() => setStage(5), 3600),   // exit prep
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
          className="intro2-root"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.06, filter: 'blur(14px)' }}
          transition={{ duration: 0.7, ease: [0.65, 0, 0.35, 1] }}
        >
          {/* ── Orbes ambient ── */}
          <motion.div
            className="intro2-orb intro2-orb-cyan"
            initial={{ opacity: 0 }}
            animate={{ opacity: stage >= 1 ? 0.5 : 0.2 }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
          />
          <motion.div
            className="intro2-orb intro2-orb-purple"
            initial={{ opacity: 0 }}
            animate={{ opacity: stage >= 2 ? 0.4 : 0 }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
          />

          {/* ── Grille discrète qui apparaît avec le mot ── */}
          <motion.div
            className="intro2-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: stage >= 2 ? 0.18 : 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />

          {/* ════════════════════════════════════════════
              CENTRE DE COMPOSITION
              Tout est centré, jamais d'overlap
              ════════════════════════════════════════════ */}
          <div className="intro2-stage">

            {/* ─── Ligne du haut (qui s'écarte vers le haut au stage 2) ─── */}
            <motion.div
              className="intro2-line intro2-line-top"
              initial={{ scaleX: 0, y: 0 }}
              animate={{
                scaleX: stage >= 1 ? 1 : 0,
                y: stage >= 2 ? -60 : 0,
                opacity: stage >= 4 ? 0 : 1,
              }}
              transition={{
                scaleX: { duration: 0.6, ease: [0.65, 0, 0.35, 1] },
                y:      { duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: stage >= 2 ? 0 : 0 },
                opacity:{ duration: 0.6 },
              }}
            />

            {/* ─── Le mot "ICEdep" lettre par lettre ─── */}
            <div className="intro2-brand-wrap">
              <AnimatePresence>
                {stage >= 2 && (
                  <motion.div
                    className="intro2-brand"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {BRAND.map((letter, i) => (
                      <motion.span
                        key={i}
                        className="intro2-letter"
                        initial={{
                          y: 40,
                          opacity: 0,
                          filter: 'blur(14px)',
                          scale: 0.85,
                        }}
                        animate={{
                          y: 0,
                          opacity: 1,
                          filter: 'blur(0px)',
                          scale: 1,
                        }}
                        transition={{
                          duration: 0.75,
                          ease: [0.16, 1, 0.3, 1],
                          delay: 0.15 + i * 0.06,
                        }}
                      >
                        {letter}
                      </motion.span>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ─── Ligne du bas (qui s'écarte vers le bas) ─── */}
            <motion.div
              className="intro2-line intro2-line-bottom"
              initial={{ scaleX: 0, y: 0 }}
              animate={{
                scaleX: stage >= 1 ? 1 : 0,
                y: stage >= 2 ? 60 : 0,
                opacity: stage >= 4 ? 0 : 1,
              }}
              transition={{
                scaleX: { duration: 0.6, ease: [0.65, 0, 0.35, 1] },
                y:      { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
                opacity:{ duration: 0.6 },
              }}
            />

            {/* ─── Underline cyan sous le mot (stage 3) ─── */}
            <motion.div
              className="intro2-underline"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: stage >= 3 ? 1 : 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            />

            {/* ─── Sous-titre (stage 4) ─── */}
            <motion.p
              className="intro2-subtitle"
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

          {/* ─── Skip button ─── */}
          <motion.button
            className="intro2-skip"
            initial={{ opacity: 0 }}
            animate={{ opacity: stage >= 1 ? 1 : 0 }}
            transition={{ duration: 0.4 }}
            onClick={skip}
          >
            Skip ›
          </motion.button>

          {/* ─── Progress bar bottom ─── */}
          <motion.div
            className="intro2-progress"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: TOTAL_DURATION / 1000, ease: 'linear' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
