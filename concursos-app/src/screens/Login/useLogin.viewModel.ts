// src/screens/Login/useLogin.viewModel.ts
import { useGoogleAuth } from '@/shared/hooks/useGoogleAuth'
import { useAuthStore } from '@/shared/stores/auth.store'
import { router } from 'expo-router'
import { useCallback, useState } from 'react'

export const useLoginViewModel = () => {
  const { signIn } = useGoogleAuth()
  const spreadsheetId = useAuthStore((s) => s.spreadsheetId)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleLogin = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const token = await signIn()
      if (!token) {
        setError('Login cancelado.')
        return
      }
      if (!spreadsheetId) {
        router.replace('/(private)/settings')
      } else {
        router.replace('/(private)/(tabs)/home')
      }
    } catch {
      setError('Erro ao fazer login. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }, [signIn, spreadsheetId])

  return { handleGoogleLogin, isLoading, error }
}
