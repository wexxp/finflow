// ════════════════════════════════════════════════════════════
// make-favicon.mjs
// Crée une version carrée 256x256 du logo pour le favicon
// (le logo standard est 16:9 ce qui n'est pas idéal en favicon)
// ════════════════════════════════════════════════════════════
import sharp from 'sharp'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SOURCE = path.join(__dirname, '..', 'public', 'logo.png')
const OUTPUT = path.join(__dirname, '..', 'public', 'favicon-square.png')

const SIZE = 256
const PADDING = 24       // marge transparente autour du logo

async function main() {
  console.log('🎯 Création du favicon carré 256×256...\n')

  const sourceMeta = await sharp(SOURCE).metadata()
  console.log(`📐 Source : ${sourceMeta.width} × ${sourceMeta.height}`)

  // Étape 1 : ramener le logo dans un canvas carré transparent avec padding
  const innerSize = SIZE - PADDING * 2
  const resized = await sharp(SOURCE)
    .resize({
      width: innerSize,
      height: innerSize,
      fit: 'inside',
      withoutEnlargement: false,
    })
    .toBuffer()

  // Étape 2 : centrer dans un canvas SIZE × SIZE transparent
  const out = await sharp({
    create: {
      width: SIZE,
      height: SIZE,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    }
  })
    .composite([{ input: resized, gravity: 'center' }])
    .png({ compressionLevel: 9, quality: 90, effort: 10 })
    .toBuffer({ resolveWithObject: true })

  await fs.writeFile(OUTPUT, out.data)
  console.log(`✅ favicon-square.png créé : ${SIZE} × ${SIZE} px, ${(out.data.length / 1024).toFixed(1)} KB`)
}

main().catch(err => {
  console.error('❌ Erreur :', err.message)
  process.exit(1)
})
