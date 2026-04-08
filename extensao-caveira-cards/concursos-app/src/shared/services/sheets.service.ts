// src/shared/services/sheets.service.ts
import { sheetsClient } from '@/shared/api/sheets.client'
import type { SpreadsheetMetadata, SheetsValueRange } from '@/shared/interfaces/http/sheets-response'
import type { SubjectSyncData, TopicSyncRow } from '@/shared/interfaces/http/sync-payload'

// Sheets that are decorative/reference — never treated as subject data
const SKIP_SHEETS = ['TOTAL', 'RESUMO', 'Dashboard', 'Resoluções CONTRAN']

// Rows whose column-B text should be ignored entirely
const SKIP_LABELS = ['BARRA DE PROGRESSO', 'STATUS', 'TOTAL', 'FEITO', 'PENDENTE', '%FEITO']

// Topic rows start with a number pattern: "1 -", "4.1 -", "10 -", etc.
const TOPIC_RE = /^\s*\d+[\d.]*\s*[-–]/

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

  /** Returns the name of the first data sheet (not a skip/decoration sheet). */
  async getDataSheetName(spreadsheetId: string): Promise<string | null> {
    const metadata = await SheetsService.getMetadata(spreadsheetId)
    const dataSheet = metadata.sheets.find(
      (s) => !SKIP_SHEETS.includes(s.properties.title)
    )
    return dataSheet?.properties.title ?? null
  },

  async readAllSubjects(spreadsheetId: string): Promise<SubjectSyncData[]> {
    const metadata = await SheetsService.getMetadata(spreadsheetId)
    const subjects: SubjectSyncData[] = []

    for (const sheet of metadata.sheets) {
      const title = sheet.properties.title
      if (SKIP_SHEETS.includes(title)) continue

      const values = await SheetsService.getSheetValues(spreadsheetId, title)
      if (!values.length) continue

      let currentSubject: SubjectSyncData | null = null
      let absoluteRowIndex = 0

      for (const row of values) {
        absoluteRowIndex++

        // Column B is the main content column; col A is usually empty in PRF format
        const colB = (row[1] ?? row[0] ?? '').trim()
        const colC = (row[2] ?? '').trim()

        if (!colB) continue

        // ── Subject header row ──────────────────────────────────────────
        // ALL CAPS text that does NOT start with a digit and is not a skip label
        if (SheetsService._isSubjectRow(colB)) {
          if (currentSubject && currentSubject.topics.length > 0) {
            subjects.push(currentSubject)
          }
          currentSubject = { name: colB, topics: [] }
          continue
        }

        // ── Topic row ────────────────────────────────────────────────────
        if (TOPIC_RE.test(colB) && currentSubject) {
          const code = SheetsService._extractCode(colB)
          // Status: "1" = done, anything else = pending
          const status: TopicSyncRow['status'] = colC === '1' ? 'FEITO' : 'PENDENTE'
          const level = SheetsService._getLevel(code)

          currentSubject.topics.push({
            subjectName: currentSubject.name,
            code,
            title: colB,
            level,
            order: currentSubject.topics.length,
            sheetRow: absoluteRowIndex - 1, // 0-based absolute row index for write-back
            status,
          })
        }
      }

      // Push the last subject
      if (currentSubject && currentSubject.topics.length > 0) {
        subjects.push(currentSubject)
      }
    }

    return subjects
  },

  /**
   * Writes a topic status back to the spreadsheet.
   * sheetTitle must be the actual tab name (e.g. "Edital PRF"), not the subject name.
   * rowOrder is the 0-based absolute row index stored on the topic.
   */
  async updateTopicStatus(
    spreadsheetId: string,
    sheetTitle: string,
    rowOrder: number,
    status: 'FEITO' | 'PENDENTE'
  ): Promise<void> {
    // rowOrder is 0-based; Sheets API rows are 1-based → +1
    const cellValue = status === 'FEITO' ? '1' : '0'
    const range = encodeURIComponent(`${sheetTitle}!C${rowOrder + 1}`)
    await sheetsClient.put(
      `/${spreadsheetId}/values/${range}`,
      {
        range: `${sheetTitle}!C${rowOrder + 1}`,
        majorDimension: 'ROWS',
        values: [[cellValue]],
      },
      { params: { valueInputOption: 'RAW' } }
    )
  },

  // ── Helpers ────────────────────────────────────────────────────────────

  _isSubjectRow(colB: string): boolean {
    const t = colB.trim()
    return (
      t.length > 2 &&
      !TOPIC_RE.test(t) &&
      t.toUpperCase() === t &&
      !SKIP_LABELS.includes(t) &&
      !t.startsWith('"') &&
      !/^[\d.]+$/.test(t) // not a bare number like "0.156..."
    )
  },

  _extractCode(title: string): string {
    const match = title.trim().match(/^(\d+[\d.]*)\s*[-–]/)
    return match ? match[1] : ''
  },

  _getLevel(code: string): number {
    if (!code || !code.includes('.')) return 1
    return code.split('.').length
  },
}
