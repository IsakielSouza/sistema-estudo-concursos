import axios from 'axios'
import { GoogleSignin } from '@react-native-google-signin/google-signin'
import { useAuthStore } from '@/shared/stores/auth.store'

const BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets'

export const sheetsClient = axios.create({ baseURL: BASE_URL })

sheetsClient.interceptors.request.use(async (config) => {
  try {
    const { accessToken } = await GoogleSignin.getTokens()
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  } catch {
    const token = useAuthStore.getState().googleAccessToken
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
