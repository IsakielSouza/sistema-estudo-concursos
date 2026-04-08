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
      console.log('[Login] token:', token ? 'ok' : 'null')
      if (!token) {
        setError('Login cancelado.')
        return
      }
      console.log('[Login] spreadsheetId:', spreadsheetId)
      if (!spreadsheetId) {
        console.log('[Login] → settings')
        router.replace('/(private)/settings')
      } else {
        console.log('[Login] → home')
        router.replace('/(private)/(tabs)/home')
      }
    } catch (e) {
      console.log('[Login] error:', e)
      setError('Erro ao fazer login. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }, [signIn, spreadsheetId])

  return { handleGoogleLogin, isLoading, error }
}
