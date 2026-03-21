import { useGetPlannedSessionsQuery } from '@/shared/queries/cycles/use-get-planned-sessions.query'
import { useGetCycleSubjectsQuery } from '@/shared/queries/subjects/use-get-cycle-subjects.query'
import { PlannedSessionRepository } from '@/shared/database/repositories/planned-session.repository'
import { useCycleStore } from '@/shared/stores/cycle.store'
import { router } from 'expo-router'
import { Alert } from 'react-native'
import { useCallback, useRef } from 'react'
import type BottomSheet from '@gorhom/bottom-sheet'
import { useQueryClient } from '@tanstack/react-query'

export const useCycleViewModel = () => {
  const { data: plannedSessions = [], isLoading } = useGetPlannedSessionsQuery()
  const { data: cycleSubjects = [] } = useGetCycleSubjectsQuery()
  const activeCycleId = useCycleStore((s) => s.activeCycleId)
  const bottomSheetRef = useRef<BottomSheet>(null)
  const queryClient = useQueryClient()

  const totalSessions = plannedSessions.length
  const doneSessions = plannedSessions.filter((s) => s.status === 'done').length

  const totalAllocatedHours = cycleSubjects.reduce((sum, cs) => sum + cs.allocatedHours, 0)
  const totalCompletedHours = cycleSubjects.reduce((sum, cs) => sum + cs.completedHours, 0)

  const handlePlaySession = useCallback(
    async (plannedSessionId: string) => {
      try {
        await PlannedSessionRepository.updateStatus(plannedSessionId, 'in_progress')
        queryClient.invalidateQueries({ queryKey: ['planned-sessions'] })
        router.push({ pathname: '/(private)/session', params: { plannedSessionId } })
      } catch (e) {
        Alert.alert('Erro ao iniciar sessão', e instanceof Error ? e.message : 'Tente novamente.')
      }
    },
    [queryClient]
  )

  const handleOpenNewCycle = useCallback(() => {
    bottomSheetRef.current?.expand()
  }, [])

  return {
    plannedSessions,
    cycleSubjects,
    isLoading,
    totalSessions,
    doneSessions,
    totalAllocatedHours,
    totalCompletedHours,
    activeCycleId,
    bottomSheetRef,
    handlePlaySession,
    handleOpenNewCycle,
  }
}
