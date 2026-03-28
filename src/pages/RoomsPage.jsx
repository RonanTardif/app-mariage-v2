import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PageIntro } from '../components/shared/PageIntro'
import { Input } from '../components/ui/input'
import { Card, CardContent } from '../components/ui/card'
import { useAsyncData } from '../hooks/useAsyncData'
import { getRooms } from '../services/dataService'
import { normalizeName } from '../utils/text'
import { LoadingState, ErrorState } from '../components/shared/LoadingState'

function personLabel(room) {
  return room.display_name || room.full_name || room.person_id || '—'
}

function isNonEmpty(v) {
  return String(v || '').trim() !== ''
}

function buildingTheme(building) {
  const b = (building || '').toLowerCase()
  if (b.includes('château') || b.includes('chateau'))
    return { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200', icon: '🏰' }
  if (b.includes('gîte') || b.includes('gite'))
    return { bg: 'bg-sage-100', text: 'text-sage-700', border: 'border-sage-300', icon: '🏡' }
  return { bg: 'bg-sand/60', text: 'text-stone-600', border: 'border-stone-200', icon: '🏠' }
}

function Avatar({ name, isYou, theme }) {
  const initials = String(name || '?')
    .split(/[\s-]+/)
    .map(w => w[0] || '')
    .join('')
    .toUpperCase()
    .slice(0, 2)
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`h-11 w-11 rounded-2xl flex items-center justify-center text-sm font-bold transition-all
        ${isYou
          ? `${theme.bg} ${theme.text} ring-2 ring-offset-2 ${theme.border}`
          : 'bg-stone-100 text-stone-500'
        }`}
      >
        {initials}
      </div>
      <p className={`text-[10px] font-medium text-center w-14 truncate
        ${isYou ? theme.text : 'text-stone-400'}`}
      >
        {isYou ? 'Vous' : String(name || '').split(' ')[0]}
      </p>
    </div>
  )
}

function Pill({ icon, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1 text-xs text-stone-600">
      <span>{icon}</span>{label}
    </span>
  )
}

export function RoomsPage() {
  const { data: rawRooms, loading, error } = useAsyncData(getRooms, [])
  const rooms = rawRooms ?? []
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)

  const matches = useMemo(() => {
    if (!showDropdown || !query.trim()) return []
    const q = normalizeName(query)
    return rooms
      .filter((room) =>
        normalizeName(room.display_name || '').includes(q) ||
        normalizeName(room.full_name || '').includes(q) ||
        normalizeName(room.person_id || '').includes(q)
      )
      .slice(0, 8)
  }, [query, rooms, showDropdown])

  const roommates = useMemo(() => {
    if (!selected) return []
    return rooms.filter(
      (room) =>
        normalizeName(room.room_name || '') === normalizeName(selected.room_name || '') &&
        normalizeName(room.building || '') === normalizeName(selected.building || '')
    )
  }, [selected, rooms])

  if (loading) return <LoadingState message="Chargement des chambres…" />
  if (error) return <ErrorState message="Impossible de charger les chambres. Réessaie plus tard." />

  function selectRoom(room) {
    setSelected(room)
    setQuery(personLabel(room))
    setShowDropdown(false)
  }

  const theme = selected ? buildingTheme(selected.building) : null

  return (
    <>
      <PageIntro
        eyebrow="Hébergement"
        title="Trouver sa chambre"
        description="Tape ton prénom + nom pour retrouver ta chambre et tes colocataires."
      />

      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setSelected(null)
          setShowDropdown(true)
        }}
        onFocus={() => { if (query.length >= 1) setShowDropdown(true) }}
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
            {matches.map((room, idx) => {
              const t = buildingTheme(room.building)
              return (
                <button key={idx} onClick={() => selectRoom(room)} className="w-full text-left">
                  <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 hover:bg-stone-50 active:scale-[0.99] transition-all">
                    <div className={`h-9 w-9 shrink-0 rounded-xl flex items-center justify-center text-base ${t.bg}`}>
                      {t.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">{personLabel(room)}</p>
                      {(room.building || room.room_name) && (
                        <p className="text-xs text-stone-400 truncate mt-0.5">
                          {[room.building, room.room_name].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>
                    {room.building && (
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${t.bg} ${t.text}`}>
                        {room.building}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Carte résultat */}
      <AnimatePresence mode="wait">
        {selected && theme && (
          <motion.div
            key={selected.person_id || selected.full_name}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4"
          >
            <Card>
              <CardContent>
                {/* Zone A — Salutation */}
                <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">Bonjour 👋</p>
                <p className="text-xl font-bold text-foreground mt-0.5">{personLabel(selected)}</p>

                {/* Zone B — Chambre hero */}
                <div className={`mt-4 rounded-2xl p-4 ${theme.bg}`}>
                  <p className={`text-xs font-bold uppercase tracking-widest ${theme.text}`}>
                    {theme.icon} {selected.building}
                  </p>
                  {isNonEmpty(selected.room_name) && (
                    <p className={`text-xl font-bold mt-1 leading-tight ${theme.text}`}>
                      {selected.room_name}
                    </p>
                  )}
                  {isNonEmpty(selected.notes) && (
                    <p className={`mt-1.5 text-sm ${theme.text} opacity-70`}>
                      {selected.notes}
                    </p>
                  )}
                </div>

                {/* Zone C — Pills détails optionnels */}
                {(isNonEmpty(selected.bed_type) || isNonEmpty(selected.bathroom) || isNonEmpty(selected.capacity) || isNonEmpty(selected.extra)) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {isNonEmpty(selected.bed_type) && <Pill icon="🛏" label={selected.bed_type} />}
                    {isNonEmpty(selected.bathroom) && <Pill icon="🚿" label={selected.bathroom} />}
                    {isNonEmpty(selected.capacity) && <Pill icon="👥" label={`${selected.capacity} pers.`} />}
                    {isNonEmpty(selected.extra) && <Pill icon="✨" label={selected.extra} />}
                  </div>
                )}

                {/* Zone D — Colocataires (toujours visibles) */}
                {roommates.length > 0 && (
                  <>
                    <div className="mt-4 border-t border-border" />
                    <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-stone-400">
                      Dans cette chambre
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {roommates.map((mate, idx) => (
                        <Avatar
                          key={idx}
                          name={personLabel(mate)}
                          isYou={normalizeName(personLabel(mate)) === normalizeName(personLabel(selected))}
                          theme={theme}
                        />
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="mt-4 text-xs text-stone-400">
        Tu ne trouves pas ton nom ? Viens nous voir.
      </p>
    </>
  )
}
