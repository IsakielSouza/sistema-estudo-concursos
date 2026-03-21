// src/shared/services/sheets.service.ts
import { sheetsClient } from '@/shared/api/sheets.client'
import type { SpreadsheetMetadata, SheetsValueRange } from '@/shared/interfaces/http/sheets-response'
import type { SubjectSyncData, TopicSyncRow } from '@/shared/interfaces/http/sync-payload'

const STATUS_DONE = 'FEITO'
const STATUS_HEADER = 'STATUS'

export const SheetsService = {
  async validateSpreadsheetAccess(spreadsheetId: string): Promise<boolean> {
    try {
      await sheetsClient.get(`/${spreadsheetId}?fields=spreadsheetId`)
      return true
    } catch {
      return false
    }
  },

  async getMetadata(spreadsheetId: string): Promise<SpreadsheetMetadata> {
    const { data } = await sheetsClient.get<SpreadsheetMetadata>(`/${spreadsheetId}`)
    return data
  },

  async getSheetValues(
    spreadsheetId: string,
    sheetTitle: string
  ): Promise<string[][]> {
    const range = encodeURIComponent(`${sheetTitle}!A:Z`)
    const { data } = await sheetsClient.get<SheetsValueRange>(
      `/${spreadsheetId}/values/${range}`
    )
    return data.values ?? []
  },

  async readAllSubjects(spreadsheetId: string): Promise<SubjectSyncData[]> {
    const metadata = await SheetsService.getMetadata(spreadsheetId)
    const subjects: SubjectSyncData[] = []

    for (const sheet of metadata.sheets) {
      const title = sheet.properties.title
      if (['TOTAL', 'RESUMO', 'Dashboard'].includes(title)) continue

      const values = await SheetsService.getSheetValues(spreadsheetId, title)
      if (!values.length) continue

      const topics: TopicSyncRow[] = []
      let orderCounter = 0
      let absoluteRowIndex = 0  // tracks all rows including skipped ones

      for (const row of values) {
        absoluteRowIndex++ // increment before any skip — counts every row
        if (!row[0] && !row[1]) continue
        const code = (row[0] ?? '').trim()
        const rowTitle = (row[1] ?? row[0] ?? '').trim()
        const statusCell = (row[2] ?? '').trim().toUpperCase()

        if ([STATUS_HEADER, 'TOTAL', 'FEITO', 'PENDENTE', '%FEITO', 'BARRA DE PROGRESSO'].includes(rowTitle.toUpperCase())) continue
        if (!rowTitle) continue

        const level = SheetsService._getLevel(code)
        const status = statusCell === STATUS_DONE ? 'FEITO' : 'PENDENTE'

        topics.push({
          subjectName: title,
          code,
          title: rowTitle,
          level,
          order: orderCounter++,
          sheetRow: absoluteRowIndex - 1,  // 0-based absolute row index
          status,
        })
      }

      if (topics.length > 0) {
        subjects.push({ name: title, topics })
      }
    }

    return subjects
  },

  async updateTopicStatus(
    spreadsheetId: string,
    sheetTitle: string,
    rowOrder: number,
    status: 'FEITO' | 'PENDENTE'
  ): Promise<void> {
    const range = encodeURIComponent(`${sheetTitle}!C${rowOrder + 2}`)
    await sheetsClient.put(`/${spreadsheetId}/values/${range}`, {
      range: `${sheetTitle}!C${rowOrder + 2}`,
      majorDimension: 'ROWS',
      values: [[status]],
    }, {
      params: { valueInputOption: 'RAW' },
    })
  },

  _getLevel(code: string): number {
    if (!code || !code.includes('.')) return 1
    return code.split('.').length
  },
}
