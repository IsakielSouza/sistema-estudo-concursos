// src/screens/Home/useHome.viewModel.ts
import { useGetPlannedSessionsQuery } from '@/shared/queries/cycles/use-get-planned-sessions.query'
import { useGetCycleSubjectsQuery } from '@/shared/queries/subjects/use-get-cycle-subjects.query'
import { useRegisterManualSessionMutation } from '@/shared/queries/cycles/use-register-manual-session.mutation'
import { useUndoSessionMutation } from '@/shared/queries/cycles/use-undo-session.mutation'
import { PlannedSessionRepository } from '@/shared/database/repositories/planned-session.repository'
import { SessionRepository } from '@/shared/database/repositories/session.repository'
import { useCycleStore } from '@/shared/stores/cycle.store'
import { useAuthStore } from '@/shared/stores/auth.store'
import { router } from 'expo-router'
import { Alert } from 'react-native'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type BottomSheet from '@gorhom/bottom-sheet'
import type { PlannedSession } from '@/shared/interfaces/cycle'

const SUBJECT_COLORS = [
  '#4F6CF7', '#FF9800', '#9C27B0', '#00BCD4', '#F44336', '#4CAF50',
  '#FF5722', '#3F51B5', '#009688', '#FFC107', '#E91E63', '#607D8B',
]

function formatSeconds(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export const useHomeViewModel = () => {
  const queryClient = useQueryClient()
  const activeCycleId = useCycleStore((s) => s.activeCycleId)
  const user = useAuthStore((s) => s.user)

  const { data: plannedSessions = [], isLoading } = useGetPlannedSessionsQuery()
  const { data: cycleSubjects = [] } = useGetCycleSubjectsQuery()

  const { mutate: registerManual, isPending: isRegisteringManual } = useRegisterManualSessionMutation()
  const { mutate: undo } = useUndoSessionMutation()

  const bottomSheetRef = useRef<BottomSheet>(null)
  const [modalSession, setModalSession] = useState<PlannedSession | null>(null)

  // Elapsed timer for in_progress session
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [inProgressStartedAt, setInProgressStartedAt] = useState<string | null>(null)

  const inProgressSession = useMemo(
    () => plannedSessions.find((s) => s.status === 'in_progress') ?? null,
    [plannedSessions]
  )

  // Fetch started_at from study_sessions when there's an in_progress session
  useEffect(() => {
    if (!inProgressSession) {
      setInProgressStartedAt(null)
      setElapsedSeconds(0)
      return
    }
    let cancelled = false
    SessionRepository.getInProgressByPlannedSession(inProgressSession.id).then((ss) => {
      if (!cancelled) setInProgressStartedAt(ss?.startedAt ?? null)
    })
    return () => { cancelled = true }
  }, [inProgressSession?.id])

  // Tick every second when in_progress
  useEffect(() => {
    if (!inProgressStartedAt) return
    const tick = () => {
      const elapsed = (Date.now() - new Date(inProgressStartedAt).getTime()) / 1000
      setElapsedSeconds(Math.floor(elapsed))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [inProgressStartedAt])

  // Stable color map (cycleSubjects already ORDER BY id ASC from repository)
  const subjectColorMap = useMemo(
    () => new Map(cycleSubjects.map((cs, idx) => [cs.subjectId, SUBJECT_COLORS[idx % SUBJECT_COLORS.length]])),
    [cycleSubjects]
  )

  const subjectNameMap = useMemo(
    () => new Map(cycleSubjects.map((cs) => [cs.subjectId, cs.subject.name])),
    [cycleSubjects]
  )

  // Circle center state
  const nextPending = useMemo(
    () => plannedSessions.find((s) => s.status === 'pending') ?? null,
    [plannedSessions]
  )

  const centerState: 'no_cycle' | 'all_done' | 'in_progress' | 'next_pending' = useMemo(() => {
    if (!activeCycleId) return 'no_cycle'
    if (inProgressSession) return 'in_progress'
    if (!nextPending && plannedSessions.length > 0) return 'all_done'
    if (nextPending) return 'next_pending'
    return 'no_cycle'
  }, [activeCycleId, inProgressSession, nextPending, plannedSessions.length])

  const centerSubjectName = useMemo(() => {
    if (centerState === 'in_progress' && inProgressSession) {
      return subjectNameMap.get(inProgressSession.subjectId) ?? ''
    }
    if (centerState === 'next_pending' && nextPending) {
      return subjectNameMap.get(nextPending.subjectId) ?? ''
    }
    return ''
  }, [centerState, inProgressSession, nextPending, subjectNameMap])

  const centerTimeLabel = useMemo(() => {
    if (centerState === 'in_progress') return formatSeconds(elapsedSeconds)
    if (centerState === 'next_pending' && nextPending) return formatSeconds(nextPending.allocatedSeconds)
    return ''
  }, [centerState, elapsedSeconds, nextPending])

  const handlePlaySession = useCallback(async (plannedSessionId: string) => {
    try {
      await PlannedSessionRepository.updateStatus(plannedSessionId, 'in_progress')
      queryClient.invalidateQueries({ queryKey: ['planned-sessions'] })
      router.push({ pathname: '/(private)/session', params: { plannedSessionId } })
    } catch (e) {
      Alert.alert('Erro ao iniciar sessão', e instanceof Error ? e.message : 'Tente novamente.')
    }
  }, [queryClient])

  const handleContinueSession = useCallback(() => {
    if (!inProgressSession) return
    router.push({ pathname: '/(private)/session', params: { plannedSessionId: inProgressSession.id } })
  }, [inProgressSession])

  const handleRegisterManual = useCallback((plannedSessionId: string, minutes: number) => {
    registerManual(
      { plannedSessionId, minutes },
      { onSuccess: () => setModalSession(null) }
    )
  }, [registerManual])

  const handleUndoSession = useCallback((plannedSessionId: string) => {
    undo({ plannedSessionId })
  }, [undo])

  const handleOpenModal = useCallback((session: PlannedSession) => {
    setModalSession(session)
  }, [])

  const handleCloseModal = useCallback(() => {
    setModalSession(null)
  }, [])

  const handleOpenNewCycle = useCallback(() => {
    bottomSheetRef.current?.expand()
  }, [])

  return {
    isLoading,
    activeCycleId,
    user,
    plannedSessions,
    subjectColorMap,
    subjectNameMap,
    centerState,
    centerSubjectName,
    centerTimeLabel,
    inProgressSessionId: inProgressSession?.id ?? null,
    inProgressElapsedSeconds: elapsedSeconds,
    modalSession,
    modalSubjectName: modalSession ? (subjectNameMap.get(modalSession.subjectId) ?? '') : '',
    isRegisteringManual,
    bottomSheetRef,
    handlePlaySession,
    handleContinueSession,
    handleRegisterManual,
    handleUndoSession,
    handleOpenModal,
    handleCloseModal,
    handleOpenNewCycle,
  }
}
