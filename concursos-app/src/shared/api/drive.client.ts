import axios from 'axios'
import { useAuthStore } from '@/shared/stores/auth.store'

export const driveClient = axios.create({
  baseURL: 'https://www.googleapis.com',
})

driveClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().googleAccessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
