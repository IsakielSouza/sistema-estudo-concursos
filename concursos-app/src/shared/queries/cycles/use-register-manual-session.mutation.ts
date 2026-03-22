import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PlannedSessionRepository } from '@/shared/database/repositories/planned-session.repository'
import { SessionRepository } from '@/shared/database/repositories/session.repository'
import { CycleRepository } from '@/shared/database/repositories/cycle.repository'
import { getDatabase } from '@/shared/database/database'

interface RegisterManualInput {
  plannedSessionId: string
  minutes: number
}

export function useRegisterManualSessionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ plannedSessionId, minutes }: RegisterManualInput) => {
      const plannedSession = await PlannedSessionRepository.getById(plannedSessionId)
      if (!plannedSession) throw new Error('Sessão não encontrada')

      const now = new Date().toISOString()
      const studySeconds = minutes * 60
      const db = await getDatabase()

      await db.withTransactionAsync(async () => {
        await SessionRepository.create({
          plannedSessionId,
          cycleSubjectId: plannedSession.cycleSubjectId,
          subjectId: plannedSession.subjectId,
          startedAt: now,
          endedAt: now,
          studySeconds,
          reviewSeconds: 0,
          pausedSeconds: 0,
          isManual: true,
        })
        await PlannedSessionRepository.updateStatus(plannedSessionId, 'done')
        await CycleRepository.incrementCycleSubjectHours(
          plannedSession.cycleSubjectId,
          studySeconds / 3600
        )
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planned-sessions'] })
      queryClient.invalidateQueries({ queryKey: ['cycle-subjects'] })
    },
  })
}
