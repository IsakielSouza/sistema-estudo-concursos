import { useTimer } from '@/shared/hooks/useTimer'
import { useBackgroundTask } from '@/shared/hooks/useBackgroundTask'
import { useSaveSessionMutation } from '@/shared/queries/sessions/use-save-session.mutation'
import { PlannedSessionRepository } from '@/shared/database/repositories/planned-session.repository'
import { SubjectRepository } from '@/shared/database/repositories/subject.repository'
import { useSessionStore } from '@/shared/stores/session.store'
import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams, router } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import * as Haptics from 'expo-haptics'
import { Alert } from 'react-native'

export const useSessionViewModel = () => {
  const { plannedSessionId } = useLocalSearchParams<{ plannedSessionId: string }>()
  const { startSession, clearSession, includeReview, setIncludeReview, sessionStartTimestamp, pausedTotalMs } =
    useSessionStore()
  const { startBackgroundTimer, stopBackgroundTimer } = useBackgroundTask()
  const saveSessionMutation = useSaveSessionMutation()
  const [showExitModal, setShowExitModal] = useState(false)
  const autoCompleted = useRef(false)

  const { data: plannedSession } = useQuery({
    queryKey: ['planned-session', plannedSessionId],
    queryFn: () => PlannedSessionRepository.getById(plannedSessionId!),
    enabled: !!plannedSessionId,
  })

  const { data: subject } = useQuery({
    queryKey: ['subject', plannedSession?.subjectId],
    queryFn: () => SubjectRepository.getSubjectById(plannedSession!.subjectId),
    enabled: !!plannedSession?.subjectId,
  })

  const allocatedSeconds = plannedSession?.allocatedSeconds ?? 0
  const reviewSeconds = includeReview ? Math.round(allocatedSeconds / 3) : 0

  const { elapsedSeconds, remainingSeconds, isRunning, play, pause } =
    useTimer(allocatedSeconds)

  useEffect(() => {
    if (plannedSession && !sessionStartTimestamp) {
      startSession(plannedSession.id, plannedSession.cycleSubjectId)
      startBackgroundTimer(subject?.name ?? 'Sessão')
    }
  }, [plannedSession, subject]) // eslint-disable-line

  useEffect(() => {
    if (remainingSeconds === 0 && elapsedSeconds > 0 && !autoCompleted.current) {
      autoCompleted.current = true
      handleAutoComplete()
    }
  }, [remainingSeconds, elapsedSeconds]) // eslint-disable-line

  const handleAutoComplete = useCallback(async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      await stopBackgroundTimer()
      await saveSessionMutation.mutateAsync({
        plannedSessionId: plannedSession!.id,
        cycleSubjectId: plannedSession!.cycleSubjectId,
        subjectId: plannedSession!.subjectId,
        startedAt: sessionStartTimestamp ? new Date(sessionStartTimestamp).toISOString() : new Date().toISOString(),
        studySeconds: allocatedSeconds - reviewSeconds,
        reviewSeconds,
        pausedSeconds: Math.round(pausedTotalMs / 1000),
      })
      clearSession()
      router.back()
    } catch (e) {
      autoCompleted.current = false // allow retry
      Alert.alert('Erro ao salvar sessão', e instanceof Error ? e.message : 'Tente novamente.')
    }
  }, [plannedSession, allocatedSeconds, reviewSeconds, stopBackgroundTimer, saveSessionMutation, clearSession, sessionStartTimestamp, pausedTotalMs]) // eslint-disable-line

  const handleEarlyExit = useCallback(async () => {
    pause()
    setShowExitModal(true)
  }, [pause])

  const confirmExit = useCallback(async () => {
    try {
      await stopBackgroundTimer()
      await saveSessionMutation.mutateAsync({
        plannedSessionId: plannedSession!.id,
        cycleSubjectId: plannedSession!.cycleSubjectId,
        subjectId: plannedSession!.subjectId,
        startedAt: sessionStartTimestamp ? new Date(sessionStartTimestamp).toISOString() : new Date().toISOString(),
        studySeconds: Math.max(0, elapsedSeconds - reviewSeconds),
        reviewSeconds: Math.min(reviewSeconds, elapsedSeconds),
        pausedSeconds: Math.round(pausedTotalMs / 1000),
      })
      clearSession()
      router.back()
    } catch (e) {
      Alert.alert('Erro ao salvar sessão', e instanceof Error ? e.message : 'Tente novamente.')
    }
  }, [elapsedSeconds, reviewSeconds, plannedSession, stopBackgroundTimer, saveSessionMutation, clearSession, sessionStartTimestamp, pausedTotalMs]) // eslint-disable-line

  return {
    subject,
    plannedSession,
    elapsedSeconds,
    remainingSeconds,
    allocatedSeconds,
    reviewSeconds,
    isRunning,
    includeReview,
    showExitModal,
    isSaving: saveSessionMutation.isPending,
    play,
    pause,
    setIncludeReview,
    handleEarlyExit,
    confirmExit,
    cancelExit: () => { setShowExitModal(false); play() },
  }
}
