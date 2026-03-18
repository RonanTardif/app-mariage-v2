import { useState, useEffect, useRef } from 'react'

/**
 * Hook générique pour les subscriptions Firestore onSnapshot.
 * Interface identique à useAsyncData : { data, loading, error }
 *
 * @param {(onData: fn, onError: fn) => unsubscribeFn} subscribeFn
 * @param {*} defaultValue  valeur initiale de data
 */
export function useFirestoreSnapshot(subscribeFn, defaultValue = null) {
  const [data, setData] = useState(defaultValue)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const subscribeFnRef = useRef(subscribeFn)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)

    const unsub = subscribeFnRef.current(
      (value) => {
        if (mounted) {
          setData(value)
          setLoading(false)
        }
      },
      (err) => {
        if (mounted) {
          setError(err)
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      unsub?.()
    }
  }, [])

  return { data, loading, error }
}
