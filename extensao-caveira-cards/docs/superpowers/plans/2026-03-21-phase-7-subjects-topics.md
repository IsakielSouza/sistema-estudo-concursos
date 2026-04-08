# Phase 7: Subject & Topics Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Subject detail screen — hierarchical topic list with checkboxes (FEITO/PENDENTE), progress bar, "concluiu edital?" toggle (active → revision), and dirty-flag sync back to Google Sheets on screen exit.

**Architecture:** Subject screen receives `[id]` param from Expo Router. Topics loaded from SQLite via TanStack Query. Checkbox tap writes to SQLite (dirty flag) immediately. On screen unmount, `use-update-topic-status.mutation` writes dirty topics to Sheets. MVVM pattern.

**Tech Stack:** expo-sqlite repositories, TanStack Query, SyncService, react-navigation back gesture listener

**Spec:** `docs/superpowers/specs/2026-03-21-sistema-estudo-concursos-design.md` — Seção 6 (/subject/[id])

**Requires:** Phases 1–4 complete (repositories + sync service)

---

## Task 30: Subject + Topic Queries

**Files:**
- Create: `src/shared/queries/subjects/use-get-subjects.query.ts`
- Create: `src/shared/queries/subjects/use-update-topic-status.mutation.ts`

- [ ] **Step 1: Create use-get-subjects.query.ts**

```typescript
// src/shared/queries/subjects/use-get-subjects.query.ts
import { useQuery } from '@tanstack/react-query'
import { SubjectRepository } from '@/shared/database/repositories/subject.repository'
import { TopicRepository } from '@/shared/database/repositories/topic.repository'
import { useCycleStore } from '@/shared/stores/cycle.store'

export function useGetSubjectsQuery() {
  const activeConcursoId = useCycleStore((s) => s.activeConcursoId)

  return useQuery({
    queryKey: ['subjects', activeConcursoId],
    queryFn: () => SubjectRepository.getSubjectsByConcurso(activeConcursoId!),
    enabled: !!activeConcursoId,
  })
}

export function useGetSubjectDetailQuery(subjectId: string) {
  return useQuery({
    queryKey: ['subject', subjectId],
    queryFn: () => SubjectRepository.getSubjectById(subjectId),
    enabled: !!subjectId,
  })
}

export function useGetTopicsQuery(subjectId: string) {
  return useQuery({
    queryKey: ['topics', subjectId],
    queryFn: () => TopicRepository.getBySubject(subjectId),
    enabled: !!subjectId,
  })
}

export function useGetTopicProgressQuery(subjectId: string) {
  return useQuery({
    queryKey: ['topic-progress', subjectId],
    queryFn: () => TopicRepository.getProgressBySubject(subjectId),
    enabled: !!subjectId,
  })
}
```

- [ ] **Step 2: Create use-update-topic-status.mutation.ts**

```typescript
// src/shared/queries/subjects/use-update-topic-status.mutation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { TopicRepository } from '@/shared/database/repositories/topic.repository'
import { SyncService } from '@/shared/services/sync.service'
import { useAuthStore } from '@/shared/stores/auth.store'

interface UpdateTopicInput {
  topicId: string
  subjectId: string
  status: 'pending' | 'done'
}

export function useUpdateTopicStatusMutation() {
  const queryClient = useQueryClient()
  const spreadsheetId = useAuthStore((s) => s.spreadsheetId)

  return useMutation({
    mutationFn: async ({ topicId, status }: UpdateTopicInput) => {
      // Write to SQLite with dirty flag (offline-safe)
      await TopicRepository.setTopicStatus(topicId, status)
    },
    onSuccess: (_, { subjectId }) => {
      queryClient.invalidateQueries({ queryKey: ['topics', subjectId] })
      queryClient.invalidateQueries({ queryKey: ['topic-progress', subjectId] })
    },
  })
}

export function useWriteDirtyTopicsMutation() {
  const spreadsheetId = useAuthStore((s) => s.spreadsheetId)

  return useMutation({
    mutationFn: async (subjectId: string) => {
      if (!spreadsheetId) return
      await SyncService.writeDirtyTopics(spreadsheetId, subjectId)
    },
  })
}
```

- [ ] **Step 3: Commit**

```bash
npx tsc --noEmit
git add concursos-app/src/shared/queries/subjects/
git commit -m "feat: add subject detail, topics, and topic status mutation queries"
```

---

## Task 31: Subject Screen MVVM

**Files:**
- Modify: `src/screens/Subject/useSubject.viewModel.ts`
- Modify: `src/screens/Subject/Subject.view.tsx`
- Create: `src/screens/Subject/components/TopicRow/TopicRow.view.tsx`
- Create: `src/screens/Subject/components/EditalToggle/EditalToggle.view.tsx`

- [ ] **Step 1: Create useSubject.viewModel.ts**

```typescript
// src/screens/Subject/useSubject.viewModel.ts
import {
  useGetSubjectDetailQuery,
  useGetTopicsQuery,
  useGetTopicProgressQuery,
} from '@/shared/queries/subjects/use-get-subjects.query'
import {
  useUpdateTopicStatusMutation,
  useWriteDirtyTopicsMutation,
} from '@/shared/queries/subjects/use-update-topic-status.mutation'
import { SubjectRepository } from '@/shared/database/repositories/subject.repository'
import { useLocalSearchParams, router } from 'expo-router'
import { useCallback, useEffect } from 'react'
import { Alert } from 'react-native'
import { useQueryClient } from '@tanstack/react-query'

export const useSubjectViewModel = () => {
  const { id: subjectId } = useLocalSearchParams<{ id: string }>()
  const queryClient = useQueryClient()

  const { data: subject } = useGetSubjectDetailQuery(subjectId)
  const { data: topics = [] } = useGetTopicsQuery(subjectId)
  const { data: progress } = useGetTopicProgressQuery(subjectId)

  const updateTopicMutation = useUpdateTopicStatusMutation()
  const writeDirtyMutation = useWriteDirtyTopicsMutation()

  // Sync dirty topics back to Sheets when leaving screen
  useEffect(() => {
    return () => {
      writeDirtyMutation.mutate(subjectId)
    }
  }, [subjectId]) // eslint-disable-line

  const handleTopicToggle = useCallback(
    (topicId: string, currentStatus: 'pending' | 'done') => {
      updateTopicMutation.mutate({
        topicId,
        subjectId,
        status: currentStatus === 'done' ? 'pending' : 'done',
      })
    },
    [subjectId, updateTopicMutation]
  )

  const handleEditalComplete = useCallback(() => {
    if (!subject) return
    if (subject.cycleStatus === 'revision') return

    Alert.alert(
      'Concluiu o Edital?',
      'Esta matéria entrará em modo revisão com 50% das horas. Permanecerá no ciclo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            await SubjectRepository.updateCycleStatus(subject.id, 'revision')
            queryClient.invalidateQueries({ queryKey: ['subject', subjectId] })
            queryClient.invalidateQueries({ queryKey: ['cycle-subjects'] })
          },
        },
      ]
    )
  }, [subject, subjectId, queryClient])

  const progressRatio =
    progress && progress.total > 0 ? progress.done / progress.total : 0

  return {
    subject,
    topics,
    progress,
    progressRatio,
    handleTopicToggle,
    handleEditalComplete,
    isUpdating: updateTopicMutation.isPending,
  }
}
```

- [ ] **Step 2: Create TopicRow component**

```typescript
// src/screens/Subject/components/TopicRow/TopicRow.view.tsx
import { colors } from '@/constants/colors'
import { Ionicons } from '@expo/vector-icons'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import type { Topic } from '@/shared/interfaces/topic'

interface Props {
  topic: Topic
  onToggle: (id: string, status: 'pending' | 'done') => void
}

const INDENT = [0, 0, 16, 32] // indent per level

export const TopicRowView = ({ topic, onToggle }: Props) => {
  const isDone = topic.status === 'done'
  const indent = INDENT[topic.level] ?? 32

  return (
    <TouchableOpacity
      style={[styles.row, { paddingLeft: 16 + indent }]}
      onPress={() => onToggle(topic.id, topic.status)}
      activeOpacity={0.7}
    >
      <View style={[styles.checkbox, isDone && styles.checkboxDone]}>
        {isDone && <Ionicons name="checkmark" size={14} color={colors.grayscale.gray100} />}
      </View>
      <Text
        style={[
          styles.title,
          topic.level === 1 ? styles.levelOne : styles.levelTwo,
          isDone && styles.done,
        ]}
      >
        {topic.code ? `${topic.code} — ${topic.title}` : topic.title}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingRight: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.background.elevated,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.grayscale.gray600,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxDone: { backgroundColor: colors.status.success, borderColor: colors.status.success },
  title: { flex: 1, color: colors.grayscale.gray200, lineHeight: 20 },
  levelOne: { fontSize: 15, fontWeight: '600' },
  levelTwo: { fontSize: 13, color: colors.grayscale.gray400 },
  done: { textDecorationLine: 'line-through', color: colors.grayscale.gray600 },
})
```

- [ ] **Step 3: Create Subject.view.tsx**

```typescript
// src/screens/Subject/Subject.view.tsx
import { colors } from '@/constants/colors'
import { Ionicons } from '@expo/vector-icons'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { TopicRowView } from './components/TopicRow/TopicRow.view'
import { useSubjectViewModel } from './useSubject.viewModel'

export const SubjectView = () => {
  const {
    subject, topics, progress, progressRatio,
    handleTopicToggle, handleEditalComplete,
  } = useSubjectViewModel()

  if (!subject) return null

  const isRevision = subject.cycleStatus === 'revision'

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.grayscale.gray100} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{subject.name}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Subject meta */}
      <View style={styles.meta}>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Peso na prova</Text>
          <Text style={styles.metaValue}>{subject.points} pts</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Status</Text>
          <View style={[styles.badge, isRevision ? styles.badgeRevision : styles.badgeActive]}>
            <Text style={styles.badgeText}>{isRevision ? 'Revisão' : 'Ativo'}</Text>
          </View>
        </View>
        {!isRevision && (
          <TouchableOpacity style={styles.editalButton} onPress={handleEditalComplete}>
            <Ionicons name="checkmark-circle-outline" size={16} color={colors.brand.primary} />
            <Text style={styles.editalButtonText}>Concluiu o edital?</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Progress */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Progresso dos tópicos</Text>
          <Text style={styles.progressCount}>
            {progress?.done ?? 0} / {progress?.total ?? 0}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressRatio * 100}%` }]} />
        </View>
      </View>

      {/* Topics list */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {topics.map((topic) => (
          <TopicRowView
            key={topic.id}
            topic={topic}
            onToggle={handleTopicToggle}
          />
        ))}
      </ScrollView>
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
    paddingVertical: 16,
  },
  title: { fontSize: 18, color: colors.grayscale.gray100, fontWeight: '600', flex: 1, textAlign: 'center' },
  meta: { paddingHorizontal: 20, gap: 8, paddingBottom: 16 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaLabel: { fontSize: 14, color: colors.grayscale.gray500 },
  metaValue: { fontSize: 14, color: colors.grayscale.gray200, fontWeight: '600' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeActive: { backgroundColor: colors.brand.primary + '33' },
  badgeRevision: { backgroundColor: colors.status.warning + '33' },
  badgeText: { fontSize: 12, color: colors.grayscale.gray100, fontWeight: '600' },
  editalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  editalButtonText: { fontSize: 14, color: colors.brand.primary },
  progressSection: { paddingHorizontal: 20, paddingBottom: 16, gap: 8 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: 13, color: colors.grayscale.gray400 },
  progressCount: { fontSize: 13, color: colors.grayscale.gray400 },
  progressTrack: { height: 6, backgroundColor: colors.background.elevated, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: colors.brand.primary, borderRadius: 3 },
})
```

- [ ] **Step 4: Wire subject route**

```typescript
// src/app/(private)/subject/[id].tsx
import { SubjectView } from '@/screens/Subject/Subject.view'
export default SubjectView
```

- [ ] **Step 5: Add subject tap from Cycle screen**

In `SessionRow` or `Cycle.view.tsx`, add navigation to subject on ⋮ menu:
```typescript
// In SessionRow or cycle viewModel:
const handleViewSubject = (subjectId: string) => {
  router.push({ pathname: '/(private)/subject/[id]', params: { id: subjectId } })
}
```

- [ ] **Step 6: Manual test**

1. From Cycle tab, tap ⋮ on a session → tap "Ver matéria"
2. Subject screen opens with topic list
3. Tap a checkbox → toggles FEITO/PENDENTE instantly
4. Navigate back → dirty topics should sync to Sheets (verify via spreadsheet)
5. Tap "Concluiu o edital?" → alert → confirm → badge changes to "Revisão"

- [ ] **Step 7: Commit**

```bash
git add concursos-app/src/screens/Subject/ concursos-app/src/app/\(private\)/subject/
git commit -m "feat: implement Subject screen with topic checkboxes, progress, and edital toggle"
```

---

## Phase 7 Complete

At this point you have:
- ✅ Subject detail screen with subject meta (points, status)
- ✅ Hierarchical topic list with indentation by level
- ✅ Checkbox tap — instant SQLite update with dirty flag
- ✅ Dirty topics synced to Google Sheets on screen exit
- ✅ Progress bar with done/total topics count
- ✅ "Concluiu o edital?" toggle → `cycle_status = 'revision'`

**Next:** `docs/superpowers/plans/2026-03-21-phase-8-recommendation.md`
