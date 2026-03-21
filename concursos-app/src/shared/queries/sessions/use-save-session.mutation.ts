import { useMutation, useQueryClient } from '@tanstack/react-query'
import { SessionRepository } from '@/shared/database/repositories/session.repository'
import { CycleRepository } from '@/shared/database/repositories/cycle.repository'
import { PlannedSessionRepository } from '@/shared/database/repositories/planned-session.repository'
import { SyncService } from '@/shared/services/sync.service'
import { BackupService } from '@/shared/services/backup.service'
import { useAuthStore } from '@/shared/stores/auth.store'
import { useSettingsStore } from '@/shared/stores/settings.store'

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
  const autoBackupEnabled = useSettingsStore((s) => s.autoBackupEnabled)

  return useMutation({
    mutationFn: async (input: SaveSessionInput) => {
      const endedAt = new Date().toISOString()
      const studyHours = input.studySeconds / 3600

      await SessionRepository.create({
        ...input,
        endedAt,
        reviewSeconds: input.reviewSeconds,
        pausedSeconds: input.pausedSeconds,
      })

      await CycleRepository.incrementCycleSubjectHours(input.cycleSubjectId, studyHours)

      await PlannedSessionRepository.updateStatus(input.plannedSessionId, 'done')

      if (spreadsheetId) {
        await SyncService.writeDirtyTopics(spreadsheetId, input.subjectId)
      }

      if (autoBackupEnabled) {
        await BackupService.backup().catch(() => {})
      }

      return { endedAt }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planned-sessions'] })
      queryClient.invalidateQueries({ queryKey: ['cycle-subjects'] })
    },
  })
}
