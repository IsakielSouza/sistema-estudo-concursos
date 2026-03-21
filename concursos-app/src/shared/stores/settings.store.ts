// src/shared/stores/settings.store.ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface SettingsStore {
  autoBackupEnabled: boolean
  notificationsEnabled: boolean
  lastBackupAt: string | null
  setAutoBackup: (value: boolean) => void
  setNotificationsEnabled: (value: boolean) => void
  setLastBackupAt: (iso: string) => void
  reset: () => void
}

const initialState = {
  autoBackupEnabled: false,
  notificationsEnabled: true,
  lastBackupAt: null,
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...initialState,
      setAutoBackup: (autoBackupEnabled) => set({ autoBackupEnabled }),
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      setLastBackupAt: (lastBackupAt) => set({ lastBackupAt }),
      reset: () => set(initialState),
    }),
    {
      name: '@concursos:settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
