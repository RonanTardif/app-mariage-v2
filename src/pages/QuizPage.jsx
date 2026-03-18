import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageIntro } from '../components/shared/PageIntro'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useAsyncData } from '../hooks/useAsyncData'
import { getQuiz } from '../services/dataService'
import { submitScore } from '../services/leaderboardService'
import { LoadingState, ErrorState } from '../components/shared/LoadingState'

const FEEDBACK_DELAY = 1100
const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E']

function tier(score, total) {
  const pct = score / total
  if (pct >= 0.9) return { label: 'Meilleur ami des mariés', emoji: '🏆', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' }
  if (pct >= 0.7) return { label: 'Expert Ronan & Lorie',   emoji: '🎉', color: 'text-sage-700',  bg: 'bg-sage-50',  border: 'border-sage-200'  }
  if (pct >= 0.5) return { label: 'Bonne connaissance',      emoji: '💐', color: 'text-rose-700',  bg: 'bg-rose-50',  border: 'border-rose-200'  }
  return           { label: 'Encore un effort !',            emoji: '😄', color: 'text-stone-600', bg: 'bg-stone-50', border: 'border-stone-200' }
}

// ─── Écran question ───────────────────────────────────────────────────────────

function QuestionScreen({ q, index, total, onAnswer }) {
  const [picked, setPicked] = useState(null)
  const firstBtnRef = useRef(null)

  // Focus sur le premier bouton à l'apparition de chaque question
  useEffect(() => {
    const t = setTimeout(() => firstBtnRef.current?.focus(), 50)
    return () => clearTimeout(t)
  }, [])

  function choose(v) {
    if (picked !== null) return
    setPicked(v)
    if ('vibrate' in navigator) {
      navigator.vibrate(v === q.answer_index ? [10] : [10, 60, 10])
    }
    setTimeout(() => onAnswer(v), FEEDBACK_DELAY)
  }

  const showFeedback = picked !== null

  return (
    <div className="space-y-5">
      {/* Barre de progression */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-rose-500">Question {index + 1}</span>
          <span className="text-xs text-stone-400">sur {total}</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-stone-100 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-rose-400 to-rose-500"
            initial={false}
            animate={{ width: `${((index + 1) / total) * 100}%` }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>

      {/* Question */}
      <p className="font-semibold text-foreground leading-snug">{q.question}</p>

      {/* Options */}
      <div className="space-y-2.5">
        {q.options.map((opt, i) => {
          const isCorrect = i === q.answer_index
          const isChosen  = i === picked

          let bg = 'bg-white border-border text-foreground hover:bg-stone-50'
          if (showFeedback) {
            if (isCorrect)            bg = 'bg-sage-50 border-sage-400 text-sage-800'
            else if (isChosen)        bg = 'bg-red-50 border-red-300 text-red-700'
            else                      bg = 'bg-white border-border text-stone-300 opacity-50'
          }

          return (
            <motion.button
              key={i}
              ref={i === 0 ? firstBtnRef : undefined}
              onClick={() => choose(i)}
              disabled={showFeedback}
              animate={showFeedback && isCorrect ? { scale: [1, 1.02, 1] } : {}}
              transition={{ duration: 0.3 }}
              aria-label={`Option ${OPTION_LETTERS[i]} : ${opt}`}
              aria-pressed={isChosen}
              className={`w-full flex items-center gap-3 rounded-2xl border px-4 py-3 min-h-[52px] text-left text-sm font-medium leading-snug transition-all duration-200 disabled:pointer-events-none ${bg}`}
            >
              {/* Lettre indicatrice */}
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors
                ${showFeedback && isCorrect ? 'bg-sage-400 text-white' : showFeedback && isChosen ? 'bg-red-400 text-white' : 'bg-stone-100 text-stone-500'}`}>
                {OPTION_LETTERS[i]}
              </span>

              <span className="flex-1">{opt}</span>

              {/* Icône feedback */}
              {showFeedback && isCorrect && <CheckCircle size={16} className="shrink-0 text-sage-500" />}
              {showFeedback && isChosen && !isCorrect && <XCircle size={16} className="shrink-0 text-red-400" />}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Écran résultat ───────────────────────────────────────────────────────────

function ResultScreen({ score, total, questions, answers, onScoreSubmitted }) {
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  const t = tier(score, total)

  async function handleSubmit() {
    if (submitting || submitted) return
    setSubmitting(true)
    setSubmitError(null)
    const now = new Date()
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    try {
      await submitScore({
        player: name.trim() || 'Anonyme',
        score,
        total,
        answered: answers.length,
        time,
        created_at: now.toISOString(),
      })
      setSubmitted(true)
      onScoreSubmitted?.()
    } catch (err) {
      setSubmitError(err?.message || "Erreur lors de l'envoi.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Score héro */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 16, delay: 0.05 }}
        className="flex flex-col items-center py-6"
      >
        <p className="text-8xl font-black tabular-nums text-rose-500 leading-none">{score}</p>
        <p className="text-2xl font-bold text-stone-300 mt-1">/ {total}</p>
        <p className="mt-1 text-sm text-stone-400 tabular-nums">{Math.round((score / total) * 100)} %</p>
      </motion.div>

      {/* Badge tier */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className={`rounded-2xl border p-4 text-center ${t.bg} ${t.border}`}
      >
        <p className="text-3xl">{t.emoji}</p>
        <p className={`mt-1.5 font-bold ${t.color}`}>{t.label}</p>
      </motion.div>

      {/* Récap correct / incorrect */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex items-center justify-center gap-6 text-sm"
      >
        <div className="flex items-center gap-1.5 text-sage-700">
          <CheckCircle size={15} />
          <span className="font-semibold">{score} correctes</span>
        </div>
        <div className="flex items-center gap-1.5 text-red-400">
          <XCircle size={15} />
          <span className="font-semibold">{total - score} incorrectes</span>
        </div>
      </motion.div>

      {/* Séparateur */}
      <div className="border-t border-border" />

      {/* Soumission */}
      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            key="confirmed"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-sage-200 bg-sage-50 p-6 text-center space-y-3"
          >
            <motion.p
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
              className="text-4xl"
            >
              🎊
            </motion.p>
            <p className="font-bold text-sage-700">Score envoyé !</p>
            <p className="text-sm text-stone-600">
              <strong>{name || 'Anonyme'}</strong> apparaît maintenant sur le classement.
            </p>
            <Link to="/leaderboard">
              <Button className="mt-1 w-full gap-2">
                <Trophy size={16} />
                Voir le classement
              </Button>
            </Link>
          </motion.div>
        ) : (
          <motion.div key="form" className="space-y-3">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-stone-700">
                Ton prénom pour le classement
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex : Clément, Marie…"
                maxLength={30}
                autoComplete="given-name"
                autoCapitalize="words"
                disabled={submitting}
                className="text-base"
              />
              <p className="text-xs text-stone-400">Laisse vide pour rester anonyme.</p>
            </div>

            <Button className="w-full gap-2" onClick={handleSubmit} disabled={submitting}>
              {submitting && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              {submitting ? 'Envoi…' : 'Envoyer mon score'}
            </Button>

            {submitError && (
              <p className="text-sm text-red-600">{submitError}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Persistence localStorage ─────────────────────────────────────────────────

const LS_PROGRESS = 'mariage_quiz_progress_v1'

function loadProgress() {
  try { return JSON.parse(localStorage.getItem(LS_PROGRESS) || 'null') } catch { return null }
}
function saveProgress(state) {
  try { localStorage.setItem(LS_PROGRESS, JSON.stringify(state)) } catch {}
}
export function clearQuizProgress() {
  try { localStorage.removeItem(LS_PROGRESS) } catch {}
}

// ─── Page principale ──────────────────────────────────────────────────────────

export function QuizPage() {
  const { data, loading, error } = useAsyncData(getQuiz, [])
  const questions = data?.questions ?? []

  const saved = loadProgress()
  const [index, setIndex] = useState(saved?.index ?? 0)
  const [answers, setAnswers] = useState(saved?.answers ?? [])
  const [done, setDone] = useState(saved?.done ?? false)

  // Sauvegarde automatique à chaque changement
  useEffect(() => {
    if (!loading && questions.length > 0) {
      saveProgress({ index, answers, done })
    }
  }, [index, answers, done, loading, questions.length])

  if (loading) return <LoadingState message="Chargement du quiz…" />
  if (error)   return <ErrorState  message="Impossible de charger le quiz. Réessaie plus tard." />

  const total = questions.length
  const score = answers.filter((a, i) => a === questions[i]?.answer_index).length

  function handleAnswer(v) {
    const next = [...answers]
    next[index] = v
    setAnswers(next)
    if (index < total - 1) setIndex(index + 1)
    else setDone(true)
  }

  return (
    <>
      <PageIntro
        eyebrow="Ronan & Lorie"
        title="Les connaissez-vous vraiment ?"
        description={`${total} questions sur leur histoire. Jouez en équipe, battez-vous sur le leaderboard.`}
      />

      <AnimatePresence mode="wait">
        {!done ? (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <QuestionScreen
              q={questions[index]}
              index={index}
              total={total}
              onAnswer={handleAnswer}
            />
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <ResultScreen
              score={score}
              total={total}
              questions={questions}
              answers={answers}
              onScoreSubmitted={clearQuizProgress}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
