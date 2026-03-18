import { useState, useCallback } from 'react'
import { reactToPhoto, getMyReactions } from '../services/galleryService'

export function useGalleryLikes() {
  const [myReactions, setMyReactions] = useState(getMyReactions)
  // { [photo_id]: { '❤️': N, '🔥': N, ... } }
  const [reactionOverrides, setReactionOverrides] = useState({})

  const handleReact = useCallback(async (photo, emoji) => {
    const prevEmoji = myReactions[photo.photo_id] ?? null
    const current = reactionOverrides[photo.photo_id] ?? photo.reactions ?? {}
    const optimistic = { ...current }

    // Optimistic update
    if (prevEmoji === emoji) {
      optimistic[emoji] = Math.max(0, (optimistic[emoji] || 0) - 1)
      setMyReactions((prev) => { const n = { ...prev }; delete n[photo.photo_id]; return n })
    } else {
      if (prevEmoji) optimistic[prevEmoji] = Math.max(0, (optimistic[prevEmoji] || 0) - 1)
      optimistic[emoji] = (optimistic[emoji] || 0) + 1
      setMyReactions((prev) => ({ ...prev, [photo.photo_id]: emoji }))
    }
    setReactionOverrides((prev) => ({ ...prev, [photo.photo_id]: optimistic }))

    // Firebase write (fire and forget)
    await reactToPhoto(photo.photo_id, emoji)
  }, [myReactions, reactionOverrides])

  function getReactionCounts(photo) {
    return reactionOverrides[photo.photo_id] ?? photo.reactions ?? {}
  }

  function getMyReaction(photo_id) {
    return myReactions[photo_id] ?? null
  }

  function getTotal(photo) {
    const counts = getReactionCounts(photo)
    return Object.values(counts).reduce((s, n) => s + n, 0)
  }

  // Kept for backward compat (Lightbox still checks isLiked / getDisplayCount)
  function isLiked(photo_id) { return !!myReactions[photo_id] }
  function getDisplayCount(photo) { return getTotal(photo) }

  return { handleReact, getReactionCounts, getMyReaction, getTotal, isLiked, getDisplayCount }
}
