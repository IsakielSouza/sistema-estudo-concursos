// src/shared/stores/cycle.store.ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface CycleStore {
  activeCycleId: string | null
  activeConcursoId: string | null
  setActiveCycle: (cycleId: string, concursoId: string) => void
  clearActiveCycle: () => void
}

export const useCycleStore = create<CycleStore>()(
  persist(
    (set) => ({
      activeCycleId: null,
      activeConcursoId: null,
      setActiveCycle: (activeCycleId, activeConcursoId) =>
        set({ activeCycleId, activeConcursoId }),
      clearActiveCycle: () =>
        set({ activeCycleId: null, activeConcursoId: null }),
    }),
    {
      name: '@concursos:cycle',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
