import { useQuery } from '@tanstack/react-query'
import { PlannedSessionRepository } from '@/shared/database/repositories/planned-session.repository'
import { useCycleStore } from '@/shared/stores/cycle.store'

export function useGetPlannedSessionsQuery() {
  const activeCycleId = useCycleStore((s) => s.activeCycleId)

  return useQuery({
    queryKey: ['planned-sessions', activeCycleId],
    queryFn: () => PlannedSessionRepository.getByCycle(activeCycleId!),
    enabled: !!activeCycleId,
  })
}
