import axios from 'axios'
import { GoogleSignin } from '@react-native-google-signin/google-signin'
import { useAuthStore } from '@/shared/stores/auth.store'

export const driveClient = axios.create({
  baseURL: 'https://www.googleapis.com',
})

driveClient.interceptors.request.use(async (config) => {
  try {
    const { accessToken } = await GoogleSignin.getTokens()
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  } catch {
    const token = useAuthStore.getState().googleAccessToken
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
