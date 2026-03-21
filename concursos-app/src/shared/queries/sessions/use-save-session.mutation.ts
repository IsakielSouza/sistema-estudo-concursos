import { useMutation, useQueryClient } from '@tanstack/react-query'
import { SessionRepository } from '@/shared/database/repositories/session.repository'
import { CycleRepository } from '@/shared/database/repositories/cycle.repository'
import { PlannedSessionRepository } from '@/shared/database/repositories/planned-session.repository'
import { SyncService } from '@/shared/services/sync.service'
import { BackupService } from '@/shared/services/backup.service'
import { useAuthStore } from '@/shared/stores/auth.store'
import { useSettingsStore } from '@/shared/stores/settings.store'
import { getDatabase } from '@/shared/database/database'

interface SaveSessionInput {
  plannedSessionId: string
  cycleSubjectId: string
  subjectId: string
  startedAt: string
  studySeconds: number
  reviewSeconds: number
  pausedSeconds: number
}

export function useSaveSessionMutation() {
  const queryClient = useQueryClient()
  const spreadsheetId = useAuthStore((s) => s.spreadsheetId)
  const googleAccessToken = useAuthStore((s) => s.googleAccessToken)
  const autoBackupEnabled = useSettingsStore((s) => s.autoBackupEnabled)

  return useMutation({
    mutationFn: async (input: SaveSessionInput) => {
      const db = await getDatabase()
      const endedAt = new Date().toISOString()
      const studyHours = input.studySeconds / 3600

      await db.withTransactionAsync(async () => {
        await SessionRepository.create({
          plannedSessionId: input.plannedSessionId,
          cycleSubjectId: input.cycleSubjectId,
          subjectId: input.subjectId,
          startedAt: input.startedAt,
          endedAt,
          studySeconds: input.studySeconds,
          reviewSeconds: input.reviewSeconds,
          pausedSeconds: input.pausedSeconds,
        })
        await CycleRepository.incrementCycleSubjectHours(input.cycleSubjectId, studyHours)
        await PlannedSessionRepository.updateStatus(input.plannedSessionId, 'done')
      })

      if (spreadsheetId) {
        await SyncService.writeDirtyTopics(spreadsheetId, input.subjectId)
      }

      if (autoBackupEnabled && googleAccessToken) {
        try {
          await BackupService.backupNow(googleAccessToken)
          useSettingsStore.getState().setLastBackupAt(new Date().toISOString())
        } catch {
          // Silent fail — backup is best-effort
        }
      }

      return { endedAt }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planned-sessions'] })
      queryClient.invalidateQueries({ queryKey: ['cycle-subjects'] })
    },
  })
}
