/**
 * sync-rooms.mjs
 * Fetches room assignments from the Google Apps Script API and writes
 * the result to public/data/rooms.json.
 *
 * Usage:
 *   node scripts/sync-rooms.mjs
 */

import { writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const GAS_URL =
  'https://script.google.com/macros/s/AKfycbw-idCx_8IzXZLG7R-_BOUnrZn0LvCXChhl7VcipxqdmuHdL9zCZ4f0RuyxG30zP7gV1Q/exec?path=rooms'

const OUTPUT = resolve(__dirname, '../public/data/rooms.json')

/* ── JSONP fetch via callback trick ──────────────────────────────
   GAS doesn't support plain JSON with CORS, but it does support
   a ?callback= param that wraps the response in a JS function call.
   Node can't execute that directly, so we strip the wrapper. */
async function fetchJsonp(url) {
  const callbackName = 'cb'
  const res = await fetch(`${url}&callback=${callbackName}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const text = await res.text()
  // Strip: cb({...}) or cb([...])
  const match = text.match(/^[^(]+\((.+)\);?\s*$/s)
  if (!match) throw new Error(`Unexpected JSONP response:\n${text.slice(0, 200)}`)
  return JSON.parse(match[1])
}

console.log('Fetching rooms from GAS…')
const payload = await fetchJsonp(GAS_URL)

if (!Array.isArray(payload?.rooms) || payload.rooms.length === 0) {
  console.error('❌ Réponse inattendue ou vide :', payload)
  process.exit(1)
}

writeFileSync(OUTPUT, JSON.stringify(payload.rooms, null, 2) + '\n', 'utf-8')
console.log(`✅ ${payload.rooms.length} entrées écrites dans public/data/rooms.json`)
