import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Reorder, useDragControls, motion, AnimatePresence } from 'framer-motion'
import { GripVertical, Check, RotateCcw, Clock, Users, Camera, Trash2, Plus, Database, Search, X } from 'lucide-react'
import { APP_CONFIG } from '../utils/constants'
import { computeGroupEta } from '../utils/etaUtils'
import { normalizeName } from '../utils/text'
import {
  loadSessionState,
  saveSessionState,
  hasSessionData,
  seedFromGas,
  loadSessionData,
} from '../services/photoSessionService'

/* ─── Helpers ────────────────────────────────────────────────── */
function uid() { return Math.random().toString(36).slice(2, 10) }

function ensureIds(groups) {
  return (groups || []).map(g => g.id ? g : { ...g, id: uid() })
}

/* ─── localStorage key ───────────────────────────────────────── */
const LS_KEY = 'mariage_admin_state_v8'

/* ─── Default state ──────────────────────────────────────────── */
const DEFAULT_STATE = {
  delayMinutes: 0,
  photoStart: '2026-06-13T16:30',
  groupIntervalMinutes: 10,
  groups: [
    { id: 'g1', name: 'Groupe 1', done: false, memberIds: [] },
    { id: 'g2', name: 'Groupe 2', done: false, memberIds: [] },
    { id: 'g3', name: 'Groupe 3', done: false, memberIds: [] },
  ],
}

/* ─── SyncBadge ──────────────────────────────────────────────── */
function SyncBadge({ status }) {
  const map = {
    idle:    { label: 'Non synchronisé',  color: 'text-stone-400', bg: 'bg-stone-100' },
    saving:  { label: 'Synchronisation…', color: 'text-amber-600', bg: 'bg-amber-50'  },
    saved:   { label: 'Synchronisé',      color: 'text-green-600', bg: 'bg-green-50'  },
    error:   { label: 'Erreur sync',      color: 'text-red-500',   bg: 'bg-red-50'    },
    loading: { label: 'Chargement…',      color: 'text-blue-500',  bg: 'bg-blue-50'   },
  }
  const { label, color, bg } = map[status] || map.idle
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${bg} ${color}`}>
      {(status === 'saving' || status === 'loading') && (
        <span className="h-2 w-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {status === 'saved' && <Check size={10} strokeWidth={3} />}
      {status === 'error' && <span className="h-2 w-2 rounded-full bg-current" />}
      {label}
    </span>
  )
}

/* ─── AddGroupModal ──────────────────────────────────────────── */
function AddGroupModal({ groupsCount, onAdd, onClose }) {
  const [people, setPeople] = useState([])
  const [loadingPeople, setLoadingPeople] = useState(true)
  const [name, setName] = useState(`Groupe ${groupsCount + 1}`)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(new Set())
  const nameRef = useRef(null)

  // Scroll lock + focus
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const t = setTimeout(() => nameRef.current?.select(), 120)
    return () => {
      document.body.style.overflow = ''
      clearTimeout(t)
    }
  }, [])

  // Load people once
  useEffect(() => {
    loadSessionData()
      .then(data => setPeople(data?.people || []))
      .catch(() => {})
      .finally(() => setLoadingPeople(false))
  }, [])

  const filtered = useMemo(() => {
    if (!search) return people
    const q = normalizeName(search)
    return people.filter(p =>
      normalizeName(p.display_name || p.search_text || '').includes(q)
    )
  }, [search, people])

  function toggle(personId) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(personId)) next.delete(personId)
      else next.add(personId)
      return next
    })
  }

  function handleAdd() {
    onAdd({
      id: uid(),
      name: name.trim() || `Groupe ${groupsCount + 1}`,
      done: false,
      memberIds: [...selected],
    })
    onClose()
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        className="relative z-10 flex flex-col rounded-t-3xl bg-white"
        style={{ maxHeight: '88dvh' }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 32, stiffness: 320 }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="h-1 w-10 rounded-full bg-stone-200" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 pb-4 pt-2 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-stone-900">Nouveau groupe</h2>
            <p className="text-xs text-stone-400 mt-0.5">
              {selected.size > 0
                ? `${selected.size} personne${selected.size > 1 ? 's' : ''} sélectionnée${selected.size > 1 ? 's' : ''}`
                : 'Nommez le groupe, sélectionnez les invités'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Name input */}
        <div className="px-5 pb-3 shrink-0">
          <input
            ref={nameRef}
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Famille, Témoins, Collègues…"
            className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-800 outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 transition-shadow"
          />
        </div>

        {/* Search */}
        <div className="px-5 pb-3 shrink-0">
          <div className="flex items-center gap-2 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-2.5">
            <Search size={14} className="text-stone-400 shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un invité…"
              className="flex-1 bg-transparent text-sm outline-none text-stone-700 placeholder:text-stone-400"
            />
            {search && (
              <button onClick={() => setSearch('')}>
                <X size={12} className="text-stone-400 hover:text-stone-600" />
              </button>
            )}
          </div>
        </div>

        {/* People list */}
        <div className="flex-1 overflow-y-auto px-5 pb-2 space-y-1.5 min-h-0">
          {loadingPeople ? (
            <div className="flex justify-center py-12">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-rose-300 border-t-transparent" />
            </div>
          ) : people.length === 0 ? (
            <div className="py-12 text-center space-y-1">
              <p className="text-sm font-semibold text-stone-500">Aucune personne disponible</p>
              <p className="text-xs text-stone-400">Importez d'abord les données depuis Google Sheets.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-stone-400">
              Aucun résultat pour « {search} »
            </div>
          ) : (
            filtered.map(person => {
              const isSelected = selected.has(person.person_id)
              return (
                <button
                  key={person.person_id}
                  onClick={() => toggle(person.person_id)}
                  className={`w-full flex items-center gap-3 rounded-2xl border px-4 py-2.5 text-left transition-all active:scale-[0.99] ${
                    isSelected
                      ? 'border-rose-200 bg-rose-50'
                      : 'border-stone-100 bg-white hover:bg-stone-50'
                  }`}
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    isSelected ? 'bg-rose-500 text-white' : 'bg-stone-100 text-stone-500'
                  }`}>
                    {isSelected
                      ? <Check size={14} strokeWidth={3} />
                      : (person.display_name?.[0]?.toUpperCase() ?? '?')}
                  </div>
                  <span className={`flex-1 text-sm font-medium ${isSelected ? 'text-rose-700' : 'text-stone-700'}`}>
                    {person.display_name}
                  </span>
                </button>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-8 pt-3 border-t border-stone-100 shrink-0">
          <button
            onClick={handleAdd}
            className="w-full rounded-2xl bg-rose-500 py-3.5 text-sm font-bold text-white hover:bg-rose-600 active:scale-[0.98] transition-all shadow-sm shadow-rose-200"
          >
            {selected.size > 0
              ? `Créer · ${selected.size} personne${selected.size > 1 ? 's' : ''}`
              : 'Créer le groupe'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ─── GroupRow ───────────────────────────────────────────────── */
function GroupRow({ group, index, eta, onToggleDone, onRename, onDelete }) {
  const controls = useDragControls()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(group.name)
  const inputRef = useRef(null)

  function commitRename() {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== group.name) onRename(trimmed)
    else setDraft(group.name)
    setEditing(false)
  }

  const memberCount = group.memberIds?.length ?? 0

  return (
    <Reorder.Item
      value={group}
      dragListener={false}
      dragControls={controls}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.18 }}
      className="touch-none"
    >
      <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors ${
        group.done ? 'border-stone-100 bg-stone-50 opacity-60' : 'border-stone-200 bg-white shadow-sm'
      }`}>

        {/* Drag handle */}
        <button
          onPointerDown={e => { e.preventDefault(); controls.start(e) }}
          className="cursor-grab active:cursor-grabbing text-stone-300 hover:text-stone-500 touch-none shrink-0"
          aria-label="Réordonner"
        >
          <GripVertical size={18} />
        </button>

        {/* Index badge */}
        <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-stone-100 text-xs font-bold text-stone-500">
          {index + 1}
        </span>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={e => {
                if (e.key === 'Enter') commitRename()
                if (e.key === 'Escape') { setDraft(group.name); setEditing(false) }
              }}
              className="w-full rounded-lg border border-rose-300 bg-rose-50 px-2 py-0.5 text-sm font-semibold text-stone-800 outline-none focus:ring-2 focus:ring-rose-300"
              autoFocus
            />
          ) : (
            <button
              onClick={() => { setDraft(group.name); setEditing(true) }}
              className={`text-left text-sm font-semibold ${group.done ? 'line-through text-stone-400' : 'text-stone-800'}`}
            >
              {group.name}
            </button>
          )}
          <p className="mt-0.5 flex items-center gap-2.5 text-xs text-stone-400">
            <span className="flex items-center gap-1">
              <Clock size={10} />{eta}
            </span>
            {memberCount > 0 && (
              <span className="flex items-center gap-1">
                <Users size={10} />{memberCount}
              </span>
            )}
          </p>
        </div>

        {/* Done toggle */}
        <button
          onClick={onToggleDone}
          className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
            group.done
              ? 'border-green-400 bg-green-400 text-white'
              : 'border-stone-200 bg-white text-transparent hover:border-green-300'
          }`}
          aria-label={group.done ? 'Marquer non fait' : 'Marquer fait'}
        >
          <Check size={14} strokeWidth={3} />
        </button>

        {/* Delete */}
        <button
          onClick={onDelete}
          className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full text-stone-300 hover:bg-red-50 hover:text-red-400 transition-colors"
          aria-label="Supprimer"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </Reorder.Item>
  )
}

/* ─── AdminPage ──────────────────────────────────────────────── */
export function AdminPage() {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        return { ...parsed, groups: ensureIds(parsed.groups) }
      }
    } catch {}
    return DEFAULT_STATE
  })

  const [syncStatus, setSyncStatus] = useState('idle')
  const debounceRef = useRef(null)
  const [showModal, setShowModal] = useState(false)

  // Seeding
  const [seedNeeded, setSeedNeeded] = useState(false)
  const [seedStatus, setSeedStatus] = useState('idle')
  const [seedError, setSeedError] = useState(null)

  /* ── Persist to localStorage ── */
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)) } catch {}
  }, [state])

  /* ── Load from Firestore on mount ── */
  useEffect(() => {
    setSyncStatus('loading')
    loadSessionState()
      .then(remote => {
        if (remote) {
          setState({ ...remote, groups: ensureIds(remote.groups) })
          setSyncStatus('saved')
        } else {
          setSyncStatus('idle')
        }
      })
      .catch(() => setSyncStatus('idle'))

    hasSessionData().then(exists => setSeedNeeded(!exists))
  }, [])

  /* ── Debounced Firestore sync ── */
  const scheduleSync = useCallback(nextState => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setSyncStatus('saving')
    debounceRef.current = setTimeout(async () => {
      try {
        await saveSessionState(nextState)
        setSyncStatus('saved')
      } catch {
        setSyncStatus('error')
      }
    }, 800)
  }, [])

  function update(patch) {
    setState(prev => {
      const next = { ...prev, ...patch }
      scheduleSync(next)
      return next
    })
  }

  function updateGroups(groups) {
    setState(prev => {
      const next = { ...prev, groups }
      scheduleSync(next)
      return next
    })
  }

  function toggleDone(idx) {
    updateGroups(state.groups.map((g, i) => i === idx ? { ...g, done: !g.done } : g))
  }

  function renameGroup(idx, name) {
    updateGroups(state.groups.map((g, i) => i === idx ? { ...g, name } : g))
  }

  function deleteGroup(idx) {
    updateGroups(state.groups.filter((_, i) => i !== idx))
  }

  function addGroup(group) {
    updateGroups([...state.groups, group])
  }

  function resetToDefault() {
    setState(DEFAULT_STATE)
    scheduleSync(DEFAULT_STATE)
  }

  async function handleSeed() {
    setSeedStatus('seeding')
    setSeedError(null)
    try {
      await seedFromGas(APP_CONFIG.photosApi)
      setSeedStatus('done')
      setSeedNeeded(false)
    } catch (err) {
      setSeedError(err?.message || "Erreur lors de l'import.")
      setSeedStatus('error')
    }
  }

  const doneCount = state.groups.filter(g => g.done).length
  const progress  = state.groups.length > 0 ? (doneCount / state.groups.length) * 100 : 0

  return (
    <div className="space-y-5 pb-8">

      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-stone-900">Admin Photos</h1>
          <p className="text-sm text-stone-500">Gestion des groupes & retards</p>
        </div>
        <SyncBadge status={syncStatus} />
      </div>

      {/* ─── Seeding banner ─── */}
      <AnimatePresence>
        {seedNeeded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Database size={16} className="text-blue-500 shrink-0" />
                <p className="text-sm font-semibold text-blue-800">Données créneaux non initialisées</p>
              </div>
              <p className="text-xs text-blue-600">
                Importe les personnes, groupes et créneaux depuis Google Sheets.
              </p>
              <button
                onClick={handleSeed}
                disabled={seedStatus === 'seeding'}
                className="flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                {seedStatus === 'seeding'
                  ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  : <Database size={14} />}
                {seedStatus === 'seeding' ? 'Import en cours…' : 'Importer depuis Google Sheets'}
              </button>
              {seedStatus === 'done'  && <p className="text-xs font-semibold text-green-600">✓ Import réussi !</p>}
              {seedStatus === 'error' && <p className="text-xs text-red-500">{seedError}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Progress ─── */}
      <div className="rounded-2xl border border-stone-100 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-stone-400">Progression</span>
          <span className="text-sm font-bold text-stone-700">{doneCount} / {state.groups.length}</span>
        </div>
        <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-rose-400 to-rose-500"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* ─── Settings ─── */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">Paramètres</p>

        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
            <Camera size={16} />
          </span>
          <div className="flex-1">
            <label className="text-xs font-semibold text-stone-600">Début des photos</label>
            <input
              type="datetime-local"
              value={state.photoStart}
              onChange={e => update({ photoStart: e.target.value })}
              className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-800 outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
            />
          </div>
        </div>

        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
            <Users size={16} />
          </span>
          <div className="flex-1">
            <label className="text-xs font-semibold text-stone-600">Intervalle entre groupes (min)</label>
            <input
              type="number" min={1} max={60}
              value={state.groupIntervalMinutes}
              onChange={e => update({ groupIntervalMinutes: Number(e.target.value) })}
              className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-800 outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
            />
          </div>
        </div>

        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
            <Clock size={16} />
          </span>
          <div className="flex-1">
            <label className="text-xs font-semibold text-stone-600">Retard global (min)</label>
            <div className="mt-1 flex items-center gap-3">
              <input
                type="range" min={-30} max={90} step={5}
                value={state.delayMinutes}
                onChange={e => update({ delayMinutes: Number(e.target.value) })}
                className="flex-1 accent-rose-500"
              />
              <span className="w-14 rounded-xl border border-stone-200 bg-stone-50 px-2 py-1 text-center text-sm font-bold text-stone-700">
                {state.delayMinutes > 0 ? `+${state.delayMinutes}` : state.delayMinutes} min
              </span>
            </div>
            {state.delayMinutes !== 0 && (
              <p className="mt-1 text-xs text-amber-600">
                {state.delayMinutes > 0
                  ? `⚠️ Programme décalé de ${state.delayMinutes} min`
                  : `⏩ Programme avancé de ${Math.abs(state.delayMinutes)} min`}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ─── Groups ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">
            Groupes ({state.groups.length})
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 rounded-full bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-rose-600 active:scale-95 transition-all"
          >
            <Plus size={12} /> Ajouter
          </button>
        </div>

        <Reorder.Group axis="y" values={state.groups} onReorder={updateGroups} className="space-y-2">
          <AnimatePresence initial={false}>
            {state.groups.map((group, idx) => (
              <GroupRow
                key={group.id}
                group={group}
                index={idx}
                eta={computeGroupEta(state.photoStart, state.delayMinutes, state.groupIntervalMinutes, idx)}
                onToggleDone={() => toggleDone(idx)}
                onRename={name => renameGroup(idx, name)}
                onDelete={() => deleteGroup(idx)}
              />
            ))}
          </AnimatePresence>
        </Reorder.Group>

        {state.groups.length === 0 && (
          <div className="rounded-2xl border border-dashed border-stone-200 py-10 text-center">
            <p className="text-sm text-stone-400">Aucun groupe —</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-1 text-sm font-semibold text-rose-500 hover:text-rose-600"
            >
              Ajouter le premier groupe
            </button>
          </div>
        )}
      </div>

      {/* ─── Reset ─── */}
      <button
        onClick={resetToDefault}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white py-3.5 text-sm font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
      >
        <RotateCcw size={15} /> Reset
      </button>

      {/* ─── Summary ─── */}
      {state.groups.length > 0 && (
        <div className="rounded-2xl border border-stone-100 bg-white overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-stone-100">
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">Récapitulatif ETAs</p>
          </div>
          <div className="divide-y divide-stone-50">
            {state.groups.map((group, idx) => (
              <div key={group.id} className="flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-400">#{idx + 1}</span>
                  <span className={`text-sm font-medium ${group.done ? 'line-through text-stone-300' : 'text-stone-700'}`}>
                    {group.name}
                  </span>
                  {group.done && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-600">FAIT</span>
                  )}
                </div>
                <span className={`text-sm font-bold tabular-nums ${group.done ? 'text-stone-300' : 'text-stone-600'}`}>
                  {computeGroupEta(state.photoStart, state.delayMinutes, state.groupIntervalMinutes, idx)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── AddGroupModal ─── */}
      <AnimatePresence>
        {showModal && (
          <AddGroupModal
            groupsCount={state.groups.length}
            onAdd={addGroup}
            onClose={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
