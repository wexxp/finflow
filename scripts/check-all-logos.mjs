import sharp from 'sharp'
import path from 'path'
import fs from 'fs/promises'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FILES = ['logo-original.png', 'logo.png']

for (const name of FILES) {
  const file = path.join(__dirname, '..', 'public', name)
  try {
    const stat = await fs.stat(file)
    const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    let opaque = 0, transparent = 0, partial = 0
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3]
      if (a === 0) transparent++
      else if (a === 255) opaque++
      else partial++
    }
    const total = data.length / 4
    console.log(`\n📄 public/${name}`)
    console.log(`   Taille fichier  : ${(stat.size / 1024).toFixed(1)} KB`)
    console.log(`   Dimensions      : ${info.width} × ${info.height}`)
    console.log(`   Alpha 0 (transparent)  : ${(transparent / total * 100).toFixed(1)}%`)
    console.log(`   Alpha 1-254 (partiel)  : ${(partial / total * 100).toFixed(1)}%`)
    console.log(`   Alpha 255 (opaque)     : ${(opaque / total * 100).toFixed(1)}%`)
    const verdict = transparent > 0 || partial > 0 ? '✅ TRANSPARENT' : '❌ OPAQUE (aucune transparence)'
    console.log(`   Verdict : ${verdict}`)
  } catch (e) {
    console.log(`\n📄 public/${name} : ${e.message}`)
  }
}
