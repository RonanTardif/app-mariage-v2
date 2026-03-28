import { signInAnonymously } from 'firebase/auth'
import {
  collection, doc, getDocs, setDoc, updateDoc, increment,
  runTransaction, query, orderBy, serverTimestamp,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { auth, db, storage } from '../lib/firebase'

export const REACTION_EMOJIS = ['❤️', '🔥', '😂', '😍', '🥹']

const LS_MY_REACTIONS = 'mariage_my_reactions_proto_v1'
const LS_MY_NAME      = 'mariage_my_name_proto_v1'
const LS_MY_UID       = 'mariage_my_uid_v1'

export function getMyUid() {
  try { return localStorage.getItem(LS_MY_UID) || null } catch { return null }
}
function saveMyUid(uid) {
  try { localStorage.setItem(LS_MY_UID, uid) } catch {}
}

/* ─── Auth anonyme ───────────────────────────────────────────── */
let _uid = null

export async function ensureAuth() {
  if (_uid) return _uid
  if (auth.currentUser) { _uid = auth.currentUser.uid; saveMyUid(_uid); return _uid }
  const { user } = await signInAnonymously(auth)
  _uid = user.uid
  saveMyUid(_uid)
  return _uid
}

/* ─── Helpers ────────────────────────────────────────────────── */
function emptyReactions() {
  return Object.fromEntries(REACTION_EMOJIS.map((e) => [e, 0]))
}

async function compressToBlob(file, maxPx = 1200, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = (e) => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        const ratio = Math.min(maxPx / img.width, maxPx / img.height, 1)
        const w = Math.round(img.width * ratio)
        const h = Math.round(img.height * ratio)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        canvas.toBlob(resolve, 'image/jpeg', quality)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

/* ─── Read ───────────────────────────────────────────────────── */
export async function getGalleryPhotos() {
  const q = query(collection(db, 'photos'), orderBy('created_at', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => {
    const data = d.data()
    return {
      ...data,
      created_at: data.created_at?.toDate?.()?.toISOString() ?? new Date().toISOString(),
      reactions: data.reactions ?? emptyReactions(),
    }
  })
}

/* ─── Write ──────────────────────────────────────────────────── */
// photoObj: { photo_id, file (File), author, caption? }
export async function submitPhoto({ photo_id, file, author, caption = '' }) {
  const uid = await ensureAuth()

  // 1. Upload HD (original)
  const hdRef = ref(storage, `photos/hd/${photo_id}`)
  await uploadBytes(hdRef, file)
  const hd_url = await getDownloadURL(hdRef)

  // 2. Compress → upload thumb
  const thumbBlob = await compressToBlob(file)
  const thumbRef = ref(storage, `photos/thumb/${photo_id}`)
  await uploadBytes(thumbRef, thumbBlob)
  const thumb_url = await getDownloadURL(thumbRef)

  // 3. Firestore doc
  await setDoc(doc(db, 'photos', photo_id), {
    photo_id,
    author: author.trim().slice(0, 40),
    caption,
    hd_url,
    thumb_url,
    uid,
    created_at: serverTimestamp(),
    reactions: emptyReactions(),
  })

  saveMyName(author)
}

/* ─── Reactions ──────────────────────────────────────────────── */
export async function reactToPhoto(photo_id, emoji) {
  const uid = await ensureAuth()
  const photoRef = doc(db, 'photos', photo_id)
  let newMyReaction = null

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(photoRef)
    if (!snap.exists()) throw new Error('Photo introuvable')

    const { reactions = {}, reactionsByUid = {} } = snap.data()
    const prevEmoji = reactionsByUid[uid] ?? null
    const newReactions = { ...reactions }
    const newByUid = { ...reactionsByUid }

    if (prevEmoji === emoji) {
      // Toggle off
      newReactions[emoji] = Math.max(0, (newReactions[emoji] || 0) - 1)
      delete newByUid[uid]
      newMyReaction = null
    } else {
      // Remplacer ou nouvelle réaction
      if (prevEmoji) newReactions[prevEmoji] = Math.max(0, (newReactions[prevEmoji] || 0) - 1)
      newReactions[emoji] = (newReactions[emoji] || 0) + 1
      newByUid[uid] = emoji
      newMyReaction = emoji
    }

    tx.update(photoRef, { reactions: newReactions, reactionsByUid: newByUid })
  })

  // Sync localStorage pour l'affichage optimiste
  const myReactions = loadMyReactions()
  if (newMyReaction) myReactions[photo_id] = newMyReaction
  else delete myReactions[photo_id]
  saveMyReactions(myReactions)

  return { myReaction: newMyReaction }
}

export function getMyReactions() { return loadMyReactions() }

function loadMyReactions() {
  try { return JSON.parse(localStorage.getItem(LS_MY_REACTIONS) || '{}') } catch { return {} }
}
function saveMyReactions(obj) {
  try { localStorage.setItem(LS_MY_REACTIONS, JSON.stringify(obj)) } catch {}
}

/* ─── My name ────────────────────────────────────────────────── */
export function getMyName() {
  try { return localStorage.getItem(LS_MY_NAME) || '' } catch { return '' }
}
export function saveMyName(name) {
  try { localStorage.setItem(LS_MY_NAME, name) } catch {}
}

/* ─── Totals helper ──────────────────────────────────────────── */
export function totalReactions(photo) {
  if (!photo?.reactions) return 0
  return Object.values(photo.reactions).reduce((s, n) => s + n, 0)
}
