import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PlannedSessionRepository } from '@/shared/database/repositories/planned-session.repository'
import type { PlannedSession } from '@/shared/interfaces/cycle'

export function useUpdatePlannedSessionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: PlannedSession['status'] }) =>
      PlannedSessionRepository.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planned-sessions'] })
    },
  })
}
