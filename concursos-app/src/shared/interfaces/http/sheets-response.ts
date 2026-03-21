export interface SheetsValueRange {
  range: string
  majorDimension: string
  values: string[][]
}

export interface SpreadsheetMetadata {
  spreadsheetId: string
  properties: { title: string }
  sheets: Array<{
    properties: { sheetId: number; title: string; index: number }
  }>
}
