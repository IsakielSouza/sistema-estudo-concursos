// src/app/index.tsx
import { useAuthStore } from '@/shared/stores/auth.store'
import { Redirect } from 'expo-router'

export default function Index() {
  const user = useAuthStore((s) => s.user)
  return <Redirect href={user ? '/(private)/(tabs)/home' : '/(public)/login'} />
}
