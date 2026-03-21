// src/shared/hooks/useGoogleAuth.ts
import {
  makeRedirectUri,
  useAuthRequest,
  useAutoDiscovery,
} from 'expo-auth-session'
import * as WebBrowser from 'expo-web-browser'
import { useCallback } from 'react'
import { Platform } from 'react-native'
import { useAuthStore } from '@/shared/stores/auth.store'

WebBrowser.maybeCompleteAuthSession()

const GOOGLE_CLIENT_ID_IOS = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS ?? ''
const GOOGLE_CLIENT_ID_ANDROID =
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID ?? ''

interface GoogleUserInfo {
  sub: string
  name: string
  email: string
  picture?: string
}

export function useGoogleAuth() {
  const setUser = useAuthStore((s) => s.setUser)
  const setTokens = useAuthStore((s) => s.setTokens)

  const discovery = useAutoDiscovery('https://accounts.google.com')
  const redirectUri = makeRedirectUri({ scheme: 'concursos-app' })

  // Select the correct client ID based on platform
  const clientId =
    Platform.OS === 'android' ? GOOGLE_CLIENT_ID_ANDROID : GOOGLE_CLIENT_ID_IOS

  const [, , promptAsync] = useAuthRequest(
    {
      clientId,
      scopes: [
        'openid',
        'profile',
        'email',
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.appdata',
      ],
      redirectUri,
    },
    discovery
  )

  const signIn = useCallback(async () => {
    const result = await promptAsync()
    if (result?.type !== 'success') return null

    const { access_token, refresh_token } = result.params

    const userRes = await fetch(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      { headers: { Authorization: `Bearer ${access_token}` } }
    )
    const userInfo = (await userRes.json()) as GoogleUserInfo

    setUser({
      id: userInfo.sub,
      name: userInfo.name,
      email: userInfo.email,
      photoUrl: userInfo.picture ?? null,
    })
    // refresh_token is absent in some flows; store empty string as sentinel
    setTokens(access_token, refresh_token ?? '')

    return access_token
  }, [promptAsync, setUser, setTokens])

  return { signIn }
}
