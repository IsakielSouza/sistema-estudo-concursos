// src/shared/stores/auth.store.ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface AuthUser {
  id: string
  name: string
  email: string
  photoUrl: string | null
}

interface AuthStore {
  user: AuthUser | null
  spreadsheetId: string | null
  googleAccessToken: string | null
  googleRefreshToken: string | null
  setUser: (user: AuthUser) => void
  setTokens: (access: string, refresh: string) => void
  setSpreadsheetId: (id: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      spreadsheetId: null,
      googleAccessToken: null,
      googleRefreshToken: null,
      setUser: (user) => set({ user }),
      setTokens: (googleAccessToken, googleRefreshToken) =>
        set({ googleAccessToken, googleRefreshToken }),
      setSpreadsheetId: (spreadsheetId) => set({ spreadsheetId }),
      logout: () =>
        set({
          user: null,
          spreadsheetId: null,
          googleAccessToken: null,
          googleRefreshToken: null,
        }),
    }),
    {
      name: '@concursos:auth',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
