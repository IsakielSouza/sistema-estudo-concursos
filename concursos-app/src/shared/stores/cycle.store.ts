// src/shared/stores/cycle.store.ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface CycleStore {
  activeCycleId: string | null
  activeConcursoId: string | null
  setActiveCycle: (cycleId: string, concursoId: string) => void
  clearActiveCycle: () => void
  reset: () => void
}

const cycleInitialState = {
  activeCycleId: null,
  activeConcursoId: null,
}

export const useCycleStore = create<CycleStore>()(
  persist(
    (set) => ({
      ...cycleInitialState,
      setActiveCycle: (activeCycleId, activeConcursoId) =>
        set({ activeCycleId, activeConcursoId }),
      clearActiveCycle: () =>
        set({ activeCycleId: null, activeConcursoId: null }),
      reset: () => set(cycleInitialState),
    }),
    {
      name: '@concursos:cycle',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
