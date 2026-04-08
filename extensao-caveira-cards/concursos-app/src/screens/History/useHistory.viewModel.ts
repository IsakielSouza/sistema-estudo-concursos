// src/screens/History/useHistory.viewModel.ts
import {
  useGetSessionHistoryQuery,
  useGetWeeklySessionsQuery,
  useGetCycleComplianceQuery,
} from '@/shared/queries/sessions/use-get-history.query'
import { formatSecondsToHHMM } from '@/shared/helpers/time.helper'

export const useHistoryViewModel = () => {
  const { data: sessionsByDate = [], isLoading: loadingSessions } =
    useGetSessionHistoryQuery()
  const { data: sessionsByWeek = [], isLoading: loadingWeekly } =
    useGetWeeklySessionsQuery()
  const { data: cycleStats = [], isLoading: loadingCycles } =
    useGetCycleComplianceQuery()

  const totalStudiedSeconds = sessionsByDate.reduce(
    (acc, day) => acc + day.totalSeconds,
    0
  )

  return {
    sessionsByDate,
    sessionsByWeek,
    cycleStats,
    totalStudiedFormatted: formatSecondsToHHMM(totalStudiedSeconds),
    isLoading: loadingSessions || loadingWeekly || loadingCycles,
  }
}
