import { Gift } from 'lucide-react'
import { PageIntro } from '../components/shared/PageIntro'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'

const LISTE_URL = 'https://www.milleetunelistes.fr/liste/mariage-ronan-lorie'

export function CadeauxPage() {
  return (
    <>
      <PageIntro eyebrow="Liste de mariage" title="Nos envies" description="Un cadeau vous tente ? Retrouvez notre liste en ligne." />
      <Card>
        <CardContent>
          <Gift className="text-rose-600" />
          <p className="mt-2 text-sm text-stone-600">Chaque contribution compte — petite ou grande, elle nous touche.</p>
          <a href={LISTE_URL} target="_blank" rel="noreferrer">
            <Button className="mt-4 w-full">Voir la liste</Button>
          </a>
        </CardContent>
      </Card>
    </>
  )
}
