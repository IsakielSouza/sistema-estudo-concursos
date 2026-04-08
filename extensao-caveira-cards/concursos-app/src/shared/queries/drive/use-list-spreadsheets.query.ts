// src/shared/queries/drive/use-list-spreadsheets.query.ts
import { useQuery } from '@tanstack/react-query'
import { GoogleSignin } from '@react-native-google-signin/google-signin'

export interface DriveSpreadsheet {
  id: string
  name: string
  modifiedTime: string
}

async function listSpreadsheets(): Promise<DriveSpreadsheet[]> {
  const { accessToken } = await GoogleSignin.getTokens()
  const params = new URLSearchParams({
    q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
    fields: 'files(id,name,modifiedTime)',
    orderBy: 'modifiedTime desc',
    pageSize: '50',
  })

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?${params.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!res.ok) {
    const body = await res.text()
    console.log('[Drive] error status:', res.status, 'body:', body)
    throw new Error(`Drive API error: ${res.status}`)
  }
  const data = await res.json()
  console.log('[Drive] files count:', data.files?.length)
  return data.files as DriveSpreadsheet[]
}

export function useListSpreadsheetsQuery(enabled: boolean) {
  return useQuery({
    queryKey: ['drive', 'spreadsheets'],
    queryFn: listSpreadsheets,
    enabled,
    staleTime: 1000 * 60 * 2,
  })
}
