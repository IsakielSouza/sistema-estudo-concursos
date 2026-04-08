import { TimerService } from '@/shared/services/timer.service'
import { useCallback } from 'react'

export function useBackgroundTask() {
  const startBackgroundTimer = useCallback(async (subjectName: string) => {
    const hasPermission = await TimerService.requestPermissions()
    if (!hasPermission) return

    await TimerService.showTimerNotification(subjectName, 0)
  }, [])

  const stopBackgroundTimer = useCallback(async () => {
    await TimerService.dismissTimerNotification()
  }, [])

  return { startBackgroundTimer, stopBackgroundTimer }
}
