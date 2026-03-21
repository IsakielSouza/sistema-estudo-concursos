// src/screens/Settings/useSettings.viewModel.ts
import { yupResolver } from '@hookform/resolvers/yup'
import { useAuthStore } from '@/shared/stores/auth.store'
import {
  extractSpreadsheetId,
  spreadsheetSchema,
  type SpreadsheetFormData,
} from '@/shared/schemas/spreadsheet.schema'
import { SheetsService } from '@/shared/services/sheets.service'
import { router } from 'expo-router'
import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'

export const useSettingsViewModel = () => {
  const spreadsheetId = useAuthStore((s) => s.spreadsheetId)
  const googleAccessToken = useAuthStore((s) => s.googleAccessToken)
  const setSpreadsheetId = useAuthStore((s) => s.setSpreadsheetId)
  const logout = useAuthStore((s) => s.logout)

  const [isValidating, setIsValidating] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const form = useForm<SpreadsheetFormData>({
    resolver: yupResolver(spreadsheetSchema),
    defaultValues: {
      spreadsheetUrl: spreadsheetId
        ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
        : '',
    },
  })

  const handleSave = useCallback(
    async (data: SpreadsheetFormData) => {
      const id = extractSpreadsheetId(data.spreadsheetUrl)
      if (!id) return

      setIsValidating(true)
      setValidationError(null)

      const hasAccess = await SheetsService.validateSpreadsheetAccess(
        id,
        googleAccessToken ?? ''
      )

      if (!hasAccess) {
        setValidationError(
          'Não foi possível acessar a planilha. Verifique o link e as permissões.'
        )
        setIsValidating(false)
        return
      }

      setSpreadsheetId(id)
      setIsValidating(false)
      router.replace('/(private)/(tabs)/home')
    },
    [googleAccessToken, setSpreadsheetId]
  )

  const handleLogout = useCallback(() => {
    logout()
    router.replace('/(public)/login')
  }, [logout])

  return {
    form,
    handleSave,
    handleLogout,
    isValidating,
    validationError,
    spreadsheetId,
  }
}
