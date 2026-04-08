// src/screens/Backup/useBackup.viewModel.ts
import { useBackupNowMutation } from '@/shared/queries/backup/use-backup.mutation'
import { useListBackupsQuery } from '@/shared/queries/backup/use-list-backups.query'
import { useRestoreBackupMutation } from '@/shared/queries/backup/use-restore-backup.mutation'
import { useSettingsStore } from '@/shared/stores/settings.store'
import { Alert } from 'react-native'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const useBackupViewModel = () => {
  const lastBackupAt = useSettingsStore((s) => s.lastBackupAt)
  const autoBackupEnabled = useSettingsStore((s) => s.autoBackupEnabled)
  const setAutoBackup = useSettingsStore((s) => s.setAutoBackup)

  const { data: backupFiles = [], isLoading: loadingFiles } = useListBackupsQuery()
  const backupMutation = useBackupNowMutation()
  const restoreMutation = useRestoreBackupMutation()

  const lastBackupFormatted = lastBackupAt
    ? format(parseISO(lastBackupAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    : 'Nunca'

  const handleBackupNow = () => {
    backupMutation.mutate()
  }

  const handleRestore = (fileId: string, fileName: string) => {
    Alert.alert(
      'Restaurar backup',
      `Isso substituirá todos os dados locais com ${fileName}. Continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Restaurar', style: 'destructive', onPress: () => restoreMutation.mutate(fileId) },
      ]
    )
  }

  return {
    lastBackupFormatted,
    autoBackupEnabled,
    setAutoBackup,
    backupFiles,
    loadingFiles,
    handleBackupNow,
    handleRestore,
    isBackingUp: backupMutation.isPending,
    isRestoring: restoreMutation.isPending,
  }
}
