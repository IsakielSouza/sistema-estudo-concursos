# Phase 5: Cycle Management Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the full cycle management feature — hour allocation algorithm, session block splitting, cycle creation bottom sheet, and the Cycle screen with session list + resumo (matching the visual reference images).

**Architecture:** `cycle.service.ts` handles all business logic (allocation + block splitting). `use-create-cycle.mutation.ts` orchestrates persistence. `Cycle.view.tsx` renders the two-section layout: session list with play buttons + resumo aggregate. MVVM pattern throughout.

**Tech Stack:** expo-sqlite repositories, @gorhom/bottom-sheet, react-hook-form + yup, TanStack Query, Reanimated

**Spec:** `docs/superpowers/specs/2026-03-21-sistema-estudo-concursos-design.md` — Seções 7.1 (Algoritmo), 6 (/cycle screen), 4 (planned_sessions)

**Requires:** Phases 1–4 complete

---

## Task 22: Cycle Service (Allocation + Block Splitting)

**Files:**
- Create: `src/shared/services/cycle.service.ts`

- [ ] **Step 1: Create cycle.service.ts**

```typescript
// src/shared/services/cycle.service.ts
import type { Subject } from '@/shared/interfaces/subject'
import type { CycleSubject, PlannedSession } from '@/shared/interfaces/cycle'

export interface AllocationInput {
  plannedHours: number
  subjects: Subject[]
}

export interface AllocationResult {
  cycleSubjectAllocations: Array<{
    subjectId: string
    allocatedHours: number
  }>
  plannedSessions: Array<Omit<PlannedSession, 'id' | 'cycleSubjectId' | 'cycleId'> & {
    subjectId: string
  }>
}

const FREE_STUDY_BLOCK_SECONDS = 3600  // 1h blocks for Estudo Livre
const DEFAULT_BLOCK_SECONDS = 7200     // 2h blocks for all other subjects

export const CycleService = {
  /**
   * Step 1: Calculate allocated hours per subject.
   * Free study subject hours are taken from its existing allocation (default 3h).
   * Remaining hours distributed proportionally by effective_points.
   */
  allocateHours(input: AllocationInput): Array<{ subjectId: string; allocatedHours: number }> {
    const { plannedHours, subjects } = input

    const freeStudy = subjects.find((s) => s.isFreeStudy)
    const freeStudyHours = freeStudy ? 3 : 0 // default 3h for Estudo Livre
    const studyPool = Math.max(0, plannedHours - freeStudyHours)

    // Effective points per subject (excluding free study)
    const studySubjects = subjects.filter((s) => !s.isFreeStudy)
    const effectivePoints = studySubjects.map((s) => ({
      subjectId: s.id,
      points: s.cycleStatus === 'revision' ? s.points * 0.5 : s.points,
    }))

    const totalPoints = effectivePoints.reduce((sum, s) => sum + s.points, 0)

    const allocations: Array<{ subjectId: string; allocatedHours: number }> = []

    // Allocate for study subjects proportionally
    for (const ep of effectivePoints) {
      const hours = totalPoints > 0 ? (ep.points / totalPoints) * studyPool : 0
      allocations.push({ subjectId: ep.subjectId, allocatedHours: Number(hours.toFixed(4)) })
    }

    // Add free study allocation
    if (freeStudy) {
      allocations.push({ subjectId: freeStudy.id, allocatedHours: freeStudyHours })
    }

    return allocations
  },

  /**
   * Step 2: Split allocated hours into planned session blocks.
   * - Estudo Livre: blocks of 1h (3600s)
   * - All others: blocks of 2h (7200s)
   * - Last block = remainder (may be smaller)
   */
  splitIntoBlocks(
    subjectId: string,
    allocatedHours: number,
    isFreeStudy: boolean
  ): Array<{ subjectId: string; allocatedSeconds: number }> {
    const blockSize = isFreeStudy ? FREE_STUDY_BLOCK_SECONDS : DEFAULT_BLOCK_SECONDS
    const totalSeconds = Math.round(allocatedHours * 3600)
    const blocks: Array<{ subjectId: string; allocatedSeconds: number }> = []

    let remaining = totalSeconds
    while (remaining > 0) {
      const block = Math.min(remaining, blockSize)
      if (block >= 60) { // minimum 1 minute to avoid micro-blocks
        blocks.push({ subjectId, allocatedSeconds: block })
      }
      remaining -= block
    }

    return blocks
  },

  /**
   * Step 3: Interleave blocks from all subjects using round-robin.
   * Subject with most blocks goes first in each round.
   * Returns blocks with position assigned.
   */
  interleaveBlocks(
    allBlocks: Array<Array<{ subjectId: string; allocatedSeconds: number }>>
  ): Array<{ subjectId: string; allocatedSeconds: number; position: number }> {
    // Clone to avoid mutation
    const queues = allBlocks.map((blocks) => [...blocks])
    const result: Array<{ subjectId: string; allocatedSeconds: number; position: number }> = []
    let position = 0

    while (queues.some((q) => q.length > 0)) {
      // Sort queues by length descending, pick one block from each non-empty queue per round
      const sortedQueues = [...queues].sort((a, b) => b.length - a.length)
      for (const queue of sortedQueues) {
        if (queue.length > 0) {
          const block = queue.shift()!
          result.push({ ...block, position: position++ })
        }
      }
    }

    return result
  },

  /**
   * Full pipeline: input → allocations + interleaved planned sessions.
   */
  buildCycleData(input: AllocationInput): AllocationResult {
    const allocations = CycleService.allocateHours(input)
    const subjectMap = new Map(input.subjects.map((s) => [s.id, s]))

    const allBlockQueues = allocations.map(({ subjectId, allocatedHours }) => {
      const subject = subjectMap.get(subjectId)!
      return CycleService.splitIntoBlocks(subjectId, allocatedHours, subject.isFreeStudy)
    })

    const interleaved = CycleService.interleaveBlocks(allBlockQueues)

    return {
      cycleSubjectAllocations: allocations,
      plannedSessions: interleaved.map((b) => ({
        subjectId: b.subjectId,
        allocatedSeconds: b.allocatedSeconds,
        position: b.position,
        status: 'pending' as const,
      })),
    }
  },
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add concursos-app/src/shared/services/cycle.service.ts
git commit -m "feat: implement CycleService with hour allocation and round-robin block splitting"
```

---

## Task 23: Cycle Schema + Create Mutation

**Files:**
- Create: `src/shared/schemas/cycle.schema.ts`
- Create: `src/shared/queries/cycles/use-create-cycle.mutation.ts`
- Create: `src/shared/queries/cycles/use-get-planned-sessions.query.ts`
- Create: `src/shared/queries/subjects/use-get-cycle-subjects.query.ts`

- [ ] **Step 1: Create cycle.schema.ts**

```typescript
// src/shared/schemas/cycle.schema.ts
import * as yup from 'yup'

export const cycleSchema = yup.object({
  name: yup.string().required('Informe o nome do ciclo'),
  plannedHours: yup
    .number()
    .required('Informe as horas disponíveis')
    .min(1, 'Mínimo de 1 hora')
    .max(168, 'Máximo de 168 horas (semana inteira)'),
  selectedSubjectIds: yup
    .array(yup.string().required())
    .min(1, 'Selecione pelo menos uma matéria')
    .required(),
})

export type CycleFormData = yup.InferType<typeof cycleSchema>
```

- [ ] **Step 2: Create use-create-cycle.mutation.ts**

```typescript
// src/shared/queries/cycles/use-create-cycle.mutation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CycleService } from '@/shared/services/cycle.service'
import { CycleRepository } from '@/shared/database/repositories/cycle.repository'
import { PlannedSessionRepository } from '@/shared/database/repositories/planned-session.repository'
import { SubjectRepository } from '@/shared/database/repositories/subject.repository'
import { useAuthStore } from '@/shared/stores/auth.store'
import { useCycleStore } from '@/shared/stores/cycle.store'
import type { CycleFormData } from '@/shared/schemas/cycle.schema'

export function useCreateCycleMutation() {
  const queryClient = useQueryClient()
  const { setActiveCycle } = useCycleStore()
  const activeConcursoId = useCycleStore((s) => s.activeConcursoId)

  return useMutation({
    mutationFn: async (data: CycleFormData & { concursoId: string }) => {
      const { name, plannedHours, selectedSubjectIds, concursoId } = data

      // 1. Load selected subjects
      const allSubjects = await SubjectRepository.getSubjectsByConcurso(concursoId)
      const selectedSubjects = allSubjects.filter((s) =>
        selectedSubjectIds.includes(s.id) || s.isFreeStudy
      )

      // 2. Calculate allocation + planned sessions
      const { cycleSubjectAllocations, plannedSessions } =
        CycleService.buildCycleData({ plannedHours, subjects: selectedSubjects })

      // 3. Create cycle record
      const cycleNumber = await CycleRepository.getNextCycleNumber(concursoId)
      const cycle = await CycleRepository.createCycle({
        concursoId,
        name,
        cycleNumber,
        plannedHours,
        startedAt: new Date().toISOString(),
        status: 'active',
      })

      // 4. Create cycle_subjects
      const cycleSubjectMap = new Map<string, string>() // subjectId → cycleSubjectId
      for (const alloc of cycleSubjectAllocations) {
        const cs = await CycleRepository.createCycleSubject({
          cycleId: cycle.id,
          subjectId: alloc.subjectId,
          allocatedHours: alloc.allocatedHours,
        })
        cycleSubjectMap.set(alloc.subjectId, cs.id)
      }

      // 5. Create planned_sessions
      const sessionsToCreate = plannedSessions.map((s) => ({
        cycleSubjectId: cycleSubjectMap.get(s.subjectId)!,
        subjectId: s.subjectId,
        cycleId: cycle.id,
        position: s.position,
        allocatedSeconds: s.allocatedSeconds,
        status: 'pending' as const,
      }))
      await PlannedSessionRepository.createMany(sessionsToCreate)

      return cycle
    },
    onSuccess: (cycle) => {
      setActiveCycle(cycle.id, cycle.concursoId)
      queryClient.invalidateQueries({ queryKey: ['planned-sessions'] })
      queryClient.invalidateQueries({ queryKey: ['cycle-subjects'] })
    },
  })
}
```

- [ ] **Step 3: Create use-get-planned-sessions.query.ts**

```typescript
// src/shared/queries/cycles/use-get-planned-sessions.query.ts
import { useQuery } from '@tanstack/react-query'
import { PlannedSessionRepository } from '@/shared/database/repositories/planned-session.repository'
import { useCycleStore } from '@/shared/stores/cycle.store'

export function useGetPlannedSessionsQuery() {
  const activeCycleId = useCycleStore((s) => s.activeCycleId)

  return useQuery({
    queryKey: ['planned-sessions', activeCycleId],
    queryFn: () => PlannedSessionRepository.getByCycle(activeCycleId!),
    enabled: !!activeCycleId,
  })
}
```

- [ ] **Step 4: Create use-get-cycle-subjects.query.ts**

```typescript
// src/shared/queries/subjects/use-get-cycle-subjects.query.ts
import { useQuery } from '@tanstack/react-query'
import { CycleRepository } from '@/shared/database/repositories/cycle.repository'
import { SubjectRepository } from '@/shared/database/repositories/subject.repository'
import { useCycleStore } from '@/shared/stores/cycle.store'

export function useGetCycleSubjectsQuery() {
  const activeCycleId = useCycleStore((s) => s.activeCycleId)

  return useQuery({
    queryKey: ['cycle-subjects', activeCycleId],
    queryFn: async () => {
      const cycleSubjects = await CycleRepository.getCycleSubjects(activeCycleId!)
      const enriched = await Promise.all(
        cycleSubjects.map(async (cs) => {
          const subject = await SubjectRepository.getSubjectById(cs.subjectId)
          return { ...cs, subject: subject! }
        })
      )
      return enriched
    },
    enabled: !!activeCycleId,
  })
}
```

- [ ] **Step 5: Verify and commit**

```bash
npx tsc --noEmit
git add concursos-app/src/shared/schemas/cycle.schema.ts concursos-app/src/shared/queries/cycles/ concursos-app/src/shared/queries/subjects/use-get-cycle-subjects.query.ts
git commit -m "feat: add cycle schema, create-cycle mutation, and planned-sessions query"
```

---

## Task 24: Cycle Screen — Session List + Resumo

**Files:**
- Modify: `src/screens/Cycle/Cycle.view.tsx`
- Modify: `src/screens/Cycle/useCycle.viewModel.ts`
- Create: `src/screens/Cycle/components/SessionRow/SessionRow.view.tsx`
- Create: `src/screens/Cycle/components/SessionRow/useSessionRow.viewModel.ts`
- Create: `src/screens/Cycle/components/CycleResumo/CycleResumo.view.tsx`
- Create: `src/screens/Cycle/components/NewCycleBottomSheet/NewCycleBottomSheet.view.tsx`
- Create: `src/screens/Cycle/components/NewCycleBottomSheet/useNewCycleBottomSheet.viewModel.ts`

- [ ] **Step 1: Create useCycle.viewModel.ts**

```typescript
// src/screens/Cycle/useCycle.viewModel.ts
import { useGetPlannedSessionsQuery } from '@/shared/queries/cycles/use-get-planned-sessions.query'
import { useGetCycleSubjectsQuery } from '@/shared/queries/subjects/use-get-cycle-subjects.query'
import { PlannedSessionRepository } from '@/shared/database/repositories/planned-session.repository'
import { useCycleStore } from '@/shared/stores/cycle.store'
import { router } from 'expo-router'
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
      await PlannedSessionRepository.updateStatus(plannedSessionId, 'in_progress')
      queryClient.invalidateQueries({ queryKey: ['planned-sessions'] })
      router.push({ pathname: '/(private)/session', params: { plannedSessionId } })
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
```

- [ ] **Step 2: Create SessionRow component**

```typescript
// src/screens/Cycle/components/SessionRow/SessionRow.view.tsx
import { colors } from '@/constants/colors'
import { Ionicons } from '@expo/vector-icons'
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import type { PlannedSession } from '@/shared/interfaces/cycle'

interface Props {
  session: PlannedSession & { subjectName: string }
  onPlay: (id: string) => void
}

function formatSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':')
}

export const SessionRowView = ({ session, onPlay }: Props) => {
  const isDone = session.status === 'done'

  return (
    <View style={[styles.row, isDone && styles.rowDone]}>
      <Text style={[styles.subjectName, isDone && styles.textDone]} numberOfLines={1}>
        {session.subjectName}
      </Text>
      <Text style={[styles.sessionTime, isDone && styles.textDone]}>
        {formatSeconds(session.allocatedSeconds)}
      </Text>
      <View style={styles.remaining}>
        <Ionicons
          name="time-outline"
          size={14}
          color={isDone ? colors.grayscale.gray600 : colors.grayscale.gray400}
        />
        <Text style={[styles.remainingText, isDone && styles.textDone]}>
          {formatSeconds(session.allocatedSeconds)}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.playButton, isDone && styles.playButtonDone]}
        onPress={() => !isDone && onPlay(session.id)}
        disabled={isDone}
      >
        <Ionicons
          name={isDone ? 'checkmark' : 'play'}
          size={16}
          color={isDone ? colors.status.success : colors.grayscale.gray100}
        />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 8,
  },
  rowDone: { opacity: 0.5 },
  subjectName: { flex: 1, color: colors.grayscale.gray100, fontSize: 15, fontWeight: '600' },
  sessionTime: { color: colors.grayscale.gray100, fontSize: 15, fontWeight: '600', minWidth: 70, textAlign: 'center' },
  remaining: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 90 },
  remainingText: { color: colors.grayscale.gray300, fontSize: 14, fontWeight: '600' },
  textDone: { color: colors.grayscale.gray600 },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonDone: { backgroundColor: colors.background.elevated },
})
```

- [ ] **Step 3: Create CycleResumo component (image copy 2.png)**

```typescript
// src/screens/Cycle/components/CycleResumo/CycleResumo.view.tsx
import { colors } from '@/constants/colors'
import { Ionicons } from '@expo/vector-icons'
import { StyleSheet, Text, View } from 'react-native'

interface ResumoRow {
  label: string
  allocatedSeconds: number
  completedSeconds: number
  isTotal?: boolean
}

interface Props {
  rows: ResumoRow[]
}

function formatSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':')
}

export const CycleResumoView = ({ rows }: Props) => (
  <View style={styles.container}>
    <Text style={styles.heading}>Resumo</Text>
    <View style={styles.table}>
      {rows.map((row) => (
        <View key={row.label} style={[styles.row, row.isTotal && styles.totalRow]}>
          <Text style={[styles.label, row.isTotal && styles.totalLabel]} numberOfLines={1}>
            {row.label}
          </Text>
          <Text style={[styles.value, row.isTotal && styles.totalLabel]}>
            {formatSeconds(row.allocatedSeconds)}
          </Text>
          <View style={styles.completed}>
            <Ionicons name="time-outline" size={14} color={colors.grayscale.gray400} />
            <Text style={[styles.value, row.isTotal && styles.totalLabel]}>
              {formatSeconds(row.completedSeconds)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  </View>
)

const styles = StyleSheet.create({
  container: { marginTop: 32 },
  heading: { fontSize: 18, color: colors.grayscale.gray100, fontFamily: 'Baloo2_800ExtraBold', marginBottom: 12 },
  table: { backgroundColor: colors.background.card, borderRadius: 12, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.background.elevated,
  },
  totalRow: { backgroundColor: colors.background.elevated },
  label: { flex: 1, color: colors.grayscale.gray300, fontSize: 15 },
  totalLabel: { color: colors.grayscale.gray100, fontWeight: '700' },
  value: { color: colors.grayscale.gray300, fontSize: 15, minWidth: 80, textAlign: 'center' },
  completed: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 100 },
})
```

- [ ] **Step 4: Create Cycle.view.tsx**

```typescript
// src/screens/Cycle/Cycle.view.tsx
import { colors } from '@/constants/colors'
import { Ionicons } from '@expo/vector-icons'
import BottomSheet from '@gorhom/bottom-sheet'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CycleResumoView } from './components/CycleResumo/CycleResumo.view'
import { SessionRowView } from './components/SessionRow/SessionRow.view'
import { useCycleViewModel } from './useCycle.viewModel'
import { useGetPlannedSessionsQuery } from '@/shared/queries/cycles/use-get-planned-sessions.query'
import { SubjectRepository } from '@/shared/database/repositories/subject.repository'

export const CycleView = () => {
  const {
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
  } = useCycleViewModel()

  const resumoRows = [
    {
      label: 'Total',
      allocatedSeconds: Math.round(totalAllocatedHours * 3600),
      completedSeconds: Math.round(totalCompletedHours * 3600),
      isTotal: true,
    },
    ...cycleSubjects.map((cs) => ({
      label: cs.subject?.name ?? '',
      allocatedSeconds: Math.round(cs.allocatedHours * 3600),
      completedSeconds: Math.round(cs.completedHours * 3600),
    })),
  ]

  if (!activeCycleId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Nenhum ciclo ativo</Text>
          <TouchableOpacity style={styles.newButton} onPress={handleOpenNewCycle}>
            <Ionicons name="add" size={20} color={colors.grayscale.gray100} />
            <Text style={styles.newButtonText}>Novo Ciclo</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Ciclo Ativo</Text>
          <Text style={styles.progress}>
            {doneSessions} de {totalSessions} sessões concluídas
          </Text>
        </View>
        <TouchableOpacity style={styles.newButton} onPress={handleOpenNewCycle}>
          <Ionicons name="add" size={18} color={colors.grayscale.gray100} />
        </TouchableOpacity>
      </View>

      {/* Column headers (image copy.png) */}
      <View style={styles.columnHeaders}>
        <Text style={[styles.colHeader, { flex: 1 }]}>Matéria</Text>
        <Text style={[styles.colHeader, { minWidth: 70, textAlign: 'center' }]}>Sessão</Text>
        <Text style={[styles.colHeader, { minWidth: 100 }]}>Tempo restante</Text>
        <View style={{ width: 36 + 8 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Session list */}
        <View style={styles.sessionList}>
          {plannedSessions.map((session) => {
            const cs = cycleSubjects.find((cs) => cs.id === session.cycleSubjectId)
            return (
              <SessionRowView
                key={session.id}
                session={{ ...session, subjectName: cs?.subject?.name ?? '' }}
                onPlay={handlePlaySession}
              />
            )
          })}
        </View>

        {/* Resumo section */}
        <CycleResumoView rows={resumoRows} />
      </ScrollView>

      {/* New Cycle Bottom Sheet placeholder */}
      <BottomSheet ref={bottomSheetRef} index={-1} snapPoints={['75%']} enablePanDownToClose>
        <View style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Novo Ciclo</Text>
          <Text style={styles.sheetSubtitle}>Em breve — Task 25</Text>
        </View>
      </BottomSheet>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: { fontSize: 22, color: colors.grayscale.gray100, fontFamily: 'Baloo2_800ExtraBold' },
  progress: { fontSize: 13, color: colors.grayscale.gray400, marginTop: 2 },
  columnHeaders: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 8,
    alignItems: 'center',
  },
  colHeader: { fontSize: 12, color: colors.grayscale.gray500, textTransform: 'uppercase' },
  scroll: { paddingHorizontal: 20, paddingBottom: 100 },
  sessionList: { gap: 12 },
  newButton: {
    backgroundColor: colors.brand.primary,
    borderRadius: 8,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  newButtonText: { color: colors.grayscale.gray100, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  emptyTitle: { fontSize: 18, color: colors.grayscale.gray400 },
  sheetContent: { padding: 24, alignItems: 'center' },
  sheetTitle: { fontSize: 20, color: colors.grayscale.gray100, fontFamily: 'Baloo2_800ExtraBold' },
  sheetSubtitle: { fontSize: 14, color: colors.grayscale.gray400, marginTop: 8 },
})
```

- [ ] **Step 5: Verify and commit**

```bash
npx tsc --noEmit
git add concursos-app/src/screens/Cycle/
git commit -m "feat: implement Cycle screen with session list, resumo section, and play button"
```

---

## Task 25: New Cycle Bottom Sheet (Form)

**Files:**
- Modify: `src/screens/Cycle/components/NewCycleBottomSheet/NewCycleBottomSheet.view.tsx`
- Modify: `src/screens/Cycle/components/NewCycleBottomSheet/useNewCycleBottomSheet.viewModel.ts`

- [ ] **Step 1: Create useNewCycleBottomSheet.viewModel.ts**

```typescript
// src/screens/Cycle/components/NewCycleBottomSheet/useNewCycleBottomSheet.viewModel.ts
import { yupResolver } from '@hookform/resolvers/yup'
import { useCreateCycleMutation } from '@/shared/queries/cycles/use-create-cycle.mutation'
import { cycleSchema, type CycleFormData } from '@/shared/schemas/cycle.schema'
import { SubjectRepository } from '@/shared/database/repositories/subject.repository'
import { useCycleStore } from '@/shared/stores/cycle.store'
import { useQuery } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useForm } from 'react-hook-form'

export const useNewCycleBottomSheetViewModel = (onClose: () => void) => {
  const activeConcursoId = useCycleStore((s) => s.activeConcursoId)
  const createCycleMutation = useCreateCycleMutation()

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects', activeConcursoId],
    queryFn: () => SubjectRepository.getSubjectsByConcurso(activeConcursoId!),
    enabled: !!activeConcursoId,
  })

  // Default: all non-free-study subjects selected
  const defaultSelectedIds = subjects
    .filter((s) => !s.isFreeStudy)
    .map((s) => s.id)

  const form = useForm<CycleFormData>({
    resolver: yupResolver(cycleSchema),
    defaultValues: {
      name: `Ciclo ${new Date().toLocaleDateString('pt-BR')}`,
      plannedHours: 21, // default 3h/day × 7
      selectedSubjectIds: defaultSelectedIds,
    },
  })

  const handleSubmit = useCallback(
    async (data: CycleFormData) => {
      if (!activeConcursoId) return
      await createCycleMutation.mutateAsync({ ...data, concursoId: activeConcursoId })
      form.reset()
      onClose()
    },
    [activeConcursoId, createCycleMutation, form, onClose]
  )

  const toggleSubject = useCallback(
    (subjectId: string) => {
      const current = form.getValues('selectedSubjectIds')
      const updated = current.includes(subjectId)
        ? current.filter((id) => id !== subjectId)
        : [...current, subjectId]
      form.setValue('selectedSubjectIds', updated)
    },
    [form]
  )

  return {
    form,
    subjects,
    handleSubmit: form.handleSubmit(handleSubmit),
    isLoading: createCycleMutation.isPending,
    toggleSubject,
  }
}
```

- [ ] **Step 2: Create NewCycleBottomSheet.view.tsx**

```typescript
// src/screens/Cycle/components/NewCycleBottomSheet/NewCycleBottomSheet.view.tsx
import { colors } from '@/constants/colors'
import { Controller } from 'react-hook-form'
import {
  ActivityIndicator, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native'
import { useNewCycleBottomSheetViewModel } from './useNewCycleBottomSheet.viewModel'

interface Props { onClose: () => void }

export const NewCycleBottomSheetView = ({ onClose }: Props) => {
  const { form, subjects, handleSubmit, isLoading, toggleSubject } =
    useNewCycleBottomSheetViewModel(onClose)

  const selectedIds = form.watch('selectedSubjectIds')

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Novo Ciclo</Text>

      {/* Nome */}
      <Text style={styles.label}>Nome</Text>
      <Controller
        control={form.control}
        name="name"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <>
            <TextInput style={styles.input} value={value} onChangeText={onChange}
              placeholderTextColor={colors.grayscale.gray600} />
            {error && <Text style={styles.error}>{error.message}</Text>}
          </>
        )}
      />

      {/* Horas */}
      <Text style={styles.label}>Horas disponíveis na semana</Text>
      <Controller
        control={form.control}
        name="plannedHours"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <>
            <TextInput
              style={styles.input}
              value={String(value)}
              onChangeText={(v) => onChange(Number(v))}
              keyboardType="numeric"
              placeholderTextColor={colors.grayscale.gray600}
            />
            {error && <Text style={styles.error}>{error.message}</Text>}
          </>
        )}
      />

      {/* Matérias */}
      <Text style={styles.label}>Matérias</Text>
      {subjects.map((subject) => {
        const isSelected = selectedIds.includes(subject.id)
        const isFixed = subject.isFreeStudy
        return (
          <TouchableOpacity
            key={subject.id}
            style={[styles.subjectRow, isSelected && styles.subjectSelected]}
            onPress={() => !isFixed && toggleSubject(subject.id)}
            disabled={isFixed}
          >
            <View>
              <Text style={styles.subjectName}>
                {subject.name}
                {isFixed && ' (fixo)'}
              </Text>
              {subject.isSlowBuild && (
                <Text style={styles.slowBuildBadge}>
                  Construção lenta — prioridade nas primeiras 2 semanas
                </Text>
              )}
            </View>
            <Text style={styles.subjectPoints}>{subject.points} pts</Text>
          </TouchableOpacity>
        )
      })}

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={isLoading}>
        {isLoading
          ? <ActivityIndicator color={colors.grayscale.gray100} />
          : <Text style={styles.submitText}>Criar Ciclo</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24, backgroundColor: colors.background.card },
  title: { fontSize: 20, color: colors.grayscale.gray100, fontFamily: 'Baloo2_800ExtraBold', marginBottom: 20 },
  label: { fontSize: 13, color: colors.grayscale.gray400, marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: colors.background.elevated,
    borderRadius: 8,
    padding: 12,
    color: colors.grayscale.gray100,
    fontSize: 15,
  },
  error: { fontSize: 12, color: colors.status.error, marginTop: 4 },
  subjectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: colors.background.elevated,
  },
  subjectSelected: { borderWidth: 1, borderColor: colors.brand.primary },
  subjectName: { color: colors.grayscale.gray100, fontSize: 15, fontWeight: '600' },
  slowBuildBadge: { fontSize: 11, color: colors.status.warning, marginTop: 2 },
  subjectPoints: { color: colors.grayscale.gray400, fontSize: 13 },
  submitButton: {
    backgroundColor: colors.brand.primary,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  submitText: { color: colors.grayscale.gray100, fontWeight: '700', fontSize: 16 },
})
```

- [ ] **Step 3: Wire bottom sheet in Cycle.view.tsx**

Replace the BottomSheet placeholder in `Cycle.view.tsx`:
```typescript
// Replace sheetContent placeholder with:
import { NewCycleBottomSheetView } from './components/NewCycleBottomSheet/NewCycleBottomSheet.view'

// Inside BottomSheet:
<BottomSheet ref={bottomSheetRef} index={-1} snapPoints={['85%']} enablePanDownToClose>
  <NewCycleBottomSheetView onClose={() => bottomSheetRef.current?.close()} />
</BottomSheet>
```

- [ ] **Step 4: Manual test**

1. Open Cycle tab → "Nenhum ciclo ativo" + "Novo Ciclo" button
2. Tap "Novo Ciclo" → bottom sheet slides up
3. Fill name + hours, select subjects → tap "Criar Ciclo"
4. Bottom sheet closes → session list appears with blocks
5. Verify Resumo section shows correct totals

- [ ] **Step 5: Commit**

```bash
git add concursos-app/src/screens/Cycle/
git commit -m "feat: complete New Cycle bottom sheet with subject selection and allocation"
```

---

## Phase 5 Complete

At this point you have:
- ✅ `CycleService` — proportional allocation + round-robin block splitting
- ✅ `use-create-cycle.mutation` — creates cycle + cycle_subjects + planned_sessions
- ✅ Cycle screen — session list with play buttons (matching image copy.png)
- ✅ Cycle screen — Resumo section (matching image copy 2.png)
- ✅ New Cycle bottom sheet — name, hours, subject selection with slow_build badges
- ✅ Progress indicator "N de M sessões concluídas"

**Next:** `docs/superpowers/plans/2026-03-21-phase-6-session-timer.md`
