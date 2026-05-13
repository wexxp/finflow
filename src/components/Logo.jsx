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

  return (
    <img
      src="/logo.png"
      alt="ICEdep logo"
      width={size}
      height={size}
      className={className}
      onError={() => setErrored(true)}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        display: 'inline-block',
        ...style,
      }}
    />
  )
}
