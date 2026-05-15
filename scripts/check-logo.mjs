// Diagnostic : analyse le canal alpha du logo
import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FILE = path.join(__dirname, '..', 'public', 'logo-original.png')

const { data, info } = await sharp(FILE).ensureAlpha().raw().toBuffer({ resolveWithObject: true })

const buckets = { 0: 0, '1-50': 0, '51-150': 0, '151-254': 0, 255: 0 }
for (let i = 0; i < data.length; i += 4) {
  const a = data[i + 3]
  if (a === 0) buckets[0]++
  else if (a <= 50) buckets['1-50']++
  else if (a <= 150) buckets['51-150']++
  else if (a <= 254) buckets['151-254']++
  else buckets[255]++
}
const total = data.length / 4
console.log(`📊 Analyse de logo-original.png (${info.width}×${info.height})\n`)
for (const [range, count] of Object.entries(buckets)) {
  const pct = (count / total * 100).toFixed(1)
  console.log(`  alpha=${range.padEnd(8)}: ${count.toString().padStart(8)} px (${pct}%)`)
}
