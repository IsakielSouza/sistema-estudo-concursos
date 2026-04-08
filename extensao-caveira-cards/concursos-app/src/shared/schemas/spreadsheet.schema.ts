// src/shared/schemas/spreadsheet.schema.ts
import * as yup from 'yup'

const SHEETS_URL_REGEX =
  /https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/

export const spreadsheetSchema = yup.object({
  spreadsheetUrl: yup
    .string()
    .required('Informe o link da planilha')
    .matches(SHEETS_URL_REGEX, 'Link inválido — cole a URL do Google Sheets'),
})

export type SpreadsheetFormData = yup.InferType<typeof spreadsheetSchema>

export function extractSpreadsheetId(url: string): string | null {
  const match = url.match(SHEETS_URL_REGEX)
  return match ? match[1] : null
}
