// src/shared/queries/backup/use-list-backups.query.ts
import { useQuery } from '@tanstack/react-query'
import { BackupService } from '@/shared/services/backup.service'
import { useAuthStore } from '@/shared/stores/auth.store'

export function useListBackupsQuery() {
  const googleAccessToken = useAuthStore((s) => s.googleAccessToken)

  return useQuery({
    queryKey: ['backup-list'],
    queryFn: () => BackupService.listBackups(),
    enabled: !!googleAccessToken,
    staleTime: 60_000,
  })
}
