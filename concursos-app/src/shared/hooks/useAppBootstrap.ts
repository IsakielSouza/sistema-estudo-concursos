// src/shared/hooks/useAppBootstrap.ts
import { useEffect, useState } from 'react'
import { SubjectRepository } from '@/shared/database/repositories/subject.repository'
import { CycleRepository } from '@/shared/database/repositories/cycle.repository'
import { useCycleStore } from '@/shared/stores/cycle.store'

export function useAppBootstrap() {
  const [hasHydrated, setHasHydrated] = useState(
    () => useCycleStore.persist.hasHydrated()
  )

  useEffect(() => {
    if (hasHydrated) return
    return useCycleStore.persist.onFinishHydration(() => setHasHydrated(true))
  }, [hasHydrated])

  useEffect(() => {
    if (!hasHydrated) return

    async function reconcile() {
      const { activeCycleId, activeConcursoId, setActiveConcurso, clearActiveCycleId } =
        useCycleStore.getState()

      // Step 1: Reconciliar activeConcursoId
      const concurso = await SubjectRepository.getActiveConcurso()
      if (concurso && concurso.id !== activeConcursoId) {
        setActiveConcurso(concurso.id)
      }

      // Step 2: Reconciliar activeCycleId
      if (activeCycleId) {
        const cycle = await CycleRepository.getById(activeCycleId)
        if (!cycle || (cycle.status !== 'active' && cycle.status !== 'late')) {
          clearActiveCycleId()
        }
      }
    }

    reconcile()
  }, [hasHydrated])
}
