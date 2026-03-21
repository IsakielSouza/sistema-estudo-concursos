// src/shared/queries/sessions/use-get-history.query.ts
import { useQuery } from '@tanstack/react-query'
import { SessionRepository } from '@/shared/database/repositories/session.repository'
import { useCycleStore } from '@/shared/stores/cycle.store'

export function useGetSessionHistoryQuery() {
  const activeConcursoId = useCycleStore((s) => s.activeConcursoId)

  return useQuery({
    queryKey: ['session-history', activeConcursoId],
    queryFn: () => SessionRepository.getAllSessionsGroupedByDate(activeConcursoId!),
    enabled: !!activeConcursoId,
    staleTime: 30_000,
  })
}

export function useGetWeeklySessionsQuery() {
  const activeConcursoId = useCycleStore((s) => s.activeConcursoId)

  return useQuery({
    queryKey: ['session-weekly', activeConcursoId],
    queryFn: () => SessionRepository.getSessionsGroupedByISOWeek(activeConcursoId!),
    enabled: !!activeConcursoId,
    staleTime: 30_000,
  })
}

export function useGetCycleComplianceQuery() {
  const activeConcursoId = useCycleStore((s) => s.activeConcursoId)

  return useQuery({
    queryKey: ['cycle-compliance', activeConcursoId],
    queryFn: () => SessionRepository.getCycleComplianceStats(activeConcursoId!),
    enabled: !!activeConcursoId,
    staleTime: 30_000,
  })
}
