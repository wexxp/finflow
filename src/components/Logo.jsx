// ════════════════════════════════════════════════════════════
// Logo ICEdep — composant réutilisable
// Affiche /logo.png. Fallback ◈ si l'image ne charge pas.
// ════════════════════════════════════════════════════════════
import { useState } from 'react'

export default function Logo({ size = 24, className = '', style }) {
  const [errored, setErrored] = useState(false)

  if (errored) {
    return (
      <span
        className={className}
        style={{
          fontSize: size,
          color: 'var(--accent)',
          lineHeight: 1,
          display: 'inline-block',
          ...style,
        }}
        aria-label="ICEdep logo"
      >
        ◈
      </span>
    )
  }

  // On utilise la hauteur comme dimension de référence ; la largeur s'adapte
  // automatiquement à la proportion native du PNG (qui est rectangulaire après trim).
  return (
    <img
      src="/logo.png"
      alt="ICEdep logo"
      height={size}
      className={className}
      onError={() => setErrored(true)}
      style={{
        height: size,
        width: 'auto',
        display: 'inline-block',
        verticalAlign: 'middle',
        ...style,
      }}
    />
  )
}
