/**
 * apply-realnames.mjs
 * Corrige les noms/prénoms dans plan-couchage_25052026.json,
 * supprime les invités Dabin, ajoute Joséphine/Joachim/Joseph,
 * et fixe l'encodage Latin-1 mal interprété.
 *
 * Usage:
 *   node scripts/apply-realnames.mjs
 *
 * Input:  public/data/plan-couchage_25052026.json
 * Output: public/data/plan-couchage_corrected.json
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const inputPath  = resolve(__dirname, '../public/data/plan-couchage_25052026.json')
const outputPath = resolve(__dirname, '../public/data/plan-couchage_corrected.json')

// ── Encoding fix (même logique que convert-rooms.mjs) ─────────────────────────
function maybeFixEncoding(str) {
  if (typeof str !== 'string') return str
  try {
    const bytes = Uint8Array.from(str, (c) => c.charCodeAt(0))
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return str
  }
}

// Corrections de séquences partiellement mojibakées dont les bytes de
// continuation UTF-8 ont été perdus (ex. 'É' → 'Ã' + <invisible 0x89 perdu>).
const PARTIAL_MOJIBAKE = {
  'Ãtage 2 â Aile droite':               'Étage 2 – Aile droite',
  'Ãtage 2 â Aile gauche':               'Étage 2 – Aile gauche',
  'Ãtage 1':                              'Étage 1',
  'Lit double â Chambre des mariÃ©s':    'Lit double – Chambre des mariés',
}

function fixStr(str) {
  if (typeof str !== 'string') return str
  const direct = PARTIAL_MOJIBAKE[str]
  if (direct) return direct
  return maybeFixEncoding(str)
}

function fixObj(obj) {
  if (typeof obj === 'string') return fixStr(obj)
  if (Array.isArray(obj)) return obj.map(fixObj)
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fixObj(v)]))
  }
  return obj
}

// ── Corrections de noms par guest ID ─────────────────────────────────────────
const corrections = {
  'guest-2':   { firstName: 'Zahra',              lastName: 'Shah' },
  'guest-4':   {                                   lastName: 'Duval' },
  'guest-6':   {                                   lastName: 'Duval' },
  'guest-16':  {                                   lastName: 'Lagadec Tertrais' },
  'guest-27':  { firstName: 'Timothy' },
  'guest-31':  {                                   lastName: 'Giboire' },
  'guest-34':  { firstName: 'Cornelia "Conny"' },
  'guest-39':  {                                   lastName: 'Chebah' },
  'guest-54':  {                                   lastName: 'Frémont de Reboul' },
  'guest-55':  {                                   lastName: 'Frémont de Reboul' },
  'guest-57':  { firstName: 'Khanh' },
  'guest-64':  {                                   lastName: 'Louazel' },
  'guest-66':  {                                   lastName: 'Menant' },
  'guest-75':  { firstName: 'Paul-Marie' },
  'guest-77':  {                                   lastName: 'Gourtaud' },
  'guest-88':  { firstName: 'Stanislas' },
  'guest-94':  { firstName: 'Alilé',              lastName: 'Akono-Ebanga' },
  'guest-101': { firstName: 'Lionel "Noah"' },
  'guest-102': {                                   lastName: 'Garretti' },
  'guest-106': {                                   lastName: 'Payen' },
  'guest-113': {                                   lastName: 'Payen' },
}

// ── IDs à supprimer (Claudie & Jean Dabin) ───────────────────────────────────
const IDS_TO_REMOVE = new Set(['guest-78', 'guest-79'])

// ── Nouveaux invités ──────────────────────────────────────────────────────────
const NEW_GUESTS = [
  {
    id: 'guest-10002',
    firstName: 'Joséphine',
    lastName: 'Frémont de Reboul',
    inviteDe: 'Lorie',
    presentSamedi: 'Présent',
    presentVendredi: 'Présent',
  },
  {
    id: 'guest-10003',
    firstName: 'Joachim',
    lastName: 'Aribi',
    inviteDe: 'Lorie',
    presentSamedi: 'Présent',
    presentVendredi: 'Absent',
  },
  {
    id: 'guest-10004',
    firstName: 'Joseph',
    lastName: 'Pietri',
    inviteDe: 'Lorie',
    presentSamedi: 'Présent',
    presentVendredi: 'Présent',
  },
]

// ── Nouveaux spots à injecter dans des chambres existantes ───────────────────
// [roomId, spot]
const NEW_SPOTS = [
  [
    'room-4',  // Château Chambre 02 — Alban & Camille Frémont de Reboul
    {
      id: 'spot-10006',
      type: 'mattress',
      label: 'Lit bébé',
      capacity: 1,
      assignedGuestIds: ['guest-10002'],
      isTemporary: true,
    },
  ],
  [
    'room-97',  // La Tour Chambre 02 — Léa, Clément, Rose Pietri
    {
      id: 'spot-10007',
      type: 'mattress',
      label: 'Lit bébé',
      capacity: 1,
      assignedGuestIds: ['guest-10004'],
      isTemporary: true,
    },
  ],
]

// ── Chargement + fix encodage ─────────────────────────────────────────────────
const raw = JSON.parse(readFileSync(inputPath, 'utf8'))
let { guests, accommodations } = fixObj(raw)

// ── Corrections des noms ──────────────────────────────────────────────────────
guests = guests
  .filter((g) => !IDS_TO_REMOVE.has(g.id))
  .map((g) => {
    const fix = corrections[g.id]
    return fix ? { ...g, ...fix } : g
  })

guests = [...guests, ...NEW_GUESTS]

// ── Injection des spots ───────────────────────────────────────────────────────
for (const [roomId, spot] of NEW_SPOTS) {
  let found = false
  accommodations = accommodations.map((acc) => ({
    ...acc,
    rooms: acc.rooms.map((room) => {
      if (room.id !== roomId) return room
      found = true
      return { ...room, sleepingSpots: [...room.sleepingSpots, spot] }
    }),
  }))
  if (!found) console.warn(`⚠️  Room not found: ${roomId}`)
}

// ── Écriture ──────────────────────────────────────────────────────────────────
const output = { guests, accommodations }
writeFileSync(outputPath, JSON.stringify(output, null, 2) + '\n', 'utf-8')

const corrected = Object.keys(corrections).length
const removed   = IDS_TO_REMOVE.size
const added     = NEW_GUESTS.length
console.log(`✅ ${guests.length} invités — ${corrected} corrections, ${removed} suppressions, ${added} ajouts → ${outputPath}`)
