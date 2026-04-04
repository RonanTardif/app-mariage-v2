/**
 * Calcule l'heure d'affichage d'un créneau photo.
 * @param {string} baseEta  - Heure de base planifiée, format "HH:MM"
 * @param {number} delayMinutes - Retard global en minutes (peut être négatif)
 * @returns {string} Heure calculée, format "HH:MM", ou "—" si invalide
 */
export function computeEta(baseEta, delayMinutes = 0) {
  const m = String(baseEta || '').match(/(\d{1,2}):(\d{2})/)
  if (!m) return '—'
  try {
    const base = new Date()
    base.setHours(Number(m[1]), Number(m[2]), 0, 0)
    base.setMinutes(base.getMinutes() + Number(delayMinutes || 0))
    base.setMinutes(Math.round(base.getMinutes() / 5) * 5)
    return base.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return '—'
  }
}

/**
 * Calcule l'ETA d'un groupe dans la séquence admin.
 * @param {string} photoStart         - datetime-local string, ex: "2026-06-13T16:30"
 * @param {number} delayMinutes       - retard global
 * @param {number} groupIntervalMinutes - intervalle entre groupes
 * @param {number} index              - position du groupe (0-based)
 */
export function computeGroupEta(photoStart, delayMinutes, groupIntervalMinutes, index) {
  if (!photoStart) return '—'
  try {
    const base = new Date(photoStart)
    base.setMinutes(base.getMinutes() + Number(delayMinutes || 0) + index * Number(groupIntervalMinutes || 0))
    base.setMinutes(Math.round(base.getMinutes() / 5) * 5)
    return base.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return '—'
  }
}
