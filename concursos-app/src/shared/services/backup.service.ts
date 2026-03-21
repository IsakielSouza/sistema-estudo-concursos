// src/shared/services/backup.service.ts
import * as FileSystem from 'expo-file-system'
import { driveClient } from '@/shared/api/drive.client'
import { format } from 'date-fns'

const DB_PATH = `${FileSystem.documentDirectory}SQLite/concursos.db`
const BOUNDARY = 'boundary_estudos'

export interface BackupFile {
  id: string
  name: string
  createdTime: string
  size: number
}

export const BackupService = {
  async backupNow(_accessToken?: string): Promise<string> {
    const name = `backup-${format(new Date(), 'yyyy-MM-dd-HHmm')}.db`
    const dbInfo = await FileSystem.getInfoAsync(DB_PATH)
    if (!dbInfo.exists) throw new Error('Database file not found')

    const fileContent = await FileSystem.readAsStringAsync(DB_PATH, {
      encoding: FileSystem.EncodingType.Base64,
    })

    const metadata = {
      name,
      parents: ['appDataFolder'],
    }

    const response = await driveClient.post(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      createMultipartBody(metadata, fileContent),
      {
        headers: {
          'Content-Type': `multipart/related; boundary=${BOUNDARY}`,
        },
      }
    )

    return response.data.id as string
  },

  async listBackups(_accessToken?: string): Promise<BackupFile[]> {
    const res = await driveClient.get(
      'https://www.googleapis.com/drive/v3/files',
      {
        params: {
          spaces: 'appDataFolder',
          fields: 'files(id,name,createdTime,size)',
          q: `name contains 'backup-' and name contains '.db'`,
          orderBy: 'createdTime desc',
        },
      }
    )
    return (res.data.files ?? []) as BackupFile[]
  },

  async restoreBackup(_accessToken: string, fileId: string): Promise<void> {
    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`
    const tempPath = `${FileSystem.cacheDirectory}restore-temp.db`

    // Get the token from the store for the download header
    const { useAuthStore } = await import('@/shared/stores/auth.store')
    const token = useAuthStore.getState().googleAccessToken

    const result = await FileSystem.downloadAsync(downloadUrl, tempPath, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })

    if (result.status !== 200) {
      throw new Error(`Download failed with status ${result.status}`)
    }

    await FileSystem.moveAsync({ from: tempPath, to: DB_PATH })
  },

  /** Legacy alias — used by old call sites that don't pass a token. */
  async backup(): Promise<void> {
    await BackupService.backupNow()
  },
}

function createMultipartBody(metadata: object, base64Content: string): string {
  return [
    `--${BOUNDARY}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    `--${BOUNDARY}`,
    'Content-Type: application/octet-stream',
    'Content-Transfer-Encoding: base64',
    '',
    base64Content,
    `--${BOUNDARY}--`,
  ].join('\r\n')
}
