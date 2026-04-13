import { readdir, writeFile, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pdfDir = join(root, 'pdf')
const outDir = join(root, 'public')
const outFile = join(outDir, 'pdf-list.json')

const entries = await readdir(pdfDir)
const list = entries.filter((n) => /\.pdf$/i.test(n)).sort()

await mkdir(outDir, { recursive: true })
await writeFile(outFile, JSON.stringify(list, null, 2))
console.log(`Wrote ${list.length} entries to ${outFile}`)
