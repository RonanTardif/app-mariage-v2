import { MessageCircleHeart } from 'lucide-react'
import { PageIntro } from '../components/shared/PageIntro'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { APP_CONFIG } from '../utils/constants'

export function WhatsAppPage() {
  return (
    <>
      <PageIntro eyebrow="Support invités" title="Canal WhatsApp" description="Besoin d'aide ? L'équipe est disponible tout le week-end." />
      <Card>
        <CardContent>
          <MessageCircleHeart className="text-rose-600" />
          <p className="mt-2 text-sm text-stone-600">Transport, timing, imprévu — l'équipe répond vite.</p>
          <a href={APP_CONFIG.whatsappLink} target="_blank" rel="noreferrer">
            <Button className="mt-4 w-full">Ouvrir WhatsApp</Button>
          </a>
        </CardContent>
      </Card>
    </>
  )
}
