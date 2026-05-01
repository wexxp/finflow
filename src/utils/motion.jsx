// ════════════════════════════════════════════════════════════
// Composants & utils framer-motion réutilisables
// Animations premium pour ICEdep — sober, smooth, expensive feel
// ════════════════════════════════════════════════════════════
import { motion, useMotionValue, useTransform, animate as fmAnimate } from 'framer-motion'
import { useEffect } from 'react'

// ─── Easings (Apple-style spring + smooth) ─────────────────
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1]
export const EASE_OUT_SMOOTH = [0.4, 0, 0.2, 1]

// Springs réutilisables
export const SPRING_GENTLE = { type: 'spring', stiffness: 240, damping: 26 }
export const SPRING_SNAPPY = { type: 'spring', stiffness: 360, damping: 32 }
export const SPRING_BOUNCY = { type: 'spring', stiffness: 280, damping: 18 }

// ────────────────────────────────────────────────────────────
// Compteur animé : anime de 0 → value au mount
// ────────────────────────────────────────────────────────────
export function AnimatedAmount({ value = 0, duration = 1, signed = false, suffix = '€' }) {
  const mv = useMotionValue(0)
  const display = useTransform(mv, (v) => {
    const abs = Math.abs(v)
    const formatted = abs.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    if (signed) {
      const sign = v >= 0 ? '+' : '−'
      return `${sign}${formatted} ${suffix}`
    }
    return `${formatted} ${suffix}`
  })

  useEffect(() => {
    const controls = fmAnimate(mv, value, { duration, ease: EASE_OUT_EXPO })
    return () => controls.stop()
  }, [value, mv, duration])

  return <motion.span>{display}</motion.span>
}

// ────────────────────────────────────────────────────────────
// Pourcentage animé
// ────────────────────────────────────────────────────────────
export function AnimatedPercent({ value = 0, decimals = 1, duration = 1 }) {
  const mv = useMotionValue(0)
  const display = useTransform(mv, (v) => `${v.toFixed(decimals)} %`)

  useEffect(() => {
    const controls = fmAnimate(mv, value, { duration, ease: EASE_OUT_EXPO })
    return () => controls.stop()
  }, [value, mv, duration])

  return <motion.span>{display}</motion.span>
}

// ────────────────────────────────────────────────────────────
// Entier animé
// ────────────────────────────────────────────────────────────
export function AnimatedInt({ value = 0, duration = 1 }) {
  const mv = useMotionValue(0)
  const display = useTransform(mv, (v) => Math.round(v).toString())

  useEffect(() => {
    const controls = fmAnimate(mv, value, { duration, ease: EASE_OUT_EXPO })
    return () => controls.stop()
  }, [value, mv, duration])

  return <motion.span>{display}</motion.span>
}

// ────────────────────────────────────────────────────────────
// FadeUp : variants pour stagger des listes
// ────────────────────────────────────────────────────────────
export const fadeUpVariants = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0 },
}

export const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
}

// ────────────────────────────────────────────────────────────
// PageTransition : wrapper pour transitions inter-vues
// ────────────────────────────────────────────────────────────
export function PageTransition({ children, viewKey }) {
  return (
    <motion.div
      key={viewKey}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.32, ease: EASE_OUT_EXPO }}
      style={{ minHeight: '100%' }}
    >
      {children}
    </motion.div>
  )
}
