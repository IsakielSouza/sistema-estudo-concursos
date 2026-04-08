import { useMutation, useQueryClient } from '@tanstack/react-query'
import { SyncService } from '@/shared/services/sync.service'
import { ConcursoRepository } from '@/shared/database/repositories/concurso.repository'
import { useAuthStore } from '@/shared/stores/auth.store'
import { useCycleStore } from '@/shared/stores/cycle.store'

export function useSyncSheetsMutation() {
  const queryClient = useQueryClient()
  const spreadsheetId = useAuthStore((s) => s.spreadsheetId)
  const activeConcursoId = useCycleStore((s) => s.activeConcursoId)
  const setActiveConcurso = useCycleStore((s) => s.setActiveConcurso)

  return useMutation({
    mutationFn: async (params?: { spreadsheetId?: string; concursoId?: string }) => {
      const effectiveSpreadsheetId = params?.spreadsheetId ?? spreadsheetId
      if (!effectiveSpreadsheetId) {
        throw new Error('Planilha não configurada')
      }
      let effectiveConcursoId = params?.concursoId ?? activeConcursoId
      if (!effectiveConcursoId) {
        const concurso = await ConcursoRepository.getOrCreate('Meu Concurso')
        setActiveConcurso(concurso.id)
        effectiveConcursoId = concurso.id
      }
      return SyncService.syncOnLogin(effectiveSpreadsheetId, effectiveConcursoId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      queryClient.invalidateQueries({ queryKey: ['topics'] })
    },
  })
}
