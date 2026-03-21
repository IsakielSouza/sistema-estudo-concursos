// src/shared/queries/backup/use-restore-backup.mutation.ts
import { useMutation } from '@tanstack/react-query'
import { BackupService } from '@/shared/services/backup.service'
import { useAuthStore } from '@/shared/stores/auth.store'
import { useCycleStore } from '@/shared/stores/cycle.store'
import { useSessionStore } from '@/shared/stores/session.store'
import { useSettingsStore } from '@/shared/stores/settings.store'
import { Alert } from 'react-native'

export function useRestoreBackupMutation() {
  const googleAccessToken = useAuthStore((s) => s.googleAccessToken)
  const resetAuth = useAuthStore((s) => s.logout)
  const clearActiveCycle = useCycleStore((s) => s.clearActiveCycle)
  const resetSession = useSessionStore((s) => s.reset)
  const resetSettings = useSettingsStore((s) => s.reset)

  return useMutation({
    mutationFn: (fileId: string) => {
      if (!googleAccessToken) throw new Error('Not authenticated')
      return BackupService.restoreBackup(googleAccessToken, fileId)
    },
    onSuccess: () => {
      resetAuth()
      clearActiveCycle()
      resetSession()
      resetSettings()
      Alert.alert('Backup restaurado', 'O app será reiniciado com os dados restaurados.')
    },
    onError: (err) => {
      Alert.alert('Erro', `Falha ao restaurar backup: ${(err as Error).message}`)
    },
  })
}
