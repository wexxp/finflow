import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './LandingIntro.css'

// ════════════════════════════════════════════════════════════
// LANDING INTRO — cinematic 4-second reveal sequence
// Inspired by Linear, Vercel, Apple Vision Pro
// ════════════════════════════════════════════════════════════

const STORAGE_KEY = 'icedep_intro_seen_v1'
const TOTAL_DURATION = 4000 // ms

const BRAND_LETTERS = ['I', 'C', 'E', 'd', 'e', 'p']

export default function LandingIntro() {
  const [visible, setVisible] = useState(false)
  const [stage, setStage]     = useState(0)

  // ── Décide si on affiche l'intro
  useEffect(() => {
    if (typeof window === 'undefined') return
    const seen = sessionStorage.getItem(STORAGE_KEY)
    if (!seen) {
      setVisible(true)
      sessionStorage.setItem(STORAGE_KEY, '1')
      // Verrouille le scroll pendant l'intro
      document.body.style.overflow = 'hidden'
    }
  }, [])

  // ── Sequence des stages (0 → 5)
  useEffect(() => {
    if (!visible) return
    const timers = [
      setTimeout(() => setStage(1), 600),
      setTimeout(() => setStage(2), 1400),
      setTimeout(() => setStage(3), 2300),
      setTimeout(() => setStage(4), 3000),
      setTimeout(() => setStage(5), 3500),
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
          className="intro-root"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.15, filter: 'blur(20px)' }}
          transition={{ duration: 0.7, ease: [0.65, 0, 0.35, 1] }}
        >
          {/* ━━━ Grille en background ━━━ */}
          <motion.div
            className="intro-grid"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{
              opacity: stage >= 1 ? 0.35 : 0,
              scale: stage >= 1 ? 1 : 0.85,
            }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />

          {/* ━━━ Scan line verticale (cinema FX) ━━━ */}
          {stage >= 1 && stage < 5 && (
            <motion.div
              className="intro-scanline"
              initial={{ y: '-100%', opacity: 0 }}
              animate={{ y: '100vh', opacity: [0, 0.9, 0.9, 0] }}
              transition={{ duration: 1.8, ease: 'easeInOut', delay: 0.1 }}
            />
          )}

          {/* ━━━ Mesh orbs glow ambient ━━━ */}
          <motion.div
            className="intro-orb intro-orb-cyan"
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: stage >= 1 ? 0.55 : 0, scale: stage >= 1 ? 1 : 0.4 }}
            transition={{ duration: 1.8, ease: 'easeOut' }}
          />
          <motion.div
            className="intro-orb intro-orb-purple"
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: stage >= 2 ? 0.45 : 0, scale: stage >= 2 ? 1 : 0.4 }}
            transition={{ duration: 1.8, ease: 'easeOut' }}
          />

          {/* ━━━ Onde concentrique au centre ━━━ */}
          <div className="intro-rings">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="intro-ring"
                initial={{ scale: 0, opacity: 0 }}
                animate={
                  stage >= 1
                    ? { scale: [0, 1.8], opacity: [0.9, 0] }
                    : { scale: 0, opacity: 0 }
                }
                transition={{
                  duration: 2.2,
                  ease: 'easeOut',
                  delay: 0.05 + i * 0.18,
                  repeat: stage >= 1 && stage < 4 ? Infinity : 0,
                  repeatDelay: 0.4,
                }}
              />
            ))}
          </div>

          {/* ━━━ Cœur lumineux pulsant (point central → logo) ━━━ */}
          <motion.div
            className="intro-core"
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: stage >= 0 ? 1 : 0,
              opacity: stage < 2 ? 1 : 0,
            }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          />

          {/* ━━━ Logo "I" qui descend en trail ━━━ */}
          <AnimatePresence>
            {stage >= 2 && (
              <motion.div
                className="intro-logo-wrap"
                initial={{ y: -120, opacity: 0, filter: 'blur(20px)' }}
                animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                exit={{ scale: 1.4, opacity: 0, filter: 'blur(12px)' }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 18,
                  mass: 0.8,
                }}
              >
                <span className="intro-logo-i">I</span>
                <motion.div
                  className="intro-logo-flash"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: [0, 1, 0], scale: [0.6, 1.8, 2.4] }}
                  transition={{ duration: 0.5, delay: 0.25 }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ━━━ "ICEdep" lettre par lettre ━━━ */}
          <AnimatePresence>
            {stage >= 3 && (
              <motion.div
                className="intro-brand"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
              >
                {BRAND_LETTERS.map((letter, i) => (
                  <motion.span
                    key={i}
                    className="intro-letter"
                    initial={{ y: 30, opacity: 0, filter: 'blur(10px)' }}
                    animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                    transition={{
                      duration: 0.6,
                      ease: [0.16, 1, 0.3, 1],
                      delay: i * 0.07,
                    }}
                  >
                    {letter}
                  </motion.span>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ━━━ Tagline ━━━ */}
          <AnimatePresence>
            {stage >= 4 && (
              <motion.p
                className="intro-tagline"
                initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                Reventes. <span className="intro-tagline-em">Tête froide.</span>
              </motion.p>
            )}
          </AnimatePresence>

          {/* ━━━ Bouton Skip ━━━ */}
          <motion.button
            className="intro-skip"
            initial={{ opacity: 0 }}
            animate={{ opacity: stage >= 1 ? 1 : 0 }}
            transition={{ duration: 0.4 }}
            onClick={skip}
          >
            Skip ›
          </motion.button>

          {/* ━━━ Barre de progression discrète en bas ━━━ */}
          <motion.div
            className="intro-progress"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: TOTAL_DURATION / 1000, ease: 'linear' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
