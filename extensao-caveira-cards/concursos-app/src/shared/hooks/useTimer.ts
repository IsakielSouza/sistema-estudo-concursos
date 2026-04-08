import { useSessionStore } from '@/shared/stores/session.store'
import { useCallback, useEffect, useRef, useState } from 'react'

interface UseTimerReturn {
  elapsedSeconds: number
  remainingSeconds: number
  isRunning: boolean
  play: () => void
  pause: () => void
  reset: () => void
}

/**
 * Wall-clock timer: computes elapsed as Date.now() - start - paused_total.
 * Accurate even when app is in background or device is locked.
 */
export function useTimer(allocatedSeconds: number): UseTimerReturn {
  const { sessionStartTimestamp, pausedAt, pausedTotalMs, isRunning, pause, resume } =
    useSessionStore()

  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const computeElapsed = useCallback((): number => {
    if (!sessionStartTimestamp) return 0
    const now = Date.now()
    const activePausedMs = !isRunning && pausedAt ? now - pausedAt : 0
    const totalElapsedMs = now - sessionStartTimestamp - pausedTotalMs - activePausedMs
    return Math.max(0, Math.floor(totalElapsedMs / 1000))
  }, [sessionStartTimestamp, pausedTotalMs, pausedAt, isRunning])

  useEffect(() => {
    if (isRunning) {
      tickRef.current = setInterval(() => {
        setElapsedSeconds(computeElapsed())
      }, 500)
    } else {
      if (tickRef.current) clearInterval(tickRef.current)
      setElapsedSeconds(computeElapsed())
    }

    return () => {
      if (tickRef.current) clearInterval(tickRef.current)
    }
  }, [isRunning, computeElapsed])

  const remainingSeconds = Math.max(0, allocatedSeconds - elapsedSeconds)

  return {
    elapsedSeconds,
    remainingSeconds,
    isRunning,
    play: resume,
    pause,
    reset: () => setElapsedSeconds(0),
  }
}
