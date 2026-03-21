import { useQuery } from '@tanstack/react-query'
import { SheetsService } from '@/shared/services/sheets.service'
import { useAuthStore } from '@/shared/stores/auth.store'

export function useGetSpreadsheetQuery() {
  const spreadsheetId = useAuthStore((s) => s.spreadsheetId)

  return useQuery({
    queryKey: ['spreadsheet', spreadsheetId],
    queryFn: () => SheetsService.getMetadata(spreadsheetId!),
    enabled: !!spreadsheetId,
    staleTime: 5 * 60 * 1000,
  })
}
