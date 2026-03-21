// src/app/index.tsx
import { useAuthStore } from '@/shared/stores/auth.store'
import { Redirect } from 'expo-router'

export default function Index() {
  const user = useAuthStore((s) => s.user)
  const spreadsheetId = useAuthStore((s) => s.spreadsheetId)

  if (!user) return <Redirect href="/(public)/login" />
  if (!spreadsheetId) return <Redirect href="/(private)/settings" />
  return <Redirect href="/(private)/(tabs)/home" />
}
