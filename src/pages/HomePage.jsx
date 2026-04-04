import { motion } from 'framer-motion'
import { CalendarDays, Camera, CircleHelp, MapPinned, BedDouble, Info, Images, Gift } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '../components/ui/card'

const links = [
  { to: '/programme',   title: 'Programme',      icon: CalendarDays,  desc: 'Le déroulé du week-end',           color: 'bg-rose-100 text-rose-700' },
  { to: '/plan',        title: 'Plan',           icon: MapPinned,     desc: 'Se repérer sur le domaine',         color: 'bg-sage-100 text-sage-700' },
  { to: '/chambres',    title: 'Ma chambre',     icon: BedDouble,     desc: 'Trouver mon hébergement',           color: 'bg-sand/60 text-stone-600' },
  { to: '/photos',      title: 'Photos de groupe', icon: Camera,     desc: 'Mon heure de passage',              color: 'bg-rose-100 text-rose-700' },
  { to: '/quiz',        title: 'Quiz',           icon: CircleHelp,    desc: 'À vous de jouer !',                color: 'bg-sage-100 text-sage-700' },
  { to: '/album',       title: 'Album',          icon: Images,        desc: 'Partagez vos photos',   color: 'bg-sand/60 text-stone-600' },
  { to: '/infos',       title: 'Infos',          icon: Info,          desc: 'Tout ce qu\'il faut savoir',        color: 'bg-rose-100 text-rose-700' },
  { to: '/cadeaux',     title: 'Cadeaux',        icon: Gift,          desc: 'Notre liste de mariage',            color: 'bg-sage-100 text-sage-700' },
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.3 } },
}

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
}

export function HomePage() {
  return (
    <>
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-3xl"
        style={{ aspectRatio: '4/3' }}
      >
        <img
          src={import.meta.env.BASE_URL + 'assets/photo-lorie-ronan.png'}
          alt="Ronan & Lorie"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/60">Le mariage de</p>
          <h1 className="mt-1 text-3xl font-bold leading-tight tracking-tight">Ronan & Lorie</h1>
          <p className="mt-1.5 text-sm text-white/75">Samedi 13 juin 2026 · Domaine de la Corbe</p>
        </div>
      </motion.div>

      {/* Grille de navigation */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="mt-4 grid grid-cols-2 gap-3"
      >
        {links.map((link) => {
          const cardContent = (
            <Card className="h-full hover:-translate-y-0.5 hover:shadow-premium transition-all duration-200">
              <CardContent className="p-4">
                <div className={`inline-flex rounded-xl p-2.5 ${link.color}`}>
                  <link.icon size={20} />
                </div>
                <p className="mt-3 font-semibold text-sm leading-snug">{link.title}</p>
                <p className="mt-0.5 text-xs text-stone-500 line-clamp-2">{link.desc}</p>
              </CardContent>
            </Card>
          )
          return (
            <motion.div key={link.href ?? link.to} variants={item}>
              {link.href ? (
                <a href={link.href} target="_blank" rel="noreferrer" className="block h-full active:scale-95 transition-transform duration-100">
                  {cardContent}
                </a>
              ) : (
                <Link to={link.to} className="block h-full active:scale-95 transition-transform duration-100">
                  {cardContent}
                </Link>
              )}
            </motion.div>
          )
        })}
      </motion.div>
    </>
  )
}
