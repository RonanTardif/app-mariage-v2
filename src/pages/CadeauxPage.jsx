import { Heart, MapPin } from 'lucide-react'
import { PageIntro } from '../components/shared/PageIntro'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'

const LISTE_URL = 'https://www.milleetunelistes.fr/liste/mariage-ronan-lorie'

export function CadeauxPage() {
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
            Si vous préférez participer en ligne, nous avons une liste pour notre voyage de noces. Encore une fois, c'est entièrement libre et facultatif 🌍
          </p>
          <a href={LISTE_URL} target="_blank" rel="noreferrer">
            <Button variant="outline" className="mt-4 w-full">Voir la liste</Button>
          </a>
        </CardContent>
      </Card>
    </>
  )
}
