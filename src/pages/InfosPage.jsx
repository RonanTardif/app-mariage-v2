import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Info, Sparkles, ShowerHead, MessageCircleMore, Settings, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { PageIntro } from '../components/shared/PageIntro'
import { Card, CardContent } from '../components/ui/card'

const infos = [
  { title: 'Kit de survie', text: 'Un kit pratique vous attend directement dans votre chambre.', icon: Sparkles },
  { title: 'Essentiels sur place', text: 'Toilettes et salles de bain équipées pour tout le week-end.', icon: ShowerHead },
  { title: "Besoin d'aide ?", text: 'La team orga reste joignable rapidement via WhatsApp.', icon: MessageCircleMore },
]

export function InfosPage() {
  const navigate = useNavigate()
  const [showPwd, setShowPwd] = useState(false)
  const [pwd, setPwd] = useState('')
  const [error, setError] = useState(false)
  const inputRef = useRef(null)

  function openModal() {
    setPwd('')
    setError(false)
    setShowPwd(true)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (pwd === 'admin') {
      setShowPwd(false)
      navigate('/admin')
    } else {
      setError(true)
      setPwd('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  return (
    <>
      <PageIntro eyebrow="Infos pratiques" title="Les essentiels sans charge mentale" description="Contenu synthétique, hiérarchisé, pensé pour les moments pressés." />
      <div className="space-y-3">
        {infos.map((item) => (
          <Card key={item.title}><CardContent><item.icon className="text-sage-700" size={18} /><p className="mt-2 font-semibold">{item.title}</p><p className="text-sm text-stone-600">{item.text}</p></CardContent></Card>
        ))}

        {/* Admin shortcut */}
        <button onClick={openModal} className="w-full text-left">
          <Card>
            <CardContent>
              <Settings className="text-stone-400" size={18} />
              <p className="mt-2 font-semibold text-stone-500">Paramètres</p>
              <p className="text-sm text-stone-400">{"Accès réservé à l'équipe orga."}</p>
            </CardContent>
          </Card>
        </button>
      </div>
      <div className="mt-3 inline-flex items-center gap-2 text-sm text-stone-500"><Info size={14} /> Lisible même pendant l'événement.</div>

      {/* Password modal */}
      <AnimatePresence>
        {showPwd && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowPwd(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 16 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed inset-x-4 bottom-8 z-50 rounded-3xl bg-white p-6 shadow-2xl sm:inset-x-auto sm:left-1/2 sm:w-80 sm:-translate-x-1/2"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100">
                  <Settings size={18} className="text-stone-500" />
                </div>
                <button onClick={() => setShowPwd(false)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-stone-100 transition-colors">
                  <X size={16} className="text-stone-400" />
                </button>
              </div>
              <p className="font-bold text-stone-900">{"Accès paramètres"}</p>
              <p className="mt-1 text-sm text-stone-500">{"Entrez le mot de passe orga."}</p>
              <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                <input
                  ref={inputRef}
                  type="password"
                  value={pwd}
                  onChange={(e) => { setPwd(e.target.value); setError(false) }}
                  placeholder="Mot de passe"
                  className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-colors ${
                    error ? 'border-red-300 bg-red-50 placeholder-red-300' : 'border-stone-200 bg-stone-50 focus:border-stone-400'
                  }`}
                />
                {error && <p className="text-xs text-red-500 font-medium">{"Mot de passe incorrect."}</p>}
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-stone-900 py-3 text-sm font-semibold text-white hover:bg-stone-800 transition-colors"
                >
                  {"Accéder"}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
