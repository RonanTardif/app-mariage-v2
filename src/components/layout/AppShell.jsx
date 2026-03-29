import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '../../utils/cn'

const NAV_BASE_SAT = [
  { to: '/', label: 'Accueil' },
  { to: '/programme', label: 'Programme' },
  { to: '/plan', label: 'Plan' },
  { to: '/chambres', label: 'Chambres' },
]

const NAV_BASE_SUN = [
  { to: '/', label: 'Accueil' },
  { to: '/programme', label: 'Programme' },
  { to: '/plan', label: 'Plan' },
  { to: '/quiz', label: 'Quiz' },
]

const SUNDAY_MORNING = new Date('2026-03-30T08:00:00')

const PHOTOS_ITEM = { to: '/photos', label: 'Photos groupe', pulse: true }
const ALBUM_ITEM  = { to: '/album',  label: 'Album' }

function getNavItems() {
  const now = new Date()
  const base = now >= SUNDAY_MORNING ? NAV_BASE_SUN : NAV_BASE_SAT
  const min = now.getHours() * 60 + now.getMinutes()
  // Photos groupe (pulsing) avant 17h15, Album après 18h15
  const showPhotos = min < 17 * 60 + 15
  const showAlbum  = min >= 18 * 60 + 15
  if (showAlbum) return [...base, ALBUM_ITEM]
  if (showPhotos) return [...base, PHOTOS_ITEM]
  // Entre 17h15 et 18h15 : Photos groupe sans clignotement
  return [...base, { ...PHOTOS_ITEM, pulse: false }]
}

export function AppShell({ children }) {
  const [navItems, setNavItems] = useState(getNavItems)

  useEffect(() => {
    const id = setInterval(() => setNavItems(getNavItems()), 60_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="mx-auto min-h-screen max-w-5xl pb-28">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-rose-100 p-2 text-rose-700">
              <Heart size={16} />
            </div>
            <div>
              <p className="text-sm font-semibold">Ronan & Lorie</p>
              <p className="text-xs text-stone-500">13 juin 2026 · Domaine de la Corbe</p>
            </div>
          </div>
        </div>
      </header>
      <main className="px-4 py-5">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-white/95 px-2 py-3 backdrop-blur">
        <div className="mx-auto grid max-w-5xl grid-cols-5 gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex min-h-10 items-center justify-center rounded-xl px-1 py-2 text-center text-xs font-medium transition leading-tight',
                  isActive ? 'bg-sage-100 text-sage-700' : 'text-stone-500 hover:bg-stone-100',
                )
              }
            >
              {item.pulse ? (
                <span className="animate-pulse text-rose-500">{item.label}</span>
              ) : (
                item.label
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
