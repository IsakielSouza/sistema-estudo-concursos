import { useMutation, useQueryClient } from '@tanstack/react-query'
import { SyncService } from '@/shared/services/sync.service'
import { useAuthStore } from '@/shared/stores/auth.store'
import { useCycleStore } from '@/shared/stores/cycle.store'

export function useSyncSheetsMutation() {
  const queryClient = useQueryClient()
  const spreadsheetId = useAuthStore((s) => s.spreadsheetId)
  const activeConcursoId = useCycleStore((s) => s.activeConcursoId)

  return useMutation({
    mutationFn: async () => {
      if (!spreadsheetId || !activeConcursoId) {
        throw new Error('Spreadsheet ou concurso não configurado')
      }
      return SyncService.syncOnLogin(spreadsheetId, activeConcursoId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      queryClient.invalidateQueries({ queryKey: ['topics'] })
    },
  })
}
