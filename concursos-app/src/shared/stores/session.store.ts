// src/shared/stores/session.store.ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface SessionStore {
  activePlannedSessionId: string | null
  activeCycleSubjectId: string | null
  sessionStartTimestamp: number | null
  pausedAt: number | null
  pausedTotalMs: number
  isRunning: boolean
  includeReview: boolean
  startSession: (plannedSessionId: string, cycleSubjectId: string) => void
  pause: () => void
  resume: () => void
  setIncludeReview: (value: boolean) => void
  /** Ends the session but preserves user preferences (includeReview). */
  clearSession: () => void
  /** Full reset: clears everything including preferences. Used after DB restore. */
  reset: () => void
}

const sessionDefaults = {
  activePlannedSessionId: null,
  activeCycleSubjectId: null,
  sessionStartTimestamp: null,
  pausedAt: null,
  pausedTotalMs: 0,
  isRunning: false,
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      ...sessionDefaults,
      includeReview: true,
      startSession: (activePlannedSessionId, activeCycleSubjectId) =>
        set({
          activePlannedSessionId,
          activeCycleSubjectId,
          sessionStartTimestamp: Date.now(),
          pausedAt: null,
          pausedTotalMs: 0,
          isRunning: true,
        }),
      pause: () => {
        const { isRunning } = get()
        if (!isRunning) return
        set({ pausedAt: Date.now(), isRunning: false })
      },
      resume: () => {
        const { pausedAt, pausedTotalMs } = get()
        if (!pausedAt) return
        set({
          pausedTotalMs: pausedTotalMs + (Date.now() - pausedAt),
          pausedAt: null,
          isRunning: true,
        })
      },
      setIncludeReview: (includeReview) => set({ includeReview }),
      clearSession: () => set(sessionDefaults),
      reset: () => set({ ...sessionDefaults, includeReview: true }),
    }),
    {
      name: '@concursos:session',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
