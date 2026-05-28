import { useMemo, Fragment } from 'react'
import { Check } from 'lucide-react'
import { computeGroupEta } from '../../utils/etaUtils'

const COLS = 4

export function PhotoQueue({ allGroups, myGroupIds, photoStart, delayMinutes, groupIntervalMinutes }) {
  const enriched = useMemo(() => {
    if (!allGroups?.length) return []
    const nowIndex = allGroups.findIndex(g => !g.done)
    return allGroups.map((group, index) => ({
      ...group,
      _index: index,
      _status: group.done ? 'DONE' : index === nowIndex ? 'NOW' : 'UPCOMING',
      _isMine: myGroupIds.has(group.id),
      _eta: computeGroupEta(photoStart, delayMinutes, groupIntervalMinutes, index),
    }))
  }, [allGroups, myGroupIds, photoStart, delayMinutes, groupIntervalMinutes])

  const rows = useMemo(() => {
    const result = []
    for (let i = 0; i < enriched.length; i += COLS) {
      result.push(enriched.slice(i, i + COLS))
    }
    return result
  }, [enriched])

  if (!enriched.length) return null

  // Center of first/last column = 1/(2*COLS) = 12.5% for COLS=4
  const connectorOffset = `${100 / (COLS * 2)}%`

  return (
    <div className="mt-4 rounded-2xl border border-border bg-card p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-4">
        File d'attente · {allGroups.length} groupes
      </p>

      <div>
        {rows.map((row, rowIndex) => {
          const isEven = rowIndex % 2 === 0
          const isLastRow = rowIndex === rows.length - 1
          const reversedRow = isEven ? row : [...row].reverse()
          const padding = COLS - reversedRow.length

          // For odd partial rows: pad LEFT so nodes stay right-aligned (path enters from right)
          const displayRow = isEven
            ? reversedRow
            : [
                ...Array(padding).fill(null).map((_, i) => ({ id: `__pad_${rowIndex}_${i}`, _empty: true })),
                ...reversedRow,
              ]

          return (
            <Fragment key={rowIndex}>
              {/* Row of nodes */}
              <div className="grid grid-cols-4">
                {displayRow.map((group, colIndex) => {
                  if (group?._empty) {
                    return <div key={group.id} />
                  }

                  const isDone = group._status === 'DONE'
                  const isNow = group._status === 'NOW'
                  const isMine = group._isMine

                  const hasPrev = colIndex > 0 && !displayRow[colIndex - 1]?._empty
                  const hasNext = colIndex < displayRow.length - 1 && !displayRow[colIndex + 1]?._empty

                  let circleClass = 'bg-stone-100 text-stone-400'
                  if (isDone) {
                    circleClass = isMine ? 'bg-green-100 text-green-600' : 'bg-stone-200 text-stone-400'
                  } else if (isNow) {
                    circleClass = isMine
                      ? 'bg-amber-400 text-white ring-4 ring-rose-300 ring-offset-1'
                      : 'bg-amber-400 text-white'
                  } else if (isMine) {
                    circleClass = 'bg-rose-100 text-rose-600 ring-2 ring-rose-300 ring-offset-1'
                  }

                  return (
                    <div key={group.id} className="relative flex flex-col items-center pb-2">
                      {/* Connecting half-lines (z-0, below circle) */}
                      {hasPrev && (
                        <div className="absolute top-5 left-0 w-1/2 h-0.5 bg-stone-200" />
                      )}
                      {hasNext && (
                        <div className="absolute top-5 right-0 w-1/2 h-0.5 bg-stone-200" />
                      )}

                      {/* Circle node */}
                      <div className={`relative z-10 h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${circleClass}`}>
                        {isNow && (
                          <span className="absolute inset-0 rounded-full animate-ping bg-amber-300 opacity-40" />
                        )}
                        <span className="relative z-10 text-xs font-bold">
                          {isDone ? <Check size={14} strokeWidth={3} /> : group._index + 1}
                        </span>
                      </div>

                      {/* ETA */}
                      <span className={`text-[10px] tabular-nums font-medium mt-1 leading-none ${
                        isDone ? 'text-stone-300' :
                        isNow  ? 'text-amber-600' :
                        isMine ? 'text-rose-500'  :
                                 'text-stone-400'
                      }`}>
                        {group._eta || '--:--'}
                      </span>

                      {/* Group name — only for mine */}
                      {isMine && (
                        <span className={`text-[9px] font-semibold text-center leading-tight max-w-[56px] line-clamp-2 mt-0.5 ${
                          isDone ? 'text-green-600' :
                          isNow  ? 'text-amber-700' :
                                   'text-rose-500'
                        }`}>
                          {group.name}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Vertical turn connector between rows */}
              {!isLastRow && (
                <div className="relative h-6">
                  <div
                    className="absolute inset-y-0 w-0.5 bg-stone-200"
                    style={isEven ? { right: connectorOffset } : { left: connectorOffset }}
                  />
                </div>
              )}
            </Fragment>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-stone-100 flex flex-wrap gap-x-4 gap-y-1.5">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-3 w-3 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-60" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-400" />
          </span>
          <span className="text-[10px] text-stone-500">En cours</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-rose-100 ring-1 ring-rose-300 shrink-0" />
          <span className="text-[10px] text-stone-500">Ton groupe</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-stone-200 shrink-0" />
          <span className="text-[10px] text-stone-500">Validé</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-stone-100 shrink-0" />
          <span className="text-[10px] text-stone-500">À venir</span>
        </div>
      </div>
    </div>
  )
}
