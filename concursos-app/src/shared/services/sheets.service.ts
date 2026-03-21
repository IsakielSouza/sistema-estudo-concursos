// src/shared/services/sheets.service.ts
// Full implementation in Phase 4. Stub for auth flow.
export class SheetsService {
  static async validateSpreadsheetAccess(
    spreadsheetId: string,
    accessToken: string
  ): Promise<boolean> {
    try {
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=spreadsheetId`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      return res.ok
    } catch {
      return false
    }
  }
}
