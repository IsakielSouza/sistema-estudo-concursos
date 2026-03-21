import axios from 'axios'
import { useAuthStore } from '@/shared/stores/auth.store'

const BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets'

export const sheetsClient = axios.create({ baseURL: BASE_URL })

sheetsClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().googleAccessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
