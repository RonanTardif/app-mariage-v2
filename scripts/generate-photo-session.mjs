/**
 * generate-photo-session.mjs
 * Génère public/data/photo-session.json depuis plan-couchage_corrected.json.
 * Le JSON produit peut être chargé dans Firestore via AdminPage (seedFromJson).
 *
 * Usage:
 *   node scripts/generate-photo-session.mjs
 *
 * Input:  public/data/plan-couchage_corrected.json
 * Output: public/data/photo-session.json
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const inputPath  = resolve(__dirname, '../public/data/plan-couchage_corrected.json')
const outputPath = resolve(__dirname, '../public/data/photo-session.json')

function normalizeForSearch(str) {
  return (str || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

function uniq(arr) { return [...new Set(arr)] }

// ── Personnes ─────────────────────────────────────────────────────────────────
const { guests } = JSON.parse(readFileSync(inputPath, 'utf8'))

const people = guests.map(g => ({
  person_id:    g.id,
  display_name: `${g.firstName} ${g.lastName}`,
  search_text:  normalizeForSearch(`${g.firstName} ${g.lastName}`),
}))

// ── Mariés présents dans tous les groupes ─────────────────────────────────────
const MARIES = ['guest-18', 'guest-19']  // Lorie Ebanga, Ronan Tardif
function withMaries(ids) { return uniq([...ids, ...MARIES]) }

// ── Sous-groupes (pour expansion) ────────────────────────────────────────────
const G1A = ['guest-91', 'guest-89', 'guest-92', 'guest-93']
// Maryline Tardif, Frédéric Tardif, Nolwenn Tardif, Quentin Le Floch

const G1C = ['guest-96', 'guest-99', 'guest-97', 'guest-95', 'guest-98', 'guest-10004']
// Jean-Paul Ebanga, Sophie Ebanga, Léa Ebanga, Clément Pietri, Rose Pietri, Joseph Pietri

const G7A = ['guest-96', 'guest-99', 'guest-80', 'guest-97', 'guest-82', 'guest-98', 'guest-86', 'guest-87', 'guest-88', 'guest-10004']
// Jean-Paul, Sophie, Josette, Léa, Alexis, Rose, Dimitri, Phillipe, Stanislas Ebanga, Joseph Pietri

const G2A = ['guest-56', 'guest-97', 'guest-95']
// Thaïs Numéric, Léa Ebanga, Clément Pietri

const G2B = ['guest-33', 'guest-1', 'guest-38', 'guest-31']
// Guillaume Léard, Pierre Luciat, Tristan Carudel, Pablo Giboire

const G3A = [
  'guest-14', 'guest-15', 'guest-8',  'guest-10', 'guest-114',
  'guest-30', 'guest-1',  'guest-33', 'guest-38', 'guest-31',
  'guest-36', 'guest-10001',
]
// Antoine Lagadec, Guillaume Le Meudec, Bastien Jammes, Maxime Le Goff, Sami Hammoudi,
// Romuald Metellus, Pierre Luciat, Guillaume Léard, Tristan Carudel, Pablo Giboire,
// Frieder Philipps, Julien Robert

// ── Les 19 groupes (ordre logistique optimisé) ────────────────────────────────
const GROUPS = [
  {
    id: 'group-1a',
    name: 'Famille proche de Ronan',
    memberIds: withMaries(G1A),
  },
  {
    id: 'group-1b',
    name: 'Famille Tardif avec Josiane',
    memberIds: withMaries(uniq(['guest-90', ...G1A])),
  },
  {
    id: 'group-1c',
    name: 'Famille proche de Lorie',
    memberIds: withMaries(G1C),
  },
  {
    id: 'group-1d',
    name: 'Famille de Lorie élargie',
    memberIds: withMaries(uniq(['guest-80', 'guest-94', ...G1C])),
  },
  {
    id: 'group-1e',
    name: 'Les deux familles',
    memberIds: withMaries(uniq([...G1A, 'guest-90', ...G1C, 'guest-80', 'guest-94'])),
  },
  {
    id: 'group-2a',
    name: 'Témoins de Lorie',
    memberIds: withMaries(G2A),
  },
  {
    id: 'group-2b',
    name: 'Témoins de Ronan',
    memberIds: withMaries(G2B),
  },
  {
    id: 'group-2c',
    name: 'Tous les témoins',
    memberIds: withMaries(uniq([...G2A, ...G2B])),
  },
  {
    id: 'group-7a',
    name: 'Famille Ebanga',
    memberIds: withMaries(G7A),
  },
  {
    id: 'group-7b',
    name: 'Grande famille Ebanga',
    memberIds: withMaries(uniq([...G7A,
      'guest-111', 'guest-84', 'guest-107', 'guest-109', 'guest-110',
      'guest-100', 'guest-95', 'guest-115', 'guest-112', 'guest-76', 'guest-105',
    ])),
    // + Laurent, Anne, Claire, Juliette, Laurène Saussaye, Alice Ballot-Léna,
    //   Clément Pietri, Victor Saïzonou, Léna Saïzonou, Nathalie Poyvre, Adel Aribi
  },
  {
    id: 'group-7c',
    name: 'Ebanga & amis proches',
    memberIds: withMaries(['guest-83', 'guest-85', 'guest-13', 'guest-99', 'guest-96', 'guest-97']),
    // Anne Heck, Bertrand Heck, Laurence Lafosse, Sophie, Jean-Paul, Léa Ebanga
  },
  {
    id: 'group-4c',
    name: 'Les Doudous',
    memberIds: withMaries(['guest-45', 'guest-46', 'guest-47', 'guest-48', 'guest-49', 'guest-50', 'guest-97', 'guest-95']),
    // Amaya London, Lucas Lallemant, Olivia Carlos, Etienne Phillipe, Laura Carré,
    // Romain Gontier, Léa Ebanga, Clément Pietri
  },
  {
    id: 'group-4a',
    name: 'Amis de Lorie — 1er groupe',
    memberIds: withMaries(['guest-22', 'guest-23', 'guest-24', 'guest-81', 'guest-28', 'guest-20', 'guest-21']),
    // Alix Vandenabeele, Antonin Le Goallec, Caroline Slimani, Clélia Laurent,
    // Quentin Le Dissez, Mathieu Boulestreau-Lannier, Pauline Boulestreau-Lannier
  },
  {
    id: 'group-4b',
    name: 'Amis de Lorie — 2e groupe',
    memberIds: withMaries([
      'guest-75', 'guest-74', 'guest-53', 'guest-55', 'guest-27',
      'guest-25', 'guest-26', 'guest-12', 'guest-11', 'guest-54', 'guest-57',
    ]),
    // Paul-Marie Munier, Marianne Gogat, Camille Mailharrou, Camille Frémont de Reboul,
    // Timothy Bellaiche, Anna Laure, Sophie Lacaze, Nicolas Poifol, Aurore Lefebvre,
    // Alban Frémont de Reboul, Khanh Nguyen
  },
  {
    id: 'group-4d',
    name: 'Amis de Lorie — 3e groupe',
    memberIds: withMaries(['guest-102', 'guest-103', 'guest-34', 'guest-35', 'guest-77', 'guest-32', 'guest-101', 'guest-52', 'guest-51']),
    // Auriane Garretti, Cristian Meneghello, Cornelia "Conny" Schmolke, Frieder Philipps,
    // Marie-Laure Gourtaud, Quentin Le Dissez, Lionel "Noah" Gourtaud,
    // Laure-Anne Halay, Diane Karcher Mourgues
  },
  {
    id: 'group-3a',
    name: 'Amis de Ronan Pacé — garçons',
    memberIds: withMaries(G3A),
  },
  {
    id: 'group-3b',
    name: 'Amis de Ronan Pacé — tous',
    memberIds: withMaries(uniq([
      ...G3A,
      'guest-16', 'guest-17', 'guest-37', 'guest-7', 'guest-9',
      'guest-39', 'guest-2', 'guest-29', 'guest-108',
    ])),
    // + Gwennoline Lagadec Tertrais, Sarah Valenti, Antoine Laize, Anaïs Picquenot,
    //   Maëlynn Le Goff, Yasmine Chebah, Zahra Shah, Timothy Bellaiche, Julia Chalaye
  },
  {
    id: 'group-5',
    name: 'Amies de Ronan',
    memberIds: withMaries(['guest-40', 'guest-42', 'guest-44', 'guest-104', 'guest-43', 'guest-33', 'guest-1', 'guest-41']),
    // Clara Duchemin, Marine Cévaer, Ninon Orhant, Alexandra Thomas, Marlène Niobey,
    // Guillaume Léard, Pierre Luciat, Johan Rivoire
  },
  {
    id: 'group-6a',
    name: 'Famille de Ronan',
    memberIds: withMaries([
      'guest-60', 'guest-61', 'guest-65', 'guest-66', 'guest-71',
      'guest-106', 'guest-113', 'guest-63', 'guest-70', 'guest-69',
      'guest-64', 'guest-62', 'guest-67', 'guest-3', 'guest-5',
      'guest-6', 'guest-4', 'guest-58', 'guest-68', 'guest-72',
      'guest-73', 'guest-59', 'guest-89', 'guest-91', 'guest-92',
      'guest-93', 'guest-90',
    ]),
  },
].map(g => ({ ...g, done: false }))

// ── Validation ────────────────────────────────────────────────────────────────
const guestIds = new Set(guests.map(g => g.id))
let warnCount = 0
for (const group of GROUPS) {
  for (const id of group.memberIds) {
    if (!guestIds.has(id)) {
      console.warn(`⚠️  ID inconnu: ${id} dans ${group.id}`)
      warnCount++
    }
  }
}

// ── Output ────────────────────────────────────────────────────────────────────
const output = {
  data: {
    people,
    groups: [],
    slots: [],
  },
  state: {
    photoStart: '2026-06-13T16:30',
    delayMinutes: 0,
    groupIntervalMinutes: 10,
    groups: GROUPS,
  },
}

writeFileSync(outputPath, JSON.stringify(output, null, 2) + '\n', 'utf-8')

console.log(`\n✅ ${people.length} personnes, ${GROUPS.length} groupes → ${outputPath}`)
if (warnCount) console.warn(`   ${warnCount} ID(s) introuvables — vérifier ci-dessus`)
console.log('')
GROUPS.forEach(g => {
  console.log(`   ${g.id.padEnd(12)} ${g.name.padEnd(40)} ${g.memberIds.length} membres`)
})
