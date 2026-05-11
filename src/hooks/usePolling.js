import { useEffect, useRef, useCallback } from 'react'

/**
 * Polls a function every `intervalMs` until `shouldStop(result)` returns true
 * or the component unmounts.
 *
 * @param {Function} fetchFn      - async function that returns data
 * @param {Function} onData       - called with result on every poll
 * @param {Function} shouldStop   - return true to stop polling
 * @param {number}   intervalMs   - poll interval in ms (default 3000)
 * @param {boolean}  enabled      - set false to pause polling
 */
export function usePolling(fetchFn, onData, shouldStop, intervalMs = 3000, enabled = true) {
  const timerRef    = useRef(null)
  const mountedRef  = useRef(true)

  const poll = useCallback(async () => {
    if (!mountedRef.current) return
    try {
      const result = await fetchFn()
      if (!mountedRef.current) return
      onData(result)
      if (!shouldStop(result) && enabled) {
        timerRef.current = setTimeout(poll, intervalMs)
      }
    } catch (err) {
      // Keep polling even on network errors — don't abandon the user
      if (mountedRef.current && enabled) {
        timerRef.current = setTimeout(poll, intervalMs)
      }
    }
  }, [fetchFn, onData, shouldStop, intervalMs, enabled])

  useEffect(() => {
    mountedRef.current = true
    if (enabled) poll()
    return () => {
      mountedRef.current = false
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [poll, enabled])
}
