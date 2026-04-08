# Phase 6: Session & Timer Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Session screen with wall-clock timer (foreground + background + lock screen), auto-completion when timer reaches 0, manual early exit with confirmation, and session persistence to SQLite.

**Architecture:** `useTimer` hook computes elapsed from wall-clock diff (`Date.now() - start - paused`). `expo-task-manager` updates lock-screen notification. `expo-notifications` shows persistent notification with play/pause. Auto-complete triggers haptic + animation then saves session. MVVM pattern.

**Tech Stack:** expo-task-manager, expo-notifications, expo-haptics, Reanimated 3, Zustand session.store, TanStack Query

**Spec:** `docs/superpowers/specs/2026-03-21-sistema-estudo-concursos-design.md` — Seção 6 (/session screen) e Seção 9 (Timer)

**Requires:** Phases 1–5 complete

---

## Task 26: useTimer Hook

**Files:**
- Create: `src/shared/hooks/useTimer.ts`

- [ ] **Step 1: Create useTimer.ts**

```typescript
// src/shared/hooks/useTimer.ts
import { useSessionStore } from '@/shared/stores/session.store'
import { useCallback, useEffect, useRef, useState } from 'react'

interface UseTimerReturn {
  elapsedSeconds: number
  remainingSeconds: number
  isRunning: boolean
  play: () => void
  pause: () => void
  reset: () => void
}

/**
 * Wall-clock timer: computes elapsed as Date.now() - start - paused_total.
 * Accurate even when app is in background or device is locked.
 */
export function useTimer(allocatedSeconds: number): UseTimerReturn {
  const { sessionStartTimestamp, pausedAt, pausedTotalMs, isRunning, pause, resume } =
    useSessionStore()

  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const tickRef = useRef<NodeJS.Timeout | null>(null)

  const computeElapsed = useCallback((): number => {
    if (!sessionStartTimestamp) return 0
    const now = Date.now()
    const activePausedMs = !isRunning && pausedAt ? now - pausedAt : 0
    const totalElapsedMs = now - sessionStartTimestamp - pausedTotalMs - activePausedMs
    return Math.max(0, Math.floor(totalElapsedMs / 1000))
  }, [sessionStartTimestamp, pausedTotalMs, pausedAt, isRunning])

  useEffect(() => {
    if (isRunning) {
      tickRef.current = setInterval(() => {
        setElapsedSeconds(computeElapsed())
      }, 500) // update every 500ms for smooth display
    } else {
      if (tickRef.current) clearInterval(tickRef.current)
      setElapsedSeconds(computeElapsed())
    }

    return () => {
      if (tickRef.current) clearInterval(tickRef.current)
    }
  }, [isRunning, computeElapsed])

  const remainingSeconds = Math.max(0, allocatedSeconds - elapsedSeconds)

  return {
    elapsedSeconds,
    remainingSeconds,
    isRunning,
    play: resume,
    pause,
    reset: () => setElapsedSeconds(0),
  }
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add concursos-app/src/shared/hooks/useTimer.ts
git commit -m "feat: add wall-clock useTimer hook with pause/resume accuracy"
```

---

## Task 27: Background Task + Lock Screen Notification

**Files:**
- Create: `src/shared/hooks/useBackgroundTask.ts`
- Create: `src/shared/services/timer.service.ts`

- [ ] **Step 1: Configure notification permissions in app.json**

Add to `expo` section of `app.json`:
```json
{
  "plugins": [
    ["expo-notifications", {
      "icon": "./assets/icon.png",
      "color": "#4F6CF7"
    }]
  ]
}
```

- [ ] **Step 2: Create timer.service.ts**

```typescript
// src/shared/services/timer.service.ts
import * as Notifications from 'expo-notifications'
import * as TaskManager from 'expo-task-manager'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const TIMER_TASK_NAME = 'STUDY_TIMER_TASK'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
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
      trigger: null, // show immediately
    })
  },

  async dismissTimerNotification(): Promise<void> {
    await Notifications.dismissNotificationAsync('study-timer')
  },
}

// Background task: reads timestamp from AsyncStorage, updates notification
TaskManager.defineTask(TIMER_TASK_NAME, async () => {
  try {
    const data = await AsyncStorage.multiGet([
      '@concursos:session',
    ])
    const sessionState = JSON.parse(data[0][1] ?? '{}')?.state
    if (!sessionState?.sessionStartTimestamp || !sessionState?.isRunning) return

    const elapsedMs =
      Date.now() - sessionState.sessionStartTimestamp - (sessionState.pausedTotalMs ?? 0)
    const elapsedSeconds = Math.max(0, Math.floor(elapsedMs / 1000))

    await TimerService.showTimerNotification('Sessão de Estudos', elapsedSeconds)
  } catch {}
})
```

- [ ] **Step 3: Create useBackgroundTask.ts**

```typescript
// src/shared/hooks/useBackgroundTask.ts
import * as TaskManager from 'expo-task-manager'
import { TimerService, TIMER_TASK_NAME } from '@/shared/services/timer.service'
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
```

- [ ] **Step 4: Commit**

```bash
git add concursos-app/src/shared/services/timer.service.ts concursos-app/src/shared/hooks/useBackgroundTask.ts
git commit -m "feat: add background timer task and lock-screen notification support"
```

---

## Task 28: Save Session Mutation

**Files:**
- Create: `src/shared/queries/sessions/use-save-session.mutation.ts`
- Create: `src/shared/queries/cycles/use-update-planned-session.mutation.ts`

- [ ] **Step 1: Create use-save-session.mutation.ts**

```typescript
// src/shared/queries/sessions/use-save-session.mutation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { SessionRepository } from '@/shared/database/repositories/session.repository'
import { CycleRepository } from '@/shared/database/repositories/cycle.repository'
import { PlannedSessionRepository } from '@/shared/database/repositories/planned-session.repository'
import { SyncService } from '@/shared/services/sync.service'
import { BackupService } from '@/shared/services/backup.service'
import { useAuthStore } from '@/shared/stores/auth.store'
import { useSettingsStore } from '@/shared/stores/settings.store'

interface SaveSessionInput {
  plannedSessionId: string
  cycleSubjectId: string
  subjectId: string
  startedAt: string
  studySeconds: number
  reviewSeconds: number
  pausedSeconds: number
}

export function useSaveSessionMutation() {
  const queryClient = useQueryClient()
  const spreadsheetId = useAuthStore((s) => s.spreadsheetId)
  const autoBackupEnabled = useSettingsStore((s) => s.autoBackupEnabled)

  return useMutation({
    mutationFn: async (input: SaveSessionInput) => {
      const endedAt = new Date().toISOString()
      const studyHours = input.studySeconds / 3600

      // 1. Save study_session
      await SessionRepository.create({
        ...input,
        endedAt,
        reviewSeconds: input.reviewSeconds,
        pausedSeconds: input.pausedSeconds,
      })

      // 2. Update cycle_subjects.completed_hours
      await CycleRepository.incrementCycleSubjectHours(input.cycleSubjectId, studyHours)

      // 3. Mark planned_session as done
      await PlannedSessionRepository.updateStatus(input.plannedSessionId, 'done')

      // 4. Write dirty topics back to Sheets
      if (spreadsheetId) {
        await SyncService.writeDirtyTopics(spreadsheetId, input.subjectId)
      }

      // 5. Auto backup if enabled
      if (autoBackupEnabled) {
        await BackupService.backup().catch(() => {}) // non-blocking
      }

      return { endedAt }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planned-sessions'] })
      queryClient.invalidateQueries({ queryKey: ['cycle-subjects'] })
    },
  })
}
```

- [ ] **Step 2: Create use-update-planned-session.mutation.ts**

```typescript
// src/shared/queries/cycles/use-update-planned-session.mutation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PlannedSessionRepository } from '@/shared/database/repositories/planned-session.repository'
import type { PlannedSession } from '@/shared/interfaces/cycle'

export function useUpdatePlannedSessionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: PlannedSession['status'] }) =>
      PlannedSessionRepository.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planned-sessions'] })
    },
  })
}
```

- [ ] **Step 3: Commit**

```bash
git add concursos-app/src/shared/queries/sessions/ concursos-app/src/shared/queries/cycles/use-update-planned-session.mutation.ts
git commit -m "feat: add save-session and update-planned-session mutations"
```

---

## Task 29: Session Screen MVVM

**Files:**
- Modify: `src/screens/Session/useSession.viewModel.ts`
- Modify: `src/screens/Session/Session.view.tsx`

- [ ] **Step 1: Create useSession.viewModel.ts**

```typescript
// src/screens/Session/useSession.viewModel.ts
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

export const useSessionViewModel = () => {
  const { plannedSessionId } = useLocalSearchParams<{ plannedSessionId: string }>()
  const { startSession, clearSession, includeReview, setIncludeReview, sessionStartTimestamp } =
    useSessionStore()
  const { startBackgroundTimer, stopBackgroundTimer } = useBackgroundTask()
  const saveSessionMutation = useSaveSessionMutation()
  const [showExitModal, setShowExitModal] = useState(false)
  const startedAt = useRef(new Date().toISOString())
  const autoCompleted = useRef(false)

  // Load planned session + subject
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

  // Start session on mount
  useEffect(() => {
    if (plannedSession && !sessionStartTimestamp) {
      startSession(plannedSession.id, plannedSession.cycleSubjectId)
      startBackgroundTimer(subject?.name ?? 'Sessão')
    }
  }, [plannedSession, subject]) // eslint-disable-line

  // Auto-complete when remainingSeconds hits 0
  useEffect(() => {
    if (remainingSeconds === 0 && elapsedSeconds > 0 && !autoCompleted.current) {
      autoCompleted.current = true
      handleAutoComplete()
    }
  }, [remainingSeconds, elapsedSeconds]) // eslint-disable-line

  const handleAutoComplete = useCallback(async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    await stopBackgroundTimer()
    await saveSessionMutation.mutateAsync({
      plannedSessionId: plannedSession!.id,
      cycleSubjectId: plannedSession!.cycleSubjectId,
      subjectId: plannedSession!.subjectId,
      startedAt: startedAt.current,
      studySeconds: allocatedSeconds - reviewSeconds,
      reviewSeconds,
      pausedSeconds: 0,
    })
    clearSession()
    router.back()
  }, [plannedSession, allocatedSeconds, reviewSeconds]) // eslint-disable-line

  const handleEarlyExit = useCallback(async () => {
    pause()
    setShowExitModal(true)
  }, [pause])

  const confirmExit = useCallback(async () => {
    await stopBackgroundTimer()
    await saveSessionMutation.mutateAsync({
      plannedSessionId: plannedSession!.id,
      cycleSubjectId: plannedSession!.cycleSubjectId,
      subjectId: plannedSession!.subjectId,
      startedAt: startedAt.current,
      studySeconds: Math.max(0, elapsedSeconds - reviewSeconds),
      reviewSeconds: Math.min(reviewSeconds, elapsedSeconds),
      pausedSeconds: 0,
    })
    clearSession()
    router.back()
  }, [elapsedSeconds, reviewSeconds, plannedSession]) // eslint-disable-line

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
```

- [ ] **Step 2: Create Session.view.tsx**

```typescript
// src/screens/Session/Session.view.tsx
import { colors } from '@/constants/colors'
import { Ionicons } from '@expo/vector-icons'
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSessionViewModel } from './useSession.viewModel'

function formatSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':')
}

export const SessionView = () => {
  const {
    subject, plannedSession, elapsedSeconds, remainingSeconds, allocatedSeconds,
    reviewSeconds, isRunning, includeReview, showExitModal, isSaving,
    play, pause, setIncludeReview, handleEarlyExit, confirmExit, cancelExit,
  } = useSessionViewModel()

  if (!plannedSession || !subject) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={colors.brand.primary} />
      </SafeAreaView>
    )
  }

  const progressRatio = allocatedSeconds > 0 ? elapsedSeconds / allocatedSeconds : 0

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleEarlyExit}>
          <Ionicons name="close" size={24} color={colors.grayscale.gray400} />
        </TouchableOpacity>
        <Text style={styles.subjectName} numberOfLines={1}>{subject.name}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Timer */}
      <View style={styles.timerContainer}>
        <Text style={styles.elapsed}>{formatSeconds(elapsedSeconds)}</Text>
        <Text style={styles.remaining}>Restam {formatSeconds(remainingSeconds)}</Text>
        <Text style={styles.goal}>Meta: {formatSeconds(allocatedSeconds)}</Text>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.min(100, progressRatio * 100)}%` }]} />
        </View>

        {includeReview && (
          <Text style={styles.reviewInfo}>
            Revisão: {formatSeconds(reviewSeconds)} incluída
          </Text>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {/* Review toggle */}
        <TouchableOpacity
          style={[styles.toggleButton, includeReview && styles.toggleActive]}
          onPress={() => setIncludeReview(!includeReview)}
        >
          <Ionicons name="refresh" size={16} color={includeReview ? colors.grayscale.gray100 : colors.grayscale.gray500} />
          <Text style={[styles.toggleText, includeReview && styles.toggleTextActive]}>
            Revisão (1/3)
          </Text>
        </TouchableOpacity>

        {/* Play/Pause */}
        <TouchableOpacity
          style={styles.playPauseButton}
          onPress={isRunning ? pause : play}
        >
          <Ionicons
            name={isRunning ? 'pause' : 'play'}
            size={32}
            color={colors.grayscale.gray100}
          />
        </TouchableOpacity>
      </View>

      {/* Early exit modal */}
      <Modal visible={showExitModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Encerrar sessão?</Text>
            <Text style={styles.modalBody}>
              Progresso ({formatSeconds(elapsedSeconds)}) será salvo.
            </Text>
            <TouchableOpacity style={styles.confirmButton} onPress={confirmExit} disabled={isSaving}>
              {isSaving
                ? <ActivityIndicator color={colors.grayscale.gray100} />
                : <Text style={styles.confirmText}>Encerrar e salvar</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={cancelExit}>
              <Text style={styles.cancelText}>Continuar estudando</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  subjectName: { fontSize: 18, color: colors.grayscale.gray100, fontWeight: '600', flex: 1, textAlign: 'center' },
  timerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  elapsed: { fontSize: 72, color: colors.grayscale.gray100, fontFamily: 'Baloo2_800ExtraBold', letterSpacing: -2 },
  remaining: { fontSize: 18, color: colors.grayscale.gray400, marginTop: 8 },
  goal: { fontSize: 14, color: colors.grayscale.gray600, marginTop: 4 },
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: colors.background.elevated,
    borderRadius: 3,
    marginTop: 32,
    overflow: 'hidden',
  },
  progressFill: { height: 6, backgroundColor: colors.brand.primary, borderRadius: 3 },
  reviewInfo: { fontSize: 13, color: colors.status.warning, marginTop: 12 },
  controls: { paddingHorizontal: 40, paddingBottom: 48, gap: 24, alignItems: 'center' },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.grayscale.gray700,
  },
  toggleActive: { borderColor: colors.brand.primary, backgroundColor: colors.brand.primary + '22' },
  toggleText: { fontSize: 14, color: colors.grayscale.gray500 },
  toggleTextActive: { color: colors.grayscale.gray100 },
  playPauseButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: { flex: 1, backgroundColor: '#000000AA', alignItems: 'center', justifyContent: 'center' },
  modalCard: {
    backgroundColor: colors.background.card,
    borderRadius: 16,
    padding: 24,
    width: '85%',
    gap: 12,
  },
  modalTitle: { fontSize: 20, color: colors.grayscale.gray100, fontWeight: '700', textAlign: 'center' },
  modalBody: { fontSize: 14, color: colors.grayscale.gray400, textAlign: 'center' },
  confirmButton: {
    backgroundColor: colors.brand.primary,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  confirmText: { color: colors.grayscale.gray100, fontWeight: '700' },
  cancelButton: { padding: 14, alignItems: 'center' },
  cancelText: { color: colors.grayscale.gray400 },
})
```

- [ ] **Step 3: Manual test — full session flow**

1. From Cycle tab, tap ▷ on a session → Session screen opens
2. Timer starts from 00:00:00, counts up
3. "Restam X:XX:XX" counts down
4. Tap ⏸ → timer pauses, elapsed preserved accurately
5. Tap ▶ → timer resumes
6. Tap ✕ → exit modal appears
7. Tap "Encerrar e salvar" → returns to Cycle, session marked as done (checkmark)
8. Lock device → check notification shows "Estudando: [Matéria] — 00:MM:SS"

- [ ] **Step 4: Commit**

```bash
git add concursos-app/src/screens/Session/
git commit -m "feat: implement Session screen with wall-clock timer, auto-complete, and lock-screen notification"
```

---

## Phase 6 Complete

At this point you have:
- ✅ `useTimer` hook — wall-clock accuracy, pause-aware
- ✅ Background notification via `expo-task-manager` + `expo-notifications`
- ✅ Lock screen persistent notification with elapsed time
- ✅ Session screen: timer display, progress bar, play/pause
- ✅ Auto-complete at 0:00:00 with haptic feedback
- ✅ Early exit with confirmation modal
- ✅ Session saved to SQLite, cycle_subjects updated, planned_session marked done

**Next:** `docs/superpowers/plans/2026-03-21-phase-7-subjects.md`
