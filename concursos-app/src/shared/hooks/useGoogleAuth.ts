// src/shared/hooks/useGoogleAuth.ts
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin'
import { useCallback, useEffect } from 'react'
import { useAuthStore } from '@/shared/stores/auth.store'

const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? ''

GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.appdata',
    'https://www.googleapis.com/auth/drive.metadata.readonly',
  ],
  offlineAccess: true,
})

export function useGoogleAuth() {
  const setUser = useAuthStore((s) => s.setUser)
  const setTokens = useAuthStore((s) => s.setTokens)

  const signIn = useCallback(async () => {
    try {
      console.log('[GoogleAuth] hasPlayServices...')
      await GoogleSignin.hasPlayServices()
      console.log('[GoogleAuth] signIn...')
      const userInfo = await GoogleSignin.signIn()
      console.log('[GoogleAuth] signIn result type:', userInfo?.type)
      console.log('[GoogleAuth] signIn data:', JSON.stringify(userInfo?.data?.user))
      const tokens = await GoogleSignin.getTokens()
      console.log('[GoogleAuth] tokens accessToken:', tokens.accessToken ? 'ok' : 'missing')

      const user = userInfo.data?.user ?? (userInfo as any).user

      setUser({
        id: user.id,
        name: user.name ?? '',
        email: user.email,
        photoUrl: user.photo ?? null,
      })
      setTokens(tokens.accessToken, tokens.idToken ?? '')
      console.log('[GoogleAuth] store updated, returning token')

      return tokens.accessToken
    } catch (error: any) {
      console.log('[GoogleAuth] error code:', error.code, 'message:', error.message)
      if (error.code === statusCodes.SIGN_IN_CANCELLED) return null
      if (error.code === statusCodes.IN_PROGRESS) return null
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) return null
      throw error
    }
  }, [setUser, setTokens])

  return { signIn }
}
