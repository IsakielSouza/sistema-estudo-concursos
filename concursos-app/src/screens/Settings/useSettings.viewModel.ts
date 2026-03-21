// src/screens/Settings/useSettings.viewModel.ts
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { object, string } from 'yup'
import { useAuthStore } from '@/shared/stores/auth.store'
import { useSettingsStore } from '@/shared/stores/settings.store'
import { useSyncSheetsMutation } from '@/shared/queries/sheets/use-sync-sheets.mutation'
import { router } from 'expo-router'
import { Alert } from 'react-native'

const settingsSchema = object({
  spreadsheetUrl: string()
    .required('URL obrigatória')
    .matches(
      /docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/,
      'URL inválida — use a URL completa da planilha Google'
    ),
})

function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)
  return match?.[1] ?? null
}

export const useSettingsViewModel = () => {
  const user = useAuthStore((s) => s.user)
  const spreadsheetId = useAuthStore((s) => s.spreadsheetId)
  const setSpreadsheetId = useAuthStore((s) => s.setSpreadsheetId)
  const logout = useAuthStore((s) => s.logout)

  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled)
  const setNotificationsEnabled = useSettingsStore((s) => s.setNotificationsEnabled)

  const syncMutation = useSyncSheetsMutation()

  const form = useForm({
    resolver: yupResolver(settingsSchema),
    defaultValues: {
      spreadsheetUrl: spreadsheetId
        ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
        : '',
    },
  })

  const handleSaveSpreadsheet = form.handleSubmit((values) => {
    const id = extractSpreadsheetId(values.spreadsheetUrl)
    if (!id) {
      Alert.alert('Erro', 'Não foi possível extrair o ID da planilha.')
      return
    }
    setSpreadsheetId(id)
    Alert.alert('Salvo', 'ID da planilha atualizado.')
  })

  const handleSyncNow = () => {
    syncMutation.mutate()
  }

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja realmente sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: () => {
          logout()
          router.replace('/(public)/login')
        },
      },
    ])
  }

  return {
    user,
    form,
    handleSaveSpreadsheet,
    handleSyncNow,
    isSyncing: syncMutation.isPending,
    notificationsEnabled,
    setNotificationsEnabled,
    handleLogout,
  }
}
