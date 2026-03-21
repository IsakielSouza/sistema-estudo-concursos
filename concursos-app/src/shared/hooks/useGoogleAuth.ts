// src/shared/hooks/useGoogleAuth.ts
import {
  makeRedirectUri,
  useAuthRequest,
  useAutoDiscovery,
} from 'expo-auth-session'
import * as WebBrowser from 'expo-web-browser'
import { useCallback } from 'react'
import { useAuthStore } from '@/shared/stores/auth.store'

WebBrowser.maybeCompleteAuthSession()

const GOOGLE_CLIENT_ID_IOS = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS ?? ''
const GOOGLE_CLIENT_ID_ANDROID =
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID ?? ''

export function useGoogleAuth() {
  const { setUser, setTokens } = useAuthStore()

  const discovery = useAutoDiscovery('https://accounts.google.com')

  const redirectUri = makeRedirectUri({ scheme: 'concursos-app' })

  const [, , promptAsync] = useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID_IOS,
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
    const userInfo = await userRes.json()

    setUser({
      id: userInfo.sub as string,
      name: userInfo.name as string,
      email: userInfo.email as string,
      photoUrl: (userInfo.picture as string) ?? null,
    })
    setTokens(access_token as string, (refresh_token as string) ?? '')

    return access_token as string
  }, [promptAsync, setUser, setTokens])

  return { signIn }
}
