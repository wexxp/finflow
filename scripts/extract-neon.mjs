// ════════════════════════════════════════════════════════════
// extract-neon.mjs
// Prend le PNG opaque (fond sombre + I cyan) et extrait UNIQUEMENT
// les pixels brillants en les rendant transparents partout ailleurs.
// → résultat : un I cyan sur fond vraiment transparent
// ════════════════════════════════════════════════════════════
import sharp from 'sharp'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const INPUT = path.join(__dirname, '..', 'public', 'logo.png')
const OUTPUT = path.join(__dirname, '..', 'public', 'logo.png')
const BACKUP = path.join(__dirname, '..', 'public', 'logo-opaque-backup.png')

// Seuils
const BRIGHTNESS_KEEP = 180     // pixels brillants gardés à 100%
const BRIGHTNESS_FADE = 110     // pixels < 110 deviennent totalement transparents
// Entre 110 et 180 : alpha proportionnel (fade naturel du glow)

const MAX_SIZE = 512
const PADDING = 12

async function main() {
  console.log('🔮 Extraction du I cyan depuis le PNG opaque\n')

  // Backup l'opaque
  try {
    await fs.copyFile(INPUT, BACKUP)
    console.log(`📦 Backup opaque sauvegardé : ${path.basename(BACKUP)}`)
  } catch (e) {
    console.log('⚠️  Pas de backup créé')
  }

  // 1. Lire en raw RGBA
  const { data, info } = await sharp(INPUT)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  console.log(`📐 Source : ${info.width} × ${info.height}`)

  // 2. Pour chaque pixel : calculer brightness, ajuster alpha
  const cleaned = Buffer.alloc(data.length)
  let fullyTransparent = 0, partial = 0, fullyOpaque = 0
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const brightness = (r + g + b) / 3

    cleaned[i]     = r
    cleaned[i + 1] = g
    cleaned[i + 2] = b

    if (brightness <= BRIGHTNESS_FADE) {
      // Fond sombre → totalement transparent
      cleaned[i + 3] = 0
      fullyTransparent++
    } else if (brightness >= BRIGHTNESS_KEEP) {
      // Pixel brillant → totalement opaque
      cleaned[i + 3] = 255
      fullyOpaque++
    } else {
      // Zone de transition → alpha proportionnel (smooth glow)
      const ratio = (brightness - BRIGHTNESS_FADE) / (BRIGHTNESS_KEEP - BRIGHTNESS_FADE)
      cleaned[i + 3] = Math.round(255 * ratio)
      partial++
    }
  }

  const total = data.length / 4
  console.log(`\n✨ Extraction :`)
  console.log(`   Transparents : ${(fullyTransparent / total * 100).toFixed(1)}% (fond)`)
  console.log(`   Glow (alpha partiel) : ${(partial / total * 100).toFixed(1)}%`)
  console.log(`   Opaques : ${(fullyOpaque / total * 100).toFixed(1)}% (cœur du I)\n`)

  // 3. Reconstituer le PNG, trim transparent, padding, resize
  const png = await sharp(cleaned, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer()

  const trimmed = await sharp(png)
    .trim({ threshold: 10 })
    .toBuffer({ resolveWithObject: true })
  console.log(`✂️  Trim : ${trimmed.info.width} × ${trimmed.info.height}`)

  const padded = await sharp(trimmed.data)
    .extend({
      top: PADDING, bottom: PADDING, left: PADDING, right: PADDING,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer()

  const final = await sharp(padded)
    .resize({ width: MAX_SIZE, height: MAX_SIZE, fit: 'inside', withoutEnlargement: true })
    .png({ compressionLevel: 9, quality: 90, effort: 10 })
    .toBuffer({ resolveWithObject: true })

  await fs.writeFile(OUTPUT, final.data)

  console.log(`📐 Final : ${final.info.width} × ${final.info.height} px`)
  console.log(`📊 Taille : ${(final.data.length / 1024).toFixed(0)} KB`)
  console.log('\n✅ Logo I extrait, vraiment transparent.')
}

main().catch(err => {
  console.error('❌ Erreur :', err.message)
  process.exit(1)
})
