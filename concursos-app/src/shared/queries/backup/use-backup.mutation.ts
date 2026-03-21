// src/shared/queries/backup/use-backup.mutation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { BackupService } from '@/shared/services/backup.service'
import { useSettingsStore } from '@/shared/stores/settings.store'

export function useBackupNowMutation() {
  const setLastBackupAt = useSettingsStore((s) => s.setLastBackupAt)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => BackupService.backupNow(),
    onSuccess: () => {
      setLastBackupAt(new Date().toISOString())
      queryClient.invalidateQueries({ queryKey: ['backup-list'] })
    },
  })
}
