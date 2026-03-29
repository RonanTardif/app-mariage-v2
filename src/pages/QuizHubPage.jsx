import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Trophy, RotateCcw, ChevronRight, CheckCircle, XCircle } from 'lucide-react'
import { tier, loadProgress, clearQuizProgress } from './QuizPage'

export function QuizHubPage() {
  const navigate = useNavigate()
  const saved = loadProgress()
  const done = saved?.done === true

  function handleRestart() {
    clearQuizProgress()
    navigate('/quiz/jouer')
  }

  /* ── Quiz déjà terminé ──────────────────────────────────────── */
  if (done) {
    const score = saved.score ?? 0
    const total = saved.total ?? 1
    const pct   = Math.round((score / total) * 100)
    const t     = tier(score, total)

    return (
      <div className="space-y-4">

        {/* Hero résultat */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-3xl bg-gradient-to-br from-rose-500 to-rose-400 p-8 text-center text-white shadow-lg"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-rose-200 mb-4">Ton résultat</p>
          <p className="text-[5rem] font-black tabular-nums leading-none">{score}</p>
          <p className="text-xl font-semibold text-rose-200 mt-1">/ {total} · {pct}%</p>

          <div className={`mx-auto mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2 ${t.bg} ${t.border} border`}>
            <span className="text-xl">{t.emoji}</span>
            <span className={`text-sm font-bold ${t.color}`}>{t.label}</span>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-3"
        >
          <div className="flex-1 flex items-center gap-2.5 rounded-2xl bg-sage-50 border border-sage-200 px-4 py-3">
            <CheckCircle size={16} className="text-sage-600 shrink-0" />
            <div>
              <p className="text-xs text-sage-600">Correctes</p>
              <p className="font-bold text-sage-700">{score}</p>
            </div>
          </div>
          <div className="flex-1 flex items-center gap-2.5 rounded-2xl bg-red-50 border border-red-100 px-4 py-3">
            <XCircle size={16} className="text-red-400 shrink-0" />
            <div>
              <p className="text-xs text-red-400">Incorrectes</p>
              <p className="font-bold text-red-500">{total - score}</p>
            </div>
          </div>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-2.5"
        >
          <Link to="/leaderboard" className="flex items-center justify-between w-full rounded-2xl bg-stone-900 px-5 py-4 text-white hover:bg-stone-800 transition-colors active:scale-[0.99]">
            <div className="flex items-center gap-3">
              <Trophy size={18} />
              <span className="font-semibold">Voir le classement</span>
            </div>
            <ChevronRight size={18} className="text-stone-400" />
          </Link>

          <button
            onClick={handleRestart}
            className="flex items-center justify-between w-full rounded-2xl border border-stone-200 bg-white px-5 py-4 text-stone-700 hover:bg-stone-50 transition-colors active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <RotateCcw size={18} />
              <span className="font-semibold">Recommencer le quiz</span>
            </div>
            <ChevronRight size={18} className="text-stone-300" />
          </button>
        </motion.div>
      </div>
    )
  }

  /* ── Quiz non commencé ──────────────────────────────────────── */
  return (
    <div className="space-y-4">

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-3xl bg-gradient-to-br from-rose-50 via-white to-amber-50 border border-rose-100 px-8 py-10 text-center"
      >
        <p className="text-6xl mb-5">🎯</p>
        <h1 className="text-2xl font-bold text-stone-900 leading-snug">
          Les connaissez-vous<br />vraiment ?
        </h1>
        <p className="mt-2 text-sm text-stone-500">
          Testez vos connaissances sur Ronan & Lorie.<br />Battez-vous sur le classement.
        </p>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-2.5"
      >
        <Link
          to="/quiz/jouer"
          className="flex items-center justify-between w-full rounded-2xl bg-rose-500 px-5 py-4 text-white hover:bg-rose-600 transition-colors active:scale-[0.99] shadow-sm"
        >
          <span className="font-semibold">Faire le quiz</span>
          <ChevronRight size={18} className="text-rose-300" />
        </Link>

        <Link
          to="/leaderboard"
          className="flex items-center justify-between w-full rounded-2xl border border-stone-200 bg-white px-5 py-4 text-stone-700 hover:bg-stone-50 transition-colors active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <Trophy size={18} className="text-stone-400" />
            <span className="font-semibold">Voir le classement</span>
          </div>
          <ChevronRight size={18} className="text-stone-300" />
        </Link>
      </motion.div>
    </div>
  )
}
