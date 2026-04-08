import * as Notifications from 'expo-notifications'
import * as TaskManager from 'expo-task-manager'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const TIMER_TASK_NAME = 'STUDY_TIMER_TASK'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
})

export const TimerService = {
  async requestPermissions(): Promise<boolean> {
    const { status } = await Notifications.requestPermissionsAsync()
    return status === 'granted'
  },

  async showTimerNotification(
    subjectName: string,
    elapsedSeconds: number
  ): Promise<void> {
    const h = Math.floor(elapsedSeconds / 3600)
    const m = Math.floor((elapsedSeconds % 3600) / 60)
    const s = elapsedSeconds % 60
    const time = [h, m, s].map((v) => String(v).padStart(2, '0')).join(':')

    await Notifications.scheduleNotificationAsync({
      identifier: 'study-timer',
      content: {
        title: `Estudando: ${subjectName}`,
        body: `⏱ ${time}`,
        sticky: true,
        data: { type: 'timer' },
      },
      trigger: null,
    })
  },

  async dismissTimerNotification(): Promise<void> {
    await Notifications.dismissNotificationAsync('study-timer')
  },
}

TaskManager.defineTask(TIMER_TASK_NAME, async () => {
  try {
    const data = await AsyncStorage.multiGet(['@concursos:session'])
    const sessionState = JSON.parse(data[0][1] ?? '{}')?.state
    if (!sessionState?.sessionStartTimestamp || !sessionState?.isRunning) return

    const elapsedMs =
      Date.now() - sessionState.sessionStartTimestamp - (sessionState.pausedTotalMs ?? 0)
    const elapsedSeconds = Math.max(0, Math.floor(elapsedMs / 1000))

    await TimerService.showTimerNotification('Sessão de Estudos', elapsedSeconds)
  } catch {}
})
