// ════════════════════════════════════════════════════════════
// clean-logo.mjs
// Méthode "nucléaire" : binarise le canal alpha
// → chaque pixel : alpha >= ALPHA_KEEP devient 255, sinon 0
// → AUCUN bord progressif, donc aucun halo possible
// ════════════════════════════════════════════════════════════
import sharp from 'sharp'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SOURCE = path.join(__dirname, '..', 'public', 'logo-original.png')
const OUTPUT = path.join(__dirname, '..', 'public', 'logo.png')

const ALPHA_KEEP = 180  // pixels avec alpha < 180 deviennent totalement transparents
const MAX_SIZE = 512

async function main() {
  console.log('💎 Binarisation alpha du logo ICEdep\n')

  // 1. Lire en raw RGBA
  const { data, info } = await sharp(SOURCE)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  console.log(`📐 Source : ${info.width} × ${info.height}, ${info.channels} canaux`)

  // 2. Binariser le canal alpha
  const cleaned = Buffer.alloc(data.length)
  let keptPixels = 0
  for (let i = 0; i < data.length; i += 4) {
    cleaned[i]   = data[i]      // R
    cleaned[i+1] = data[i+1]    // G
    cleaned[i+2] = data[i+2]    // B
    if (data[i+3] >= ALPHA_KEEP) {
      cleaned[i+3] = 255        // Pixel gardé : alpha plein
      keptPixels++
    } else {
      cleaned[i+3] = 0          // Pixel viré : transparent total
    }
  }
  console.log(`✨ Pixels gardés (alpha >= ${ALPHA_KEEP}) : ${keptPixels.toLocaleString()} (${(keptPixels / (data.length / 4) * 100).toFixed(1)}%)`)

  // 3. Reconvertir + trim + resize
  const result = await sharp(cleaned, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer()

  const final = await sharp(result)
    .trim({ threshold: 1 })   // trim minime, on a déjà du transparent strict
    .resize({
      width: MAX_SIZE,
      height: MAX_SIZE,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .png({ compressionLevel: 9, quality: 90, effort: 10 })
    .toBuffer({ resolveWithObject: true })

  await fs.writeFile(OUTPUT, final.data)

  console.log(`📐 Final : ${final.info.width} × ${final.info.height} px`)
  console.log(`📊 Taille : ${(final.data.length / 1024).toFixed(0)} KB`)
  console.log('\n✅ Logo binarisé — aucun pixel semi-transparent restant.')
}

main().catch(err => {
  console.error('❌ Erreur :', err.message)
  process.exit(1)
})
