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
  clearSession: () => void
  reset: () => void
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      activePlannedSessionId: null,
      activeCycleSubjectId: null,
      sessionStartTimestamp: null,
      pausedAt: null,
      pausedTotalMs: 0,
      isRunning: false,
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
      clearSession: () =>
        set({
          activePlannedSessionId: null,
          activeCycleSubjectId: null,
          sessionStartTimestamp: null,
          pausedAt: null,
          pausedTotalMs: 0,
          isRunning: false,
        }),
      reset: () =>
        set({
          activePlannedSessionId: null,
          activeCycleSubjectId: null,
          sessionStartTimestamp: null,
          pausedAt: null,
          pausedTotalMs: 0,
          isRunning: false,
          includeReview: true,
        }),
    }),
    {
      name: '@concursos:session',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
