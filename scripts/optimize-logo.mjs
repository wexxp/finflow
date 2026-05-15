// ════════════════════════════════════════════════════════════
// optimize-logo.mjs
// Trim les bords transparents + resize + compresse public/logo.png
// Usage : node scripts/optimize-logo.mjs
// ════════════════════════════════════════════════════════════
import sharp from 'sharp'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const INPUT  = path.join(__dirname, '..', 'public', 'logo.png')
const OUTPUT = path.join(__dirname, '..', 'public', 'logo.png')
const BACKUP = path.join(__dirname, '..', 'public', 'logo-original.png')

const MAX_SIZE = 512        // taille max (apple-touch-icon = 180, favicon = 32)
const TRIM_THRESHOLD = 10   // pixels considérés "vides" en-dessous de cet alpha

async function main() {
  console.log('🖼️  Optimisation du logo ICEdep\n')

  // 1. Backup
  try {
    await fs.copyFile(INPUT, BACKUP)
    console.log(`📦 Backup créé : ${path.relative(process.cwd(), BACKUP)}`)
  } catch (e) {
    console.log('⚠️  Pas de backup créé (fichier original déjà sauvegardé)')
  }

  const inputBuffer = await fs.readFile(INPUT)
  const inputMeta = await sharp(inputBuffer).metadata()
  console.log(`📐 Dimensions originales : ${inputMeta.width} × ${inputMeta.height} px`)
  console.log(`📊 Taille originale : ${(inputBuffer.length / 1024).toFixed(0)} KB\n`)

  // 2. Trim transparent borders + resize + compress
  const processed = await sharp(inputBuffer)
    .trim({ threshold: TRIM_THRESHOLD, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .resize({
      width: MAX_SIZE,
      height: MAX_SIZE,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .png({ compressionLevel: 9, quality: 90, effort: 10 })
    .toBuffer({ resolveWithObject: true })

  // 3. Write
  await fs.writeFile(OUTPUT, processed.data)

  console.log(`✂️  Trim transparent borders : OK`)
  console.log(`📐 Nouvelles dimensions : ${processed.info.width} × ${processed.info.height} px`)
  console.log(`📊 Nouvelle taille : ${(processed.data.length / 1024).toFixed(0)} KB`)
  const ratio = ((inputBuffer.length - processed.data.length) / inputBuffer.length * 100).toFixed(1)
  console.log(`🎯 Réduction : ${ratio}% (de ${(inputBuffer.length / 1024).toFixed(0)} KB → ${(processed.data.length / 1024).toFixed(0)} KB)`)
  console.log('\n✅ Logo optimisé. Tu peux le tester en local puis push.')
}

main().catch(err => {
  console.error('❌ Erreur :', err.message)
  process.exit(1)
})
