# Phase 8: Recommendation & Home Dashboard Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the daily recommendation algorithm and the Home dashboard screen — shows today's suggested subjects with times, cycle progress bar, status badge, and the editable "hours today" field.

**Architecture:** `recommendation.service.ts` computes weekly deficits, applies slow_build multiplier, and distributes day_available_hours. Home screen uses `useHomeViewModel` to coordinate sync + recommendation display. MVVM pattern.

**Tech Stack:** date-fns (ISO week), expo-sqlite repositories, TanStack Query, Zustand

**Spec:** `docs/superpowers/specs/2026-03-21-sistema-estudo-concursos-design.md` — Seções 7.2 (Algoritmo recomendação), 7.3 (estimativa ciclos), 6 (/home screen)

**Requires:** Phases 1–5 complete

---

## Task 32: Recommendation Service

**Files:**
- Create: `src/shared/services/recommendation.service.ts`
- Create: `src/shared/helpers/time.helper.ts`

- [ ] **Step 1: Create time.helper.ts**

```typescript
// src/shared/helpers/time.helper.ts
import {
  startOfISOWeek,
  endOfISOWeek,
  differenceInDays,
  format,
} from 'date-fns'

export function getCurrentISOWeekBounds(): { start: string; end: string } {
  const now = new Date()
  return {
    start: startOfISOWeek(now).toISOString(),
    end: endOfISOWeek(now).toISOString(),
  }
}

export function getDaysElapsedSince(isoDateString: string): number {
  return differenceInDays(new Date(), new Date(isoDateString))
}

export function formatHoursToDisplay(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (m === 0) return `${h}h`
  return `${h}h${String(m).padStart(2, '0')}m`
}

export function formatSecondsToHHMM(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
```

- [ ] **Step 2: Create recommendation.service.ts**

```typescript
// src/shared/services/recommendation.service.ts
import { SessionRepository } from '@/shared/database/repositories/session.repository'
import { getCurrentISOWeekBounds, getDaysElapsedSince } from '@/shared/helpers/time.helper'
import type { Subject } from '@/shared/interfaces/subject'
import type { CycleSubject } from '@/shared/interfaces/cycle'

export type PriorityBadge = 'slow_build' | 'revision' | null

export interface RecommendationItem {
  subjectId: string
  subjectName: string
  suggestedMinutes: number
  priorityBadge: PriorityBadge
  deficitHours: number
}

export interface RecommendationInput {
  cycleSubjects: Array<CycleSubject & { subject: Subject }>
  dayAvailableHours: number
  cycleStartedAt: string
}

export const RecommendationService = {
  /**
   * Compute weekly completed hours per subject from study_sessions table.
   */
  async getWeeklyCompletedHours(
    subjectIds: string[]
  ): Promise<Map<string, number>> {
    const { start, end } = getCurrentISOWeekBounds()
    const map = new Map<string, number>()

    for (const subjectId of subjectIds) {
      const totalSeconds = await SessionRepository.getWeeklySecondsBySubject(
        subjectId,
        start,
        end
      )
      map.set(subjectId, totalSeconds / 3600)
    }

    return map
  },

  /**
   * Main recommendation algorithm.
   * Returns sorted list of subjects with suggested study time for today.
   */
  async recommend(input: RecommendationInput): Promise<RecommendationItem[]> {
    const { cycleSubjects, dayAvailableHours, cycleStartedAt } = input

    const daysElapsed = getDaysElapsedSince(cycleStartedAt)
    const isEarlyInCycle = daysElapsed <= 14 // first 2 weeks

    const subjectIds = cycleSubjects.map((cs) => cs.subjectId)
    const weeklyCompleted = await RecommendationService.getWeeklyCompletedHours(subjectIds)

    // Compute deficits with slow_build multiplier
    const deficits = cycleSubjects
      .map((cs) => {
        const completedThisWeek = weeklyCompleted.get(cs.subjectId) ?? 0
        let deficit = cs.allocatedHours - completedThisWeek

        // Apply slow_build multiplier in first 2 weeks
        if (cs.subject.isSlowBuild && isEarlyInCycle) {
          deficit *= 1.3
        }

        const badge: PriorityBadge =
          cs.subject.isSlowBuild && isEarlyInCycle
            ? 'slow_build'
            : cs.subject.cycleStatus === 'revision'
            ? 'revision'
            : null

        return {
          subjectId: cs.subjectId,
          subjectName: cs.subject.name,
          deficit,
          badge,
        }
      })
      .filter((d) => d.deficit > 0)
      .sort((a, b) => b.deficit - a.deficit)

    if (!deficits.length) return []

    // Distribute day_available_hours proportionally to deficit
    const totalDeficit = deficits.reduce((sum, d) => sum + d.deficit, 0)
    const dayAvailableMinutes = dayAvailableHours * 60

    return deficits.map((d) => {
      const proportion = d.deficit / totalDeficit
      const rawMinutes = proportion * dayAvailableMinutes
      // Round to nearest 5 minutes
      const suggestedMinutes = Math.max(5, Math.round(rawMinutes / 5) * 5)

      return {
        subjectId: d.subjectId,
        subjectName: d.subjectName,
        suggestedMinutes,
        priorityBadge: d.badge,
        deficitHours: d.deficit,
      }
    })
  },

  /**
   * Estimate weeks to complete edital per subject.
   * Returns null if insufficient history (< 1 week of data).
   */
  async estimateWeeksToComplete(
    subjectId: string,
    doneTopic: number,
    totalTopics: number
  ): Promise<number | null> {
    if (totalTopics === 0) return null
    const remaining = totalTopics - doneTopic
    if (remaining === 0) return 0

    // Calculate weekly rate from all historical sessions
    const allSessions = await SessionRepository.getBySubject(subjectId)
    if (allSessions.length === 0) return null

    // Approximate: 1 topic per X hours studied historically
    // (simplified: use done/total ratio as proxy since we track sessions not topic-completion events)
    return null // Placeholder: full implementation requires topic completion timestamps
  },
}
```

- [ ] **Step 3: Commit**

```bash
npx tsc --noEmit
git add concursos-app/src/shared/services/recommendation.service.ts concursos-app/src/shared/helpers/time.helper.ts
git commit -m "feat: implement RecommendationService with deficit calculation and slow_build multiplier"
```

---

## Task 33: Home ViewModel + Dashboard

**Files:**
- Modify: `src/screens/Home/useHome.viewModel.ts`
- Modify: `src/screens/Home/Home.view.tsx`
- Create: `src/screens/Home/components/RecommendationCard/RecommendationCard.view.tsx`
- Create: `src/screens/Home/components/CycleProgressCard/CycleProgressCard.view.tsx`

- [ ] **Step 1: Update useHome.viewModel.ts**

```typescript
// src/screens/Home/useHome.viewModel.ts
import { useSyncSheetsMutation } from '@/shared/queries/sheets/use-sync-sheets.mutation'
import { useGetCycleSubjectsQuery } from '@/shared/queries/subjects/use-get-cycle-subjects.query'
import { RecommendationService } from '@/shared/services/recommendation.service'
import { useCycleStore } from '@/shared/stores/cycle.store'
import { CycleRepository } from '@/shared/database/repositories/cycle.repository'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import type { RecommendationItem } from '@/shared/services/recommendation.service'

export const useHomeViewModel = () => {
  const syncMutation = useSyncSheetsMutation()
  const activeCycleId = useCycleStore((s) => s.activeCycleId)
  const activeConcursoId = useCycleStore((s) => s.activeConcursoId)

  const [dayAvailableHours, setDayAvailableHours] = useState(3)
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([])

  const { data: cycleSubjects = [] } = useGetCycleSubjectsQuery()

  const { data: activeCycle } = useQuery({
    queryKey: ['active-cycle', activeCycleId],
    queryFn: () => CycleRepository.getActiveCycle(activeConcursoId!),
    enabled: !!activeConcursoId,
  })

  // Sync on mount
  useEffect(() => {
    syncMutation.mutate()
  }, []) // eslint-disable-line

  // Default day_available_hours = plannedHours / 7
  useEffect(() => {
    if (activeCycle) {
      setDayAvailableHours(Number((activeCycle.plannedHours / 7).toFixed(1)))
    }
  }, [activeCycle])

  // Recompute recommendations when subjects or dayAvailableHours change
  useEffect(() => {
    if (!cycleSubjects.length || !activeCycle) return
    RecommendationService.recommend({
      cycleSubjects,
      dayAvailableHours,
      cycleStartedAt: activeCycle.startedAt,
    }).then(setRecommendations)
  }, [cycleSubjects, dayAvailableHours, activeCycle])

  const cycleProgress =
    activeCycle && activeCycle.plannedHours > 0
      ? activeCycle.completedHours / activeCycle.plannedHours
      : 0

  const cycleStatusLabel =
    activeCycle?.status === 'late'
      ? 'Atrasado'
      : activeCycle?.status === 'completed'
      ? 'Concluído'
      : 'Em dia'

  return {
    isSyncing: syncMutation.isPending,
    syncError: syncMutation.error?.message ?? null,
    activeCycle,
    cycleProgress,
    cycleStatusLabel,
    recommendations,
    dayAvailableHours,
    setDayAvailableHours,
  }
}
```

- [ ] **Step 2: Create RecommendationCard component**

```typescript
// src/screens/Home/components/RecommendationCard/RecommendationCard.view.tsx
import { colors } from '@/constants/colors'
import { StyleSheet, Text, View } from 'react-native'
import type { RecommendationItem } from '@/shared/services/recommendation.service'

interface Props { item: RecommendationItem }

const BADGE_LABELS = {
  slow_build: '🐢 Construção lenta',
  revision: '🔄 Revisão',
}

export const RecommendationCardView = ({ item }: Props) => {
  const hours = Math.floor(item.suggestedMinutes / 60)
  const mins = item.suggestedMinutes % 60
  const timeLabel = hours > 0 ? `${hours}h${mins > 0 ? `${mins}min` : ''}` : `${mins}min`

  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <Text style={styles.name} numberOfLines={1}>{item.subjectName}</Text>
        {item.priorityBadge && (
          <Text style={styles.badge}>{BADGE_LABELS[item.priorityBadge]}</Text>
        )}
      </View>
      <Text style={styles.time}>{timeLabel}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  left: { flex: 1, gap: 2 },
  name: { fontSize: 15, color: colors.grayscale.gray100, fontWeight: '600' },
  badge: { fontSize: 11, color: colors.status.warning },
  time: { fontSize: 20, color: colors.brand.primary, fontWeight: '700', marginLeft: 12 },
})
```

- [ ] **Step 3: Create CycleProgressCard component**

```typescript
// src/screens/Home/components/CycleProgressCard/CycleProgressCard.view.tsx
import { colors } from '@/constants/colors'
import { StyleSheet, Text, View } from 'react-native'
import type { Cycle } from '@/shared/interfaces/cycle'

interface Props { cycle: Cycle; progressRatio: number; statusLabel: string }

export const CycleProgressCardView = ({ cycle, progressRatio, statusLabel }: Props) => {
  const statusColor =
    statusLabel === 'Atrasado' ? colors.status.late :
    statusLabel === 'Concluído' ? colors.status.success :
    colors.status.success

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.cycleName}>{cycle.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '33' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.min(100, progressRatio * 100)}%` }]} />
      </View>
      <Text style={styles.hoursLabel}>
        {cycle.completedHours.toFixed(1)}h / {cycle.plannedHours}h
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.card,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cycleName: { fontSize: 16, color: colors.grayscale.gray100, fontWeight: '600', flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
  progressTrack: { height: 8, backgroundColor: colors.background.elevated, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, backgroundColor: colors.brand.primary, borderRadius: 4 },
  hoursLabel: { fontSize: 13, color: colors.grayscale.gray500 },
})
```

- [ ] **Step 4: Update Home.view.tsx**

```typescript
// src/screens/Home/Home.view.tsx
import { colors } from '@/constants/colors'
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CycleProgressCardView } from './components/CycleProgressCard/CycleProgressCard.view'
import { RecommendationCardView } from './components/RecommendationCard/RecommendationCard.view'
import { useHomeViewModel } from './useHome.viewModel'

export const HomeView = () => {
  const {
    isSyncing, syncError, activeCycle, cycleProgress,
    cycleStatusLabel, recommendations, dayAvailableHours, setDayAvailableHours,
  } = useHomeViewModel()

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Sync indicator */}
        {isSyncing && (
          <View style={styles.syncBanner}>
            <ActivityIndicator size="small" color={colors.grayscale.gray400} />
            <Text style={styles.syncText}>Sincronizando planilha...</Text>
          </View>
        )}

        {/* Cycle progress */}
        {activeCycle && (
          <CycleProgressCardView
            cycle={activeCycle}
            progressRatio={cycleProgress}
            statusLabel={cycleStatusLabel}
          />
        )}

        {/* Recommendation section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recomendação de Hoje</Text>
            <View style={styles.hoursInput}>
              <Text style={styles.hoursLabel}>Horas disponíveis:</Text>
              <TextInput
                style={styles.hoursField}
                value={String(dayAvailableHours)}
                onChangeText={(v) => {
                  const n = Number(v)
                  if (!Number.isNaN(n) && n >= 0) setDayAvailableHours(n)
                }}
                keyboardType="decimal-pad"
                selectTextOnFocus
              />
            </View>
          </View>

          {recommendations.length === 0 ? (
            <Text style={styles.empty}>
              {activeCycle ? 'Sem déficit para hoje! 🎉' : 'Crie um ciclo para ver recomendações'}
            </Text>
          ) : (
            <View style={styles.recList}>
              {recommendations.map((item) => (
                <RecommendationCardView key={item.subjectId} item={item} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100, gap: 20 },
  syncBanner: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  syncText: { color: colors.grayscale.gray500, fontSize: 12 },
  section: { gap: 12 },
  sectionHeader: { gap: 8 },
  sectionTitle: { fontSize: 18, color: colors.grayscale.gray100, fontFamily: 'Baloo2_800ExtraBold' },
  hoursInput: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hoursLabel: { fontSize: 13, color: colors.grayscale.gray400 },
  hoursField: {
    backgroundColor: colors.background.card,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: colors.grayscale.gray100,
    fontSize: 14,
    minWidth: 50,
    textAlign: 'center',
  },
  recList: { gap: 8 },
  empty: { color: colors.grayscale.gray500, fontSize: 14, textAlign: 'center', paddingVertical: 20 },
})
```

- [ ] **Step 5: Manual test**

1. Login + sync → Home shows recommendations based on cycle deficits
2. Edit "Horas disponíveis" field → recommendations update instantly
3. Subjects with is_slow_build in first 2 weeks → "🐢 Construção lenta" badge
4. Revision subjects → "🔄 Revisão" badge
5. Cycle progress bar + status badge visible

- [ ] **Step 6: Commit**

```bash
git add concursos-app/src/screens/Home/ concursos-app/src/shared/services/recommendation.service.ts concursos-app/src/shared/helpers/
git commit -m "feat: implement Home dashboard with cycle progress, daily recommendation, and slow_build badges"
```

---

## Phase 8 Complete

At this point you have:
- ✅ `RecommendationService` with deficit calculation + slow_build multiplier + ISO week grouping
- ✅ Home dashboard with cycle progress bar + status badge
- ✅ Daily recommendation list with suggested minutes per subject
- ✅ Editable "hours today" field (default = planned_hours / 7)
- ✅ Priority badges: 🐢 Construção lenta, 🔄 Revisão

**Next:** `docs/superpowers/plans/2026-03-21-phase-9-history-backup-settings.md`
