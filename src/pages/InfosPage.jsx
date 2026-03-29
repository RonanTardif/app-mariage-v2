import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, ShowerHead, MessageCircleMore, Settings, X, Download, Share2, Copy, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { PageIntro } from '../components/shared/PageIntro'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { APP_CONFIG } from '../utils/constants'

/* ─── Helpers PWA ─────────────────────────────────────────────── */
function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}
function isInStandaloneMode() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    window.navigator.standalone === true
  )
}

/* ─── Infos statiques ─────────────────────────────────────────── */
const infos = [
  { title: 'Kit de survie',      text: 'Un kit pratique vous attend directement dans votre chambre.', icon: Sparkles },
  { title: 'Essentiels sur place', text: 'Toilettes et salles de bain équipées pour tout le week-end.', icon: ShowerHead },
]

/* ─── Page ────────────────────────────────────────────────────── */
export function InfosPage() {
  const navigate = useNavigate()

  // Admin modal
  const [showPwd, setShowPwd] = useState(false)
  const [pwd, setPwd] = useState('')
  const [error, setError] = useState(false)
  const inputRef = useRef(null)

  // PWA install
  const [isInstalled, setIsInstalled] = useState(false)
  const [iosDevice, setIosDevice] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showIosModal, setShowIosModal] = useState(false)

  // Share / copy
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (isInStandaloneMode()) { setIsInstalled(true); return }
    setIosDevice(isIos())
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const showInstall = !isInstalled && (iosDevice || deferredPrompt)

  async function handleInstall() {
    if (iosDevice) { setShowIosModal(true); return }
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setIsInstalled(true)
    setDeferredPrompt(null)
  }

  async function handleShare() {
    const url = window.location.origin
    if (navigator.share) {
      await navigator.share({ title: 'Mariage Ronan & Lorie', url })
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function openModal() {
    setPwd(''); setError(false); setShowPwd(true)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (pwd === 'admin') { setShowPwd(false); navigate('/admin') }
    else { setError(true); setPwd(''); setTimeout(() => inputRef.current?.focus(), 50) }
  }

  return (
    <>
      <PageIntro eyebrow="Infos pratiques" title="Les essentiels" description="Tout ce qu'il faut savoir pour le week-end." />

      <div className="space-y-3">

        {/* Infos statiques */}
        {infos.map((item) => (
          <Card key={item.title}>
            <CardContent>
              <item.icon className="text-sage-700" size={18} />
              <p className="mt-2 font-semibold">{item.title}</p>
              <p className="text-sm text-stone-600">{item.text}</p>
            </CardContent>
          </Card>
        ))}

        {/* WhatsApp */}
        <Card>
          <CardContent>
            <MessageCircleMore className="text-sage-700" size={18} />
            <p className="mt-2 font-semibold">{"Besoin d'aide ?"}</p>
            <p className="text-sm text-stone-600">{"L'équipe est disponible tout le week-end."}</p>
            <a href={APP_CONFIG.whatsappLink} target="_blank" rel="noreferrer">
              <Button className="mt-3 w-full">Ouvrir WhatsApp</Button>
            </a>
          </CardContent>
        </Card>

        {/* ── Installer l'app ── */}
        <AnimatePresence>
          {showInstall && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden rounded-3xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white"
            >
              <div className="p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm border border-rose-100">
                    <img
                      src={import.meta.env.BASE_URL + 'icons/icon-192.png'}
                      alt="App icon"
                      className="h-10 w-10 rounded-xl"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-stone-900">Installer l'app</p>
                    <p className="text-sm text-stone-500 mt-0.5">Accès rapide depuis l'écran d'accueil</p>
                  </div>
                </div>
                <button
                  onClick={handleInstall}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-500 py-3 text-sm font-semibold text-white hover:bg-rose-600 transition-colors active:scale-[0.98]"
                >
                  <Download size={16} />
                  Installer
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Partager l'app ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="overflow-hidden rounded-3xl border border-stone-200 bg-white"
        >
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-bold text-stone-900">Partager l'app</p>
                <p className="text-sm text-stone-500 mt-0.5">Invitez vos proches à rejoindre</p>
              </div>
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors"
              >
                {copied ? <Check size={13} className="text-sage-600" /> : <Copy size={13} />}
                {copied ? 'Copié !' : 'Copier'}
              </button>
            </div>

            {/* QR code */}
            <div className="flex justify-center">
              <div className="rounded-2xl border border-stone-100 bg-white p-3 shadow-sm">
                <img
                  src={import.meta.env.BASE_URL + 'assets/qr-code.svg'}
                  alt="QR code de l'app"
                  className="h-44 w-44 block"
                />
              </div>
            </div>
            <p className="mt-3 text-center text-xs text-stone-400">Scannez pour accéder à l'application</p>
          </div>
        </motion.div>

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

      {/* ── Modal iOS install ── */}
      <AnimatePresence>
        {showIosModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowIosModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 32 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-4 bottom-8 z-50 rounded-3xl bg-white p-6 shadow-2xl sm:inset-x-auto sm:left-1/2 sm:w-80 sm:-translate-x-1/2"
            >
              <div className="flex items-center justify-between mb-5">
                <p className="font-bold text-stone-900 text-lg">Installer l'app</p>
                <button onClick={() => setShowIosModal(false)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-stone-100">
                  <X size={16} className="text-stone-400" />
                </button>
              </div>
              <ol className="space-y-4">
                {[
                  { n: 1, text: <>Appuie sur <strong>Partager</strong> <span className="text-base">⬆️</span> en bas de Safari</> },
                  { n: 2, text: <>Choisis <strong>« Sur l'écran d'accueil »</strong> 📲</> },
                  { n: 3, text: <>Appuie sur <strong>Ajouter</strong> ✅</> },
                ].map(({ n, text }) => (
                  <li key={n} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-600">{n}</span>
                    <span className="text-sm text-stone-700 leading-snug">{text}</span>
                  </li>
                ))}
              </ol>
              <button
                onClick={() => setShowIosModal(false)}
                className="mt-5 w-full rounded-2xl bg-stone-900 py-3 text-sm font-semibold text-white hover:bg-stone-800 transition-colors"
              >
                Compris !
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Modal admin ── */}
      <AnimatePresence>
        {showPwd && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowPwd(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.93, y: 16 }}
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
              <p className="font-bold text-stone-900">{"Espace organisation"}</p>
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
                <button type="submit" className="w-full rounded-2xl bg-stone-900 py-3 text-sm font-semibold text-white hover:bg-stone-800 transition-colors">
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
