import { useState } from 'react'
import { Heart, MapPin, X } from 'lucide-react'
import { PageIntro } from '../components/shared/PageIntro'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'

const LEETCHI_URL = 'https://www.leetchi.com/fr/c/mariage-lorie-ronan-3638696?utm_source=copylink&utm_medium=social_sharing'
const LISTE_URL = 'https://www.milleetunelistes.fr/liste/mariage-ronan-lorie'

export function CadeauxPage() {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <PageIntro
        eyebrow="Cadeaux"
        title="Votre présence est déjà le plus beau cadeau"
        description="Merci d'être là avec nous pour ce week-end."
      />

      {/* Urne */}
      <Card>
        <CardContent>
          <MapPin className="text-sage-700" size={18} />
          <p className="mt-2 font-semibold">Une urne est à votre disposition</p>
          <p className="mt-1 text-sm text-stone-600 leading-relaxed">
            Si vous souhaitez nous offrir un petit quelque chose, une urne se trouve dans la salle de réception. Aucune obligation — votre présence compte plus que tout.
          </p>
        </CardContent>
      </Card>

      {/* Voyage de noces */}
      <Card className="mt-3">
        <CardContent>
          <Heart className="text-rose-600" size={18} />
          <p className="mt-2 font-semibold">Contribuer à notre voyage de noces</p>
          <p className="mt-1 text-sm text-stone-600 leading-relaxed">
            Si vous préférez participer en ligne, nous avons prévu de quoi vous faciliter la vie 🌍
          </p>
          <Button
            onClick={() => setShowModal(true)}
            className="mt-4 w-full bg-rose-500 hover:bg-rose-700"
          >
            Contribuer au voyage de noces →
          </Button>
        </CardContent>
      </Card>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl mb-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-lg">Comment participer ? 💛</p>
              <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-stone-600">
                <X size={20} />
              </button>
            </div>

            {/* Intro */}
            <p className="text-sm text-stone-500 leading-relaxed mb-5">
              Plusieurs d'entre vous nous ont signalé des soucis avec notre liste en ligne — désolés pour la gêne ! La cagnotte est la solution la plus simple et rapide.
            </p>

            {/* Option 1 — Leetchi (primaire) */}
            <a href={LEETCHI_URL} target="_blank" rel="noreferrer" className="block">
              <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 hover:bg-rose-100 transition-colors active:scale-[0.99]">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-bold text-stone-800 text-sm">🌍 La cagnotte</p>
                  <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">Recommandé</span>
                </div>
                <div className="mt-3 w-full rounded-xl bg-rose-500 py-2.5 text-center text-sm font-semibold text-white">
                  Accéder à la cagnotte →
                </div>
              </div>
            </a>

            {/* Option 2 — Liste (secondaire) */}
            <a
              href={LISTE_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-3 block w-full rounded-xl border border-stone-200 py-2.5 text-center text-sm text-stone-500 hover:bg-stone-50 transition-colors"
            >
              Accéder à la liste de mariage
            </a>
          </div>
        </div>
      )}
    </>
  )
}
