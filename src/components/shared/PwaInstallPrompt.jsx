import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

function IosShareIcon({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 292 387"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M 50 131 L 44 139 L 43 143 L 42 144 L 42 148 L 41 149 L 41 304 L 42 305 L 43 311 L 46 317 L 53 324 L 59 327 L 61 327 L 62 328 L 66 328 L 67 329 L 220 329 L 221 328 L 225 328 L 226 327 L 228 327 L 234 324 L 241 317 L 244 311 L 245 305 L 246 304 L 246 149 L 245 148 L 245 144 L 244 143 L 244 141 L 239 134 L 239 133 L 233 128 L 229 126 L 227 126 L 226 125 L 223 125 L 222 124 L 172 124 L 172 146 L 219 146 L 221 147 L 224 151 L 224 301 L 223 302 L 223 304 L 221 306 L 66 306 L 64 304 L 64 302 L 63 301 L 63 151 L 64 149 L 68 146 L 115 146 L 115 124 L 65 124 L 64 125 L 58 126 L 54 128 L 51 131 Z M 142 32 L 141 33 L 138 33 L 137 34 L 133 35 L 78 90 L 79 92 L 80 92 L 92 104 L 92 105 L 94 105 L 131 68 L 132 69 L 132 220 L 155 220 L 155 69 L 156 68 L 196 108 L 211 93 L 211 92 L 154 35 L 150 34 L 149 33 Z"
        fillRule="evenodd"
      />
    </svg>
  )
}

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

export function PwaInstallPrompt() {
  const [show, setShow] = useState(false)
  const [isIosDevice, setIsIosDevice] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showIosModal, setShowIosModal] = useState(false)

  useEffect(() => {
    if (isInStandaloneMode()) return

    const ios = isIos()
    setIsIosDevice(ios)

    if (ios) {
      setShow(true)
      return
    }

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShow(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!show) return null

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setShow(false)
    setDeferredPrompt(null)
  }

  return (
    <>
      {/* Bannière en bas */}
      <div className="fixed bottom-20 left-3 right-3 z-50 rounded-2xl border border-border bg-white/95 p-4 shadow-xl backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <img src={import.meta.env.BASE_URL + 'icons/icon-192.png'} alt="App icon" className="h-10 w-10 rounded-xl shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Installer l'app</p>
            <p className="text-xs text-stone-500 mt-0.5">Accès rapide depuis l'écran d'accueil ✨</p>
          </div>
          <button onClick={() => setShow(false)} className="shrink-0 text-stone-400 hover:text-stone-600">
            <X size={16} />
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          {isIosDevice ? (
            <button
              onClick={() => setShowIosModal(true)}
              className="flex-1 rounded-xl bg-rose-500 py-2 text-sm font-semibold text-white hover:bg-rose-600"
            >
              Installer
            </button>
          ) : (
            <button
              onClick={handleAndroidInstall}
              className="flex-1 rounded-xl bg-rose-500 py-2 text-sm font-semibold text-white hover:bg-rose-600"
            >
              Installer l'app
            </button>
          )}
          <button
            onClick={() => setShow(false)}
            className="rounded-xl border border-border px-4 py-2 text-sm text-stone-600 hover:bg-stone-50"
          >
            Plus tard
          </button>
        </div>
      </div>

      {/* Modal iOS avec instructions */}
      {showIosModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4" onClick={() => setShowIosModal(false)}>
          <div
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-lg">Installer l'app</p>
              <button onClick={() => setShowIosModal(false)} className="text-stone-400">
                <X size={20} />
              </button>
            </div>
            <ol className="space-y-3 text-sm text-stone-700">
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-600">1</span>
                <span>Appuie sur le bouton <strong>Partager</strong> <IosShareIcon className="inline-block h-[1.84em] w-[1.39em] align-middle mx-1" /> en bas de ton navigateur Safari</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-600">2</span>
                <span>Fais défiler et appuie sur <strong>« Sur l'écran d'accueil »</strong> 📲</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-600">3</span>
                <span>Appuie sur <strong>Ajouter</strong> en haut à droite ✅</span>
              </li>
            </ol>
            <button
              onClick={() => setShowIosModal(false)}
              className="mt-5 w-full rounded-xl bg-rose-500 py-3 text-sm font-semibold text-white"
            >
              Compris !
            </button>
          </div>
        </div>
      )}
    </>
  )
}
