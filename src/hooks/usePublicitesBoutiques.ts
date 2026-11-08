import { useEffect, useState, useCallback } from 'react'
import { fetchPublicitesBoutiques, type PublicitesFilterParams } from '../services/api'
import type { PubliciteBoutique } from '../types'

export function usePublicitesBoutiques(params?: string | PublicitesFilterParams) {
  const [publicites, setPublicites] = useState<PubliciteBoutique[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const serialized = typeof params === 'string' ? params : JSON.stringify(params || {})

  const loadData = useCallback(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    fetchPublicitesBoutiques(params)
      .then((response) => {
        if (!cancelled) {
          setPublicites(response.data)
          setIsLoading(false)
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setPublicites([])
          setError(err.message)
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [serialized])

  useEffect(() => {
    return loadData()
  }, [loadData])

  return { publicites, isLoading, error, refetch: loadData }
}
