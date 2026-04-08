// src/shared/queries/cycles/use-undo-session.mutation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { SessionRepository } from '@/shared/database/repositories/session.repository'
import { CycleRepository } from '@/shared/database/repositories/cycle.repository'
import { PlannedSessionRepository } from '@/shared/database/repositories/planned-session.repository'
import { getDatabase } from '@/shared/database/database'

interface UndoSessionInput {
  plannedSessionId: string
}

export function useUndoSessionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ plannedSessionId }: UndoSessionInput) => {
      const session = await SessionRepository.getByPlannedSessionId(plannedSessionId)
      const db = await getDatabase()

      await db.withTransactionAsync(async () => {
        if (session) {
          await CycleRepository.decrementCycleSubjectHours(
            session.cycleSubjectId,
            session.studySeconds / 3600
          )
          await SessionRepository.deleteById(session.id)
        }
        await PlannedSessionRepository.resetStatus(plannedSessionId)
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planned-sessions'] })
      queryClient.invalidateQueries({ queryKey: ['cycle-subjects'] })
    },
  })
}
