import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { fetchJsonp } from './http'

const STATE_REF = () => doc(db, 'photoSession', 'state')
const DATA_REF  = () => doc(db, 'photoSession', 'data')

/* ─── Subscribe ──────────────────────────────────────────────── */
export function subscribeToSessionState(onData, onError) {
  return onSnapshot(STATE_REF(), (snap) => onData(snap.exists() ? snap.data() : null), onError)
}

export function subscribeToSessionData(onData, onError) {
  return onSnapshot(DATA_REF(), (snap) => onData(snap.exists() ? snap.data() : null), onError)
}

/* ─── Read once (for AdminPage initial load) ─────────────────── */
export async function loadSessionState() {
  const snap = await getDoc(STATE_REF())
  return snap.exists() ? snap.data() : null
}

export async function hasSessionData() {
  const snap = await getDoc(DATA_REF())
  return snap.exists()
}

export async function loadSessionData() {
  const snap = await getDoc(DATA_REF())
  return snap.exists() ? snap.data() : null
}

/* ─── Write ──────────────────────────────────────────────────── */
export async function saveSessionState(state) {
  await setDoc(STATE_REF(), { ...state, updatedAt: serverTimestamp() })
}

/* ─── Seed depuis l'API GAS ──────────────────────────────────── */
export async function seedFromGas(gasApiUrl) {
  const payload = await fetchJsonp(gasApiUrl)

  const people = Array.isArray(payload?.people) ? payload.people : []
  const groups = Array.isArray(payload?.groups) ? payload.groups : []

  // Renommer "eta" → "baseEta" pour le calcul dynamique côté client
  const slots = Array.isArray(payload?.slots)
    ? payload.slots.map(({ eta, ...rest }) => ({ ...rest, baseEta: eta ?? '' }))
    : []

  if (!people.length && !groups.length && !slots.length) {
    throw new Error('Les données reçues de GAS sont vides ou invalides.')
  }

  await setDoc(DATA_REF(), { people, groups, slots, updatedAt: serverTimestamp() })
}
