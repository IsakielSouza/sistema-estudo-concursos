import { useSyncSheetsMutation } from '@/shared/queries/sheets/use-sync-sheets.mutation'
import { useGetCycleSubjectsQuery } from '@/shared/queries/subjects/use-get-cycle-subjects.query'
import { RecommendationService } from '@/shared/services/recommendation.service'
import { useCycleStore } from '@/shared/stores/cycle.store'
import { CycleRepository } from '@/shared/database/repositories/cycle.repository'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import type { RecommendationItem } from '@/shared/services/recommendation.service'

export const useHomeViewModel = () => {
  const syncMutation = useSyncSheetsMutation()
  const activeCycleId = useCycleStore((s) => s.activeCycleId)
  const activeConcursoId = useCycleStore((s) => s.activeConcursoId)

  const [dayAvailableHours, setDayAvailableHours] = useState(3)
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([])

  const { data: cycleSubjects = [] } = useGetCycleSubjectsQuery()

  const { data: activeCycle } = useQuery({
    queryKey: ['active-cycle', activeCycleId],
    queryFn: () => CycleRepository.getActiveCycle(activeConcursoId!),
    enabled: !!activeConcursoId,
  })

  // Sync on mount
  useEffect(() => {
    syncMutation.mutate()
  }, []) // eslint-disable-line

  // Default day_available_hours = plannedHours / 7
  useEffect(() => {
    if (activeCycle) {
      setDayAvailableHours(Number((activeCycle.plannedHours / 7).toFixed(1)))
    }
  }, [activeCycle])

  // Recompute recommendations when subjects or dayAvailableHours change
  useEffect(() => {
    if (!cycleSubjects.length || !activeCycle) return
    RecommendationService.recommend({
      cycleSubjects,
      dayAvailableHours,
      cycleStartedAt: activeCycle.startedAt,
    }).then(setRecommendations)
  }, [cycleSubjects, dayAvailableHours, activeCycle])

  const cycleProgress =
    activeCycle && activeCycle.plannedHours > 0
      ? activeCycle.completedHours / activeCycle.plannedHours
      : 0

  const cycleStatusLabel =
    activeCycle?.status === 'late'
      ? 'Atrasado'
      : activeCycle?.status === 'completed'
      ? 'Concluído'
      : 'Em dia'

  return {
    isSyncing: syncMutation.isPending,
    syncError: syncMutation.error?.message ?? null,
    activeCycle,
    cycleProgress,
    cycleStatusLabel,
    recommendations,
    dayAvailableHours,
    setDayAvailableHours,
  }
}
