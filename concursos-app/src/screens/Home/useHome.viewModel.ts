import { useSyncSheetsMutation } from '@/shared/queries/sheets/use-sync-sheets.mutation'
import { useEffect } from 'react'

export const useHomeViewModel = () => {
  const syncMutation = useSyncSheetsMutation()

  useEffect(() => {
    syncMutation.mutate()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    isSyncing: syncMutation.isPending,
    syncError: syncMutation.error?.message ?? null,
  }
}
