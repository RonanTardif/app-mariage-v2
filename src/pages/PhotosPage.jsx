import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Camera } from 'lucide-react'
import { PageIntro } from '../components/shared/PageIntro'
import { Input } from '../components/ui/input'
import { useAsyncData } from '../hooks/useAsyncData'
import { getPhotoSlots } from '../services/dataService'
import { normalizeName } from '../utils/text'
import { LoadingState, ErrorState } from '../components/shared/LoadingState'

// Heure d'arrivée = eta - 5 min
function computeArriveAt(etaStr) {
  const m = String(etaStr || '').match(/(\d{1,2}):(\d{2})/)
  if (!m) return null
  let h = Number(m[1]), min = Number(m[2]) - 5
  if (min < 0) { min += 60; h -= 1 }
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

function statusConfig(status) {
  const s = (status || '').toUpperCase()
  if (s === 'NOW')    return { label: 'En cours',    bg: 'bg-amber-50',       timeColor: 'text-amber-600',  pill: 'bg-amber-100 text-amber-700' }
  if (s === 'DONE')   return { label: 'Fait',         bg: 'bg-green-50/40',    timeColor: 'text-stone-300',  pill: 'bg-green-100 text-green-700' }
  if (s === 'SKIP')   return { label: 'Sauté',        bg: 'bg-stone-50',       timeColor: 'text-stone-300',  pill: 'bg-stone-100 text-stone-500' }
  if (s === 'REPLAN') return { label: 'Replanifié',   bg: 'bg-amber-50/50',    timeColor: 'text-amber-500',  pill: 'bg-amber-100 text-amber-700' }
  return               { label: 'À venir',            bg: 'bg-card',           timeColor: 'text-foreground', pill: 'bg-stone-100 text-stone-600' }
}

function SlotTicket({ slot }) {
  const eta = slot.eta ? String(slot.eta).match(/(\d{1,2}:\d{2})/)?.[1] ?? slot.eta : '--:--'
  const s = (slot.status || '').toUpperCase()
  const isNow    = s === 'NOW'
  const isDone   = s === 'DONE'
  const isSkip   = s === 'SKIP'
  const isPending = !isNow && !isDone && !isSkip
  const cfg = statusConfig(slot.status)
  const arriveAt = (isNow || isPending) ? computeArriveAt(slot.eta) : null
  const strikeTime = isDone || isSkip

  return (
    <div className={`overflow-hidden rounded-2xl border ${isNow ? 'border-amber-300' : isDone ? 'border-green-200' : 'border-border'}`}>
      {/* Barre NOW avec dot pulsant */}
      {isNow && (
        <div className="flex items-center gap-2 bg-amber-400 px-4 py-2">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
          </span>
          <p className="text-xs font-bold uppercase tracking-widest text-amber-900">En cours maintenant</p>
        </div>
      )}

      {/* Corps du ticket */}
      <div className={`p-4 ${cfg.bg}`}>
        {/* Ligne : groupe + pill statut */}
        <div className="flex items-start justify-between gap-2">
          <p className={`font-semibold text-sm leading-snug ${isDone || isSkip ? 'text-stone-400' : 'text-foreground'}`}>
            {slot.groupName}
          </p>
          {!isNow && (
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${cfg.pill}`}>
              {cfg.label}
            </span>
          )}
        </div>

        {/* Heure en héro */}
        <p className={`text-5xl font-black tabular-nums mt-1 leading-none ${cfg.timeColor} ${strikeTime ? 'line-through' : ''}`}>
          {eta}
        </p>

        {/* Lieu */}
        <div className="mt-2 flex items-center gap-1.5 text-sm text-stone-500">
          <MapPin size={13} className="shrink-0" />
          <span>{slot.location || 'Lieu à confirmer'}</span>
        </div>

        {/* Heure d'arrivée — uniquement pending/NOW */}
        {arriveAt && (
          <p className="mt-2 text-xs text-stone-400">
            Sois là à <strong className="text-stone-600">{arriveAt}</strong>
          </p>
        )}

        {/* Notes */}
        {slot.notes && (
          <p className="mt-2 text-xs text-stone-500 rounded-xl bg-white/70 px-3 py-2 border border-border">
            {slot.notes}
          </p>
        )}
      </div>
    </div>
  )
}

export function PhotosPage() {
  const { data, loading, error } = useAsyncData(getPhotoSlots, [])
  const people = data?.people || []
  const slots  = data?.slots  || []
  const groups = data?.groups || []

  const [query, setQuery] = useState('')
  const [person, setPerson] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)

  const matches = useMemo(() => {
    if (!showDropdown || query.length < 2) return []
    const q = normalizeName(query)
    return people
      .filter((p) => normalizeName(p.search_text || p.display_name || '').includes(q))
      .slice(0, 12)
  }, [query, people, showDropdown])

  const personSlots = useMemo(() => {
    if (!person) return []
    const ids = String(person.group_ids || '').split(/[;,\s]+/).map(s => s.trim()).filter(Boolean)
    return ids
      .map((id) => {
        const group = groups.find(g => String(g.group_id) === id)
        if (!group) return null
        const slot = slots.find(s => String(s.slot_id) === String(group.slot_id))
        return {
          groupName: group.group_name,
          eta:      slot?.eta      || '',
          location: slot?.location || '',
          status:   slot?.status   || '',
          notes:    slot?.notes    || '',
        }
      })
      .filter(Boolean)
      .sort((a, b) => (a.eta || '99:99').localeCompare(b.eta || '99:99'))
  }, [person, groups, slots])

  if (loading) return <LoadingState message="Chargement des créneaux photos…" />
  if (error)   return <ErrorState message="Impossible de charger les créneaux. Réessaie plus tard." />

  function selectPerson(item) {
    setPerson(item)
    setQuery(item.display_name)
    setShowDropdown(false)
  }

  const firstName = person?.display_name?.split(' ')[0] ?? ''

  return (
    <>
      <PageIntro
        eyebrow="Photos"
        title="Ton créneau photo"
        description="Retrouve ton créneau en quelques secondes."
      />

      <Input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setPerson(null); setShowDropdown(true) }}
        onFocus={() => { if (query.length >= 2) setShowDropdown(true) }}
        placeholder="Tape prénom + nom"
      />

      {/* Autocomplete enrichi */}
      <AnimatePresence>
        {matches.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="mt-2 space-y-1.5"
          >
            {matches.map((item) => (
              <button key={item.person_id} onClick={() => selectPerson(item)} className="w-full text-left">
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 hover:bg-stone-50 active:scale-[0.99] transition-all">
                  <div className="h-9 w-9 shrink-0 rounded-xl bg-rose-100 flex items-center justify-center">
                    <Camera size={16} className="text-rose-600" />
                  </div>
                  <p className="font-semibold text-sm">{item.display_name}</p>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Résultat */}
      <AnimatePresence mode="wait">
        {person && (
          <motion.div
            key={person.person_id}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 space-y-3"
          >
            {/* Salutation */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">Bonjour 👋</p>
              <p className="text-xl font-bold text-foreground mt-0.5">{person.display_name}</p>
            </div>

            {/* Tickets ou état vide */}
            {personSlots.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-200 p-6 text-center">
                <p className="text-2xl mb-2">📷</p>
                <p className="text-sm font-semibold text-stone-600">Aucun créneau trouvé</p>
                <p className="text-xs text-stone-400 mt-1">Viens nous voir sur place !</p>
              </div>
            ) : (
              personSlots.map((slot, idx) => (
                <SlotTicket key={idx} slot={slot} />
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
