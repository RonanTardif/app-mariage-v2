import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { ensureAuth } from './galleryService'

const LS_SCORES = 'mariage_quiz_scores_v1'

/* ─── Normalize ──────────────────────────────────────────────── */
function normalizeScore(raw) {
  return {
    player:    String(raw?.player   || '').trim().slice(0, 40) || 'Anonyme',
    score:     Number.isFinite(Number(raw?.score))    ? Number(raw.score)    : 0,
    total:     Number.isFinite(Number(raw?.total))    ? Number(raw.total)    : 0,
    answered:  Number.isFinite(Number(raw?.answered)) ? Number(raw.answered) : 0,
    time:      String(raw?.time     || '').trim().slice(0, 5),
  }
}

/* ─── Subscribe (onSnapshot) ─────────────────────────────────── */
export function subscribeToLeaderboard(onData, onError) {
  const q = query(
    collection(db, 'leaderboard'),
    orderBy('score', 'desc'),
    orderBy('created_at', 'asc')
  )
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError
  )
}

/* ─── Submit ─────────────────────────────────────────────────── */
export async function submitScore(raw) {
  const score = normalizeScore(raw)

  // Sauvegarde locale immédiate (fallback si Firebase échoue)
  try {
    const stored = JSON.parse(localStorage.getItem(LS_SCORES) || '[]')
    stored.push({ ...score, created_at: new Date().toISOString() })
    localStorage.setItem(LS_SCORES, JSON.stringify(stored))
  } catch {}

  await ensureAuth()
  await addDoc(collection(db, 'leaderboard'), {
    ...score,
    created_at: serverTimestamp(),
  })
}
