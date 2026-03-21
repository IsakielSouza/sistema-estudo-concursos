export interface TopicSyncRow {
  subjectName: string
  code: string
  title: string
  level: number
  order: number
  sheetRow: number  // absolute 0-based row index in the sheet (sheetRow + 2 = 1-indexed Sheets row)
  status: 'FEITO' | 'PENDENTE'
}

export interface SubjectSyncData {
  name: string
  topics: TopicSyncRow[]
}
