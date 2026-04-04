/**
 * convert-rooms.mjs
 * Converts a plan-couchage.json file (hierarchical) to the flat rooms.json
 * format consumed by RoomsPage.
 *
 * Usage:
 *   node scripts/convert-rooms.mjs <input.json> [output.json]
 *
 * Default output: public/data/rooms2.json
 *
 * Output format (one entry per person):
 *   { person_id, display_name, building, room_name, notes, bed_type, capacity, bathroom, extra }
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Args ──────────────────────────────────────────────────────────────────────
const [, , inputArg, outputArg] = process.argv
if (!inputArg) {
  console.error('Usage: node scripts/convert-rooms.mjs <input.json> [output.json]')
  process.exit(1)
}
const inputPath = resolve(inputArg)
const outputPath = resolve(outputArg ?? resolve(__dirname, '../public/data/rooms2.json'))

// ── Encoding fix ──────────────────────────────────────────────────────────────
// Some exports misread UTF-8 as Latin-1 (e.g. "Ã©" instead of "é").
// We detect this by trying to re-decode each string as UTF-8 from Latin-1 bytes.
function maybeFixEncoding(str) {
  if (typeof str !== 'string') return str
  try {
    const bytes = Uint8Array.from(str, (c) => c.charCodeAt(0))
    // fatal:true throws if bytes are not valid UTF-8 — means string was already fine
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return str
  }
}

function fixObj(obj) {
  if (typeof obj === 'string') return maybeFixEncoding(obj)
  if (Array.isArray(obj)) return obj.map(fixObj)
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fixObj(v)]))
  }
  return obj
}

// ── Load ──────────────────────────────────────────────────────────────────────
const raw = JSON.parse(readFileSync(inputPath, 'utf8'))
const { guests, accommodations } = fixObj(raw)

const guestMap = Object.fromEntries(guests.map((g) => [g.id, g]))

// ── Convert ───────────────────────────────────────────────────────────────────
const rows = []

for (const acc of accommodations) {
  const category = acc.category === 'chateau' ? 'Château' : 'Gîtes'
  const building = acc.name.replace(/^Gîte\s+/i, '')  // "Gîte New-York" → "New-York", "Château" → "Château"
  const accTotalCapacity = acc.rooms
    .flatMap((r) => r.sleepingSpots)
    .reduce((sum, s) => sum + (s.assignedGuestIds?.length ?? 0), 0)

  for (const room of acc.rooms) {
    // Actual assigned guests: room-level for château, accommodation-level for gîtes
    const roomGuestCount = room.sleepingSpots.reduce((sum, s) => sum + (s.assignedGuestIds?.length ?? 0), 0)
    const totalCapacity = acc.category === 'chateau' ? roomGuestCount : accTotalCapacity
    const bathrooms = acc.bathroomCount > 0 ? `${acc.bathroomCount} SDB` : ''
    const floor = room.floor ? `${room.floor}` : ''

    for (const spot of room.sleepingSpots) {
      for (const guestId of spot.assignedGuestIds ?? []) {
        const guest = guestMap[guestId]
        if (!guest) {
          console.warn(`⚠️  Guest not found: ${guestId}`)
          continue
        }

        rows.push({
          person_id: guest.id,
          display_name: `${guest.firstName} ${guest.lastName}`,
          building,
          category,
          room_name: room.name,
          notes: floor,
          bed_type: spot.label ?? '',
          capacity: String(totalCapacity),
          bathroom: bathrooms,
          extra: '',
        })
      }
    }
  }
}

// ── Write ─────────────────────────────────────────────────────────────────────
writeFileSync(outputPath, JSON.stringify(rows, null, 2) + '\n', 'utf-8')
console.log(`✅ ${rows.length} entrées écrites dans ${outputPath}`)
