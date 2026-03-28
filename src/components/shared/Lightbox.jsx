import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import useEmblaCarousel from 'embla-carousel-react'
import { REACTION_EMOJIS } from '../../services/galleryService'

/* ─── Floating heart animation on double-tap ─────────────────── */
function FloatingHeart({ pos }) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 1, y: 0 }}
      animate={{ scale: 2, opacity: 0, y: -80 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      style={{ position: 'absolute', left: pos.x - 20, top: pos.y - 20, pointerEvents: 'none', zIndex: 10 }}
      className="text-4xl select-none"
    >
      ❤️
    </motion.div>
  )
}

/* ─── Reaction bar ───────────────────────────────────────────── */
function ReactionBar({ photo, myReaction, reactionCounts, onReact }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {REACTION_EMOJIS.map((emoji) => {
        const count = reactionCounts[emoji] || 0
        const active = myReaction === emoji
        return (
          <motion.button
            key={emoji}
            whileTap={{ scale: 0.85 }}
            onClick={() => onReact(photo, emoji)}
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
              active
                ? 'bg-white text-stone-900 shadow-sm'
                : count > 0
                ? 'bg-white/15 text-white'
                : 'bg-white/8 text-white/50 hover:bg-white/15 hover:text-white'
            }`}
          >
            <span>{emoji}</span>
            {count > 0 && <span className="text-xs tabular-nums">{count}</span>}
          </motion.button>
        )
      })}
    </div>
  )
}

/* ─── Main Lightbox ──────────────────────────────────────────── */
export function Lightbox({ photos, index, onClose, getReactionCounts, getMyReaction, handleReact }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, startIndex: index })
  const [currentIndex, setCurrentIndex] = useState(index)
  const lastTapRef = useRef(0)
  const [heart, setHeart] = useState(null) // { photoId, x, y }

  /* sync index on select */
  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setCurrentIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    emblaApi.on('select', onSelect)
    return () => emblaApi.off('select', onSelect)
  }, [emblaApi, onSelect])

  /* keyboard nav */
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') emblaApi?.scrollPrev()
      if (e.key === 'ArrowRight') emblaApi?.scrollNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, emblaApi])

  /* lock scroll */
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  /* double-tap to ❤️ */
  function handleImageTap(e, photo, imgEl) {
    const now = Date.now()
    if (now - lastTapRef.current < 320) {
      const rect = imgEl?.getBoundingClientRect()
      const clientX = e.clientX ?? e.changedTouches?.[0]?.clientX ?? 0
      const clientY = e.clientY ?? e.changedTouches?.[0]?.clientY ?? 0
      setHeart({ photoId: photo.photo_id, x: clientX - (rect?.left ?? 0), y: clientY - (rect?.top ?? 0) })
      handleReact(photo, '❤️')
      setTimeout(() => setHeart(null), 800)
    }
    lastTapRef.current = now
  }

  const photo = photos[currentIndex]
  if (!photo) return null

  const reactionCounts = getReactionCounts(photo)
  const myReaction = getMyReaction(photo.photo_id)
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < photos.length - 1

  return (
    <>
      {/* Dark overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-50 bg-black/95"
      />

      {/* Content layer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-50 flex flex-col"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0">
          <span className="text-xs text-white/40 tabular-nums">{currentIndex + 1} / {photos.length}</span>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Embla viewport */}
        <div ref={emblaRef} className="flex-1 overflow-hidden min-h-0">
          <div className="flex h-full">
            {photos.map((p) => {
              const imgRef = { current: null }
              return (
                <div
                  key={p.photo_id}
                  className="flex-[0_0_100%] flex items-center justify-center px-4"
                >
                  <div
                    className="relative"
                    onClick={(e) => handleImageTap(e, p, imgRef.current)}
                    onTouchEnd={(e) => handleImageTap(e, p, imgRef.current)}
                  >
                    <img
                      ref={(el) => { imgRef.current = el }}
                      src={p.thumb_url}
                      alt={p.caption || p.author}
                      className="max-h-[68vh] max-w-full rounded-2xl object-contain select-none"
                      draggable={false}
                    />
                    <AnimatePresence>
                      {heart?.photoId === p.photo_id && (
                        <FloatingHeart key={`${heart.x}-${heart.y}`} pos={heart} />
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Prev / Next buttons (desktop) */}
        {hasPrev && (
          <button
            onClick={() => emblaApi?.scrollPrev()}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <ChevronLeft size={22} />
          </button>
        )}
        {hasNext && (
          <button
            onClick={() => emblaApi?.scrollNext()}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <ChevronRight size={22} />
          </button>
        )}

        {/* Bottom info + reactions */}
        <div className="shrink-0 px-5 py-4 space-y-3">
          <div>
            <p className="font-semibold text-white">{photo.author}</p>
            {photo.caption && (
              <p className="mt-0.5 text-sm text-white/55 line-clamp-2">{photo.caption}</p>
            )}
          </div>
          <ReactionBar
            photo={photo}
            myReaction={myReaction}
            reactionCounts={reactionCounts}
            onReact={handleReact}
          />
        </div>
      </motion.div>
    </>
  )
}
