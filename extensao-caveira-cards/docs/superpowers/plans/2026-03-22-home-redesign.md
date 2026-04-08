# Home Screen Redesign — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the Home screen to show a circular SVG progress wheel of planned study sessions, a scrollable session list with manual registration and undo, a drawer header, and a FAB for new cycle creation.

**Architecture:** Bottom-up — DB layer first, then repositories, then mutations, then UI components, then the ViewModel wiring everything together, and finally the root View. Each task is independently committable. No test framework exists in this project; verification is done via TypeScript build (`pnpm tsc --noEmit`) after each task.

**Tech Stack:** React Native + Expo Router, expo-sqlite, react-native-svg, TanStack React Query v5, Zustand, @gorhom/bottom-sheet, TypeScript.

---

## File Map

| File | Status | Responsibility |
|---|---|---|
| `src/shared/interfaces/session.ts` | Modify | Add `isManual: boolean` to `StudySession` |
| `src/shared/database/migrations/002_add_is_manual.ts` | Create | SQLite migration: add `is_manual` column |
| `src/shared/database/migrations/index.ts` | Modify | Register migration 002 |
| `src/shared/database/repositories/session.repository.ts` | Modify | isManual in mapper + INSERT + 3 new methods |
| `src/shared/database/repositories/cycle.repository.ts` | Modify | `decrementCycleSubjectHours()` + ORDER BY in `getCycleSubjects` |
| `src/shared/database/repositories/planned-session.repository.ts` | Modify | Add `resetStatus()` |
| `src/shared/queries/sessions/use-save-session.mutation.ts` | Modify | Pass `isManual: false` |
| `src/shared/queries/cycles/use-register-manual-session.mutation.ts` | Create | New mutation |
| `src/shared/queries/cycles/use-undo-session.mutation.ts` | Create | New mutation |
| `src/screens/Home/components/HomeHeader/HomeHeader.view.tsx` | Create | Header with drawer + avatar |
| `src/screens/Home/components/CycleCircle/CycleCircle.view.tsx` | Create | SVG arc segments circle |
| `src/screens/Home/components/SessionList/SessionRow.view.tsx` | Create | Single session row with ⋮ menu |
| `src/screens/Home/components/SessionList/SessionList.view.tsx` | Create | ScrollView wrapper for rows |
| `src/screens/Home/components/ManualSessionModal/ManualSessionModal.view.tsx` | Create | Modal for manual time input |
| `src/screens/Home/useHome.viewModel.ts` | Rewrite | All data + actions for the screen |
| `src/screens/Home/Home.view.tsx` | Rewrite | Root layout composing all components |

---

## Task 1: DB Migration + StudySession interface

**Files:**
- Modify: `src/shared/interfaces/session.ts`
- Create: `src/shared/database/migrations/002_add_is_manual.ts`
- Modify: `src/shared/database/migrations/index.ts`

- [ ] **Step 1: Add `isManual` to the `StudySession` interface**

Open `src/shared/interfaces/session.ts`. Add `isManual: boolean` after `pausedSeconds`:

```typescript
export interface StudySession {
  id: string
  plannedSessionId: string
  cycleSubjectId: string
  subjectId: string
  startedAt: string
  endedAt: string | null
  studySeconds: number
  reviewSeconds: number
  pausedSeconds: number
  isManual: boolean   // ← add this line
}
```

- [ ] **Step 2: Create the migration file**

Create `src/shared/database/migrations/002_add_is_manual.ts`:

```typescript
// src/shared/database/migrations/002_add_is_manual.ts
import type { SQLiteDatabase } from 'expo-sqlite'

export async function migration002(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    ALTER TABLE study_sessions ADD COLUMN is_manual INTEGER NOT NULL DEFAULT 0;
  `)
}
```

- [ ] **Step 3: Register the migration**

Open `src/shared/database/migrations/index.ts`. Add the import and entry:

```typescript
// src/shared/database/migrations/index.ts
import type { SQLiteDatabase } from 'expo-sqlite'
import { migration001 } from './001_initial'
import { migration002 } from './002_add_is_manual'

const MIGRATIONS = [
  { id: 1, name: '001_initial', fn: migration001 },
  { id: 2, name: '002_add_is_manual', fn: migration002 },
]

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `)

  const applied = await db.getAllAsync<{ id: number }>(
    'SELECT id FROM migrations'
  )
  const appliedIds = new Set(applied.map((r) => r.id))

  for (const migration of MIGRATIONS) {
    if (!appliedIds.has(migration.id)) {
      await db.withTransactionAsync(async () => {
        await migration.fn(db)
        await db.runAsync(
          'INSERT INTO migrations (id, name, applied_at) VALUES (?, ?, ?)',
          [migration.id, migration.name, new Date().toISOString()]
        )
      })
    }
  }
}
```

- [ ] **Step 4: Verify TypeScript**

```bash
cd concursos-app && pnpm tsc --noEmit
```

Expected: only errors about `isManual` missing from callers of `SessionRepository.create()` — those are fixed in Task 2 and Task 5.

- [ ] **Step 5: Commit**

```bash
git add src/shared/interfaces/session.ts \
        src/shared/database/migrations/002_add_is_manual.ts \
        src/shared/database/migrations/index.ts
git commit -m "feat: add is_manual column migration and StudySession interface field"
```

---

## Task 2: Update SessionRepository

**Files:**
- Modify: `src/shared/database/repositories/session.repository.ts`

- [ ] **Step 1: Update `rowToStudySession` to map the new column**

In the `rowToStudySession` function, add the `isManual` field after `pausedSeconds`:

```typescript
function rowToStudySession(row: Record<string, unknown>): StudySession {
  return {
    id: row.id as string,
    plannedSessionId: row.planned_session_id as string,
    cycleSubjectId: row.cycle_subject_id as string,
    subjectId: row.subject_id as string,
    startedAt: row.started_at as string,
    endedAt: row.ended_at as string | null,
    studySeconds: row.study_seconds as number,
    reviewSeconds: row.review_seconds as number,
    pausedSeconds: row.paused_seconds as number,
    isManual: (row.is_manual as number) === 1,
  }
}
```

- [ ] **Step 2: Update `create()` to accept and persist `isManual`**

Replace the `create` method body with:

```typescript
async create(data: Omit<StudySession, 'id'>): Promise<StudySession> {
  const db = await getDatabase()
  const id = randomUUID()
  await db.runAsync(
    `INSERT INTO study_sessions
     (id, planned_session_id, cycle_subject_id, subject_id, started_at, ended_at,
      study_seconds, review_seconds, paused_seconds, is_manual)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, data.plannedSessionId, data.cycleSubjectId, data.subjectId,
      data.startedAt, data.endedAt, data.studySeconds, data.reviewSeconds,
      data.pausedSeconds, data.isManual ? 1 : 0,
    ]
  )
  return { ...data, id }
},
```

- [ ] **Step 3: Add `getInProgressByPlannedSession()`**

Add this method to `SessionRepository` (after `getByDateRange`):

```typescript
async getInProgressByPlannedSession(plannedSessionId: string): Promise<StudySession | null> {
  const db = await getDatabase()
  const row = await db.getFirstAsync<Record<string, unknown>>(
    `SELECT * FROM study_sessions
     WHERE planned_session_id = ? AND ended_at IS NULL
     ORDER BY started_at DESC LIMIT 1`,
    [plannedSessionId]
  )
  return row ? rowToStudySession(row) : null
},
```

- [ ] **Step 4: Add `getByPlannedSessionId()`**

```typescript
async getByPlannedSessionId(plannedSessionId: string): Promise<StudySession | null> {
  const db = await getDatabase()
  const row = await db.getFirstAsync<Record<string, unknown>>(
    `SELECT * FROM study_sessions
     WHERE planned_session_id = ?
     ORDER BY started_at DESC LIMIT 1`,
    [plannedSessionId]
  )
  return row ? rowToStudySession(row) : null
},
```

- [ ] **Step 5: Add `deleteById()`**

```typescript
async deleteById(id: string): Promise<void> {
  const db = await getDatabase()
  await db.runAsync('DELETE FROM study_sessions WHERE id = ?', [id])
},
```

- [ ] **Step 6: Commit**

```bash
git add src/shared/database/repositories/session.repository.ts
git commit -m "feat: update SessionRepository with isManual field and new query methods"
```

---

## Task 3: Update CycleRepository

**Files:**
- Modify: `src/shared/database/repositories/cycle.repository.ts`

- [ ] **Step 1: Add `ORDER BY id ASC` to `getCycleSubjects`**

Find the `getCycleSubjects` method and update its query:

```typescript
async getCycleSubjects(cycleId: string): Promise<CycleSubject[]> {
  const db = await getDatabase()
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM cycle_subjects WHERE cycle_id = ? ORDER BY id ASC',
    [cycleId]
  )
  return rows.map(rowToCycleSubject)
},
```

- [ ] **Step 2: Add `decrementCycleSubjectHours()`**

Add after `incrementCycleSubjectHours`:

```typescript
async decrementCycleSubjectHours(cycleSubjectId: string, hours: number): Promise<void> {
  const db = await getDatabase()
  await db.runAsync(
    'UPDATE cycle_subjects SET completed_hours = MAX(0, completed_hours - ?) WHERE id = ?',
    [hours, cycleSubjectId]
  )
},
```

Note: `MAX(0, ...)` prevents negative values in case of data inconsistency.

- [ ] **Step 3: Commit**

```bash
git add src/shared/database/repositories/cycle.repository.ts
git commit -m "feat: add decrementCycleSubjectHours and stable ORDER BY to CycleRepository"
```

---

## Task 4: Update PlannedSessionRepository

**Files:**
- Modify: `src/shared/database/repositories/planned-session.repository.ts`

- [ ] **Step 1: Add `resetStatus()`**

Add after `updateStatus`:

```typescript
async resetStatus(id: string): Promise<void> {
  const db = await getDatabase()
  await db.runAsync(
    "UPDATE planned_sessions SET status = 'pending' WHERE id = ?",
    [id]
  )
},
```

- [ ] **Step 2: Commit**

```bash
git add src/shared/database/repositories/planned-session.repository.ts
git commit -m "feat: add PlannedSessionRepository.resetStatus"
```

---

## Task 5: Fix use-save-session.mutation.ts

**Files:**
- Modify: `src/shared/queries/sessions/use-save-session.mutation.ts`

- [ ] **Step 1: Add `isManual: false` to the `SessionRepository.create()` call**

Find the `SessionRepository.create({...})` call inside `db.withTransactionAsync` and add `isManual: false`:

```typescript
await SessionRepository.create({
  plannedSessionId: input.plannedSessionId,
  cycleSubjectId: input.cycleSubjectId,
  subjectId: input.subjectId,
  startedAt: input.startedAt,
  endedAt,
  studySeconds: input.studySeconds,
  reviewSeconds: input.reviewSeconds,
  pausedSeconds: input.pausedSeconds,
  isManual: false,   // ← add this line
})
```

- [ ] **Step 2: Verify TypeScript is clean**

```bash
cd concursos-app && pnpm tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/shared/queries/sessions/use-save-session.mutation.ts
git commit -m "fix: pass isManual: false in useSaveSessionMutation"
```

---

## Task 6: useRegisterManualSessionMutation

**Files:**
- Create: `src/shared/queries/cycles/use-register-manual-session.mutation.ts`

- [ ] **Step 1: Create the file**

```typescript
// src/shared/queries/cycles/use-register-manual-session.mutation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PlannedSessionRepository } from '@/shared/database/repositories/planned-session.repository'
import { SessionRepository } from '@/shared/database/repositories/session.repository'
import { CycleRepository } from '@/shared/database/repositories/cycle.repository'

interface RegisterManualInput {
  plannedSessionId: string
  minutes: number
}

export function useRegisterManualSessionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ plannedSessionId, minutes }: RegisterManualInput) => {
      const plannedSession = await PlannedSessionRepository.getById(plannedSessionId)
      if (!plannedSession) throw new Error('Sessão não encontrada')

      const now = new Date().toISOString()
      const studySeconds = minutes * 60

      await SessionRepository.create({
        plannedSessionId,
        cycleSubjectId: plannedSession.cycleSubjectId,
        subjectId: plannedSession.subjectId,
        startedAt: now,
        endedAt: now,
        studySeconds,
        reviewSeconds: 0,
        pausedSeconds: 0,
        isManual: true,
      })
      await PlannedSessionRepository.updateStatus(plannedSessionId, 'done')
      await CycleRepository.incrementCycleSubjectHours(
        plannedSession.cycleSubjectId,
        studySeconds / 3600
      )
    },
    onSuccess: () => {
      // Partial key — TanStack Query matches all queries whose key starts with these prefixes
      queryClient.invalidateQueries({ queryKey: ['planned-sessions'] })
      queryClient.invalidateQueries({ queryKey: ['cycle-subjects'] })
    },
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/shared/queries/cycles/use-register-manual-session.mutation.ts
git commit -m "feat: add useRegisterManualSessionMutation"
```

---

## Task 7: useUndoSessionMutation

**Files:**
- Create: `src/shared/queries/cycles/use-undo-session.mutation.ts`

- [ ] **Step 1: Create the file**

```typescript
// src/shared/queries/cycles/use-undo-session.mutation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { SessionRepository } from '@/shared/database/repositories/session.repository'
import { CycleRepository } from '@/shared/database/repositories/cycle.repository'
import { PlannedSessionRepository } from '@/shared/database/repositories/planned-session.repository'
import { getDatabase } from '@/shared/database/database'

interface UndoSessionInput {
  plannedSessionId: string
}

export function useUndoSessionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ plannedSessionId }: UndoSessionInput) => {
      const session = await SessionRepository.getByPlannedSessionId(plannedSessionId)
      const db = await getDatabase()

      await db.withTransactionAsync(async () => {
        if (session) {
          await CycleRepository.decrementCycleSubjectHours(
            session.cycleSubjectId,
            session.studySeconds / 3600
          )
          await SessionRepository.deleteById(session.id)
        }
        await PlannedSessionRepository.resetStatus(plannedSessionId)
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planned-sessions'] })
      queryClient.invalidateQueries({ queryKey: ['cycle-subjects'] })
    },
  })
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd concursos-app && pnpm tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/shared/queries/cycles/use-undo-session.mutation.ts
git commit -m "feat: add useUndoSessionMutation"
```

---

## Task 8: HomeHeader Component

**Files:**
- Create: `src/screens/Home/components/HomeHeader/HomeHeader.view.tsx`

The header bar with a hamburger button (opens Drawer), centered "Início" title, and user avatar on the right.

- [ ] **Step 1: Create the file**

```typescript
// src/screens/Home/components/HomeHeader/HomeHeader.view.tsx
import { colors } from '@/constants/colors'
import { useNavigation } from '@react-navigation/native'
import type { DrawerNavigationProp } from '@react-navigation/drawer'
import { Ionicons } from '@expo/vector-icons'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface Props {
  userPhotoUrl: string | null
}

export const HomeHeaderView = ({ userPhotoUrl }: Props) => {
  const navigation = useNavigation<DrawerNavigationProp<any>>()

  const handleOpenDrawer = () => {
    navigation.getParent<DrawerNavigationProp<any>>()?.openDrawer()
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleOpenDrawer} style={styles.iconButton}>
        <Ionicons name="menu" size={24} color={colors.grayscale.gray100} />
      </TouchableOpacity>

      <Text style={styles.title}>Início</Text>

      {userPhotoUrl ? (
        <Image source={{ uri: userPhotoUrl }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarFallback}>
          <Ionicons name="person" size={18} color={colors.grayscale.gray400} />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  iconButton: { padding: 4 },
  title: {
    fontSize: 18,
    color: colors.grayscale.gray100,
    fontFamily: 'Baloo2_800ExtraBold',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/Home/components/HomeHeader/HomeHeader.view.tsx
git commit -m "feat: add HomeHeader component with drawer trigger and avatar"
```

---

## Task 9: CycleCircle Component

**Files:**
- Create: `src/screens/Home/components/CycleCircle/CycleCircle.view.tsx`

SVG ring with arc segments per session. Uses `react-native-svg` (already installed). Each arc is drawn as a `Path` element using the SVG `arc` command.

- [ ] **Step 1: Create the file**

```typescript
// src/screens/Home/components/CycleCircle/CycleCircle.view.tsx
import { colors } from '@/constants/colors'
import type { PlannedSession } from '@/shared/interfaces/cycle'
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useEffect, useRef, useMemo } from 'react'
import Svg, { Circle, Path } from 'react-native-svg'

const SUBJECT_COLORS = [
  '#4F6CF7', '#FF9800', '#9C27B0', '#00BCD4', '#F44336', '#4CAF50',
  '#FF5722', '#3F51B5', '#009688', '#FFC107', '#E91E63', '#607D8B',
]

const DONE_COLOR = '#4CAF50'
const GAP_DEGREES = 3

interface Segment {
  session: PlannedSession
  color: string
  startDeg: number
  sweepDeg: number
}

function polarToXY(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  }
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const start = polarToXY(cx, cy, r, startDeg)
  const end = polarToXY(cx, cy, r, endDeg)
  const largeArc = endDeg - startDeg > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`
}

interface Props {
  sessions: PlannedSession[]
  subjectColorMap: Map<string, string>
  centerState: 'no_cycle' | 'all_done' | 'in_progress' | 'next_pending'
  centerSubjectName: string
  centerTimeLabel: string   // HH:mm:ss for pending/elapsed; empty for no_cycle/all_done
  onStart: () => void
  onContinue: () => void
}

export const CycleCircleView = ({
  sessions,
  subjectColorMap,
  centerState,
  centerSubjectName,
  centerTimeLabel,
  onStart,
  onContinue,
}: Props) => {
  const size = Dimensions.get('window').width * 0.80
  const cx = size / 2
  const cy = size / 2
  const strokeWidth = 20
  const r = (size - strokeWidth) / 2

  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (centerState === 'in_progress') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      )
      pulse.start()
      return () => pulse.stop()
    } else {
      pulseAnim.setValue(1)
    }
  }, [centerState])

  const totalSeconds = useMemo(
    () => sessions.reduce((s, p) => s + p.allocatedSeconds, 0),
    [sessions]
  )

  const segments = useMemo<Segment[]>(() => {
    if (!totalSeconds) return []
    let currentDeg = 0
    return sessions.map((session) => {
      const sweep = Math.max(
        0,
        (session.allocatedSeconds / totalSeconds) * 360 - GAP_DEGREES
      )
      const seg: Segment = {
        session,
        color: session.status === 'done'
          ? DONE_COLOR
          : (subjectColorMap.get(session.subjectId) ?? SUBJECT_COLORS[0]),
        startDeg: currentDeg,
        sweepDeg: sweep,
      }
      currentDeg += (session.allocatedSeconds / totalSeconds) * 360
      return seg
    })
  }, [sessions, subjectColorMap, totalSeconds])

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Track circle */}
        <Circle
          cx={cx} cy={cy} r={r}
          stroke={colors.background.elevated}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Segments */}
        {segments.map((seg) => {
          if (seg.sweepDeg <= 0) return null
          const opacity = seg.session.status === 'in_progress' ? undefined : 1
          return (
            <Path
              key={seg.session.id}
              d={arcPath(cx, cy, r, seg.startDeg, seg.startDeg + seg.sweepDeg)}
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              fill="none"
              opacity={opacity}
            />
          )
        })}
      </Svg>

      {/* Pulsing overlay for in_progress segment */}
      {centerState === 'in_progress' && segments.length > 0 && (() => {
        const inProg = segments.find((s) => s.session.status === 'in_progress')
        if (!inProg) return null
        return (
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: pulseAnim }]} pointerEvents="none">
            <Svg width={size} height={size}>
              <Path
                d={arcPath(cx, cy, r, inProg.startDeg, inProg.startDeg + inProg.sweepDeg)}
                stroke={inProg.color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                fill="none"
              />
            </Svg>
          </Animated.View>
        )
      })()}

      {/* Center content */}
      <View style={styles.center} pointerEvents="box-none">
        {centerState === 'no_cycle' && (
          <Text style={styles.centerLabel}>Nenhum ciclo ativo</Text>
        )}
        {centerState === 'all_done' && (
          <Text style={styles.centerLabel}>Ciclo concluído!</Text>
        )}
        {(centerState === 'next_pending' || centerState === 'in_progress') && (
          <>
            <Text style={styles.subjectName} numberOfLines={2}>{centerSubjectName}</Text>
            <Text style={styles.timeLabel}>{centerTimeLabel}</Text>
            {centerState === 'next_pending' && (
              <TouchableOpacity style={styles.actionButton} onPress={onStart}>
                <Text style={styles.actionText}>Iniciar</Text>
              </TouchableOpacity>
            )}
            {centerState === 'in_progress' && (
              <TouchableOpacity style={styles.actionButton} onPress={onContinue}>
                <Text style={styles.actionText}>Continuar</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { alignSelf: 'center', position: 'relative', justifyContent: 'center', alignItems: 'center' },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '55%',
    gap: 6,
  },
  centerLabel: { color: colors.grayscale.gray400, fontSize: 14, textAlign: 'center' },
  subjectName: {
    color: colors.grayscale.gray100,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  timeLabel: { color: colors.grayscale.gray400, fontSize: 13, fontVariant: ['tabular-nums'] },
  actionButton: {
    backgroundColor: colors.brand.primary,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginTop: 4,
  },
  actionText: { color: '#fff', fontWeight: '700', fontSize: 14 },
})
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/Home/components/CycleCircle/CycleCircle.view.tsx
git commit -m "feat: add CycleCircle SVG component with arc segments and pulse animation"
```

---

## Task 10: SessionRow Component

**Files:**
- Create: `src/screens/Home/components/SessionList/SessionRow.view.tsx`

Single row with subject name, allocated time, remaining time, play/done icon, and ⋮ action menu.

- [ ] **Step 1: Create the file**

```typescript
// src/screens/Home/components/SessionList/SessionRow.view.tsx
import { colors } from '@/constants/colors'
import type { PlannedSession } from '@/shared/interfaces/cycle'
import { Ionicons } from '@expo/vector-icons'
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

function formatSeconds(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

interface Props {
  session: PlannedSession
  subjectName: string
  subjectColor: string
  elapsedSeconds: number   // Only meaningful for in_progress; 0 otherwise
  onPlay: (id: string) => void
  onOpenManualModal: (session: PlannedSession) => void
  onUndo: (id: string) => void
}

export const SessionRowView = ({
  session,
  subjectName,
  subjectColor,
  elapsedSeconds,
  onPlay,
  onOpenManualModal,
  onUndo,
}: Props) => {
  const isDone = session.status === 'done'
  const isInProgress = session.status === 'in_progress'

  const remaining =
    isDone ? 0
    : isInProgress ? Math.max(0, session.allocatedSeconds - elapsedSeconds)
    : session.allocatedSeconds

  const handleMenu = () => {
    if (isDone) {
      Alert.alert('Sessão', subjectName, [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desfazer execução',
          style: 'destructive',
          onPress: () => onUndo(session.id),
        },
      ])
    } else {
      Alert.alert('Sessão', subjectName, [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Registrar como feito',
          onPress: () => onOpenManualModal(session),
        },
      ])
    }
  }

  return (
    <View style={[styles.row, isDone && styles.rowDone]}>
      <View style={[styles.colorDot, { backgroundColor: isDone ? '#4CAF50' : subjectColor }]} />

      <View style={styles.info}>
        <Text style={styles.subjectName} numberOfLines={1}>{subjectName}</Text>
        <Text style={styles.sessionTime}>{formatSeconds(session.allocatedSeconds)}</Text>
      </View>

      <View style={styles.remaining}>
        <Ionicons name="time-outline" size={12} color={colors.grayscale.gray500} />
        <Text style={styles.remainingText}>{formatSeconds(remaining)}</Text>
      </View>

      {isDone ? (
        <Ionicons name="checkmark-circle" size={28} color="#4CAF50" style={styles.actionIcon} />
      ) : (
        <TouchableOpacity onPress={() => onPlay(session.id)} style={styles.actionIcon}>
          <Ionicons
            name={isInProgress ? 'play-circle' : 'play-circle-outline'}
            size={28}
            color={isInProgress ? colors.brand.primary : colors.grayscale.gray400}
          />
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={handleMenu} style={styles.menuButton}>
        <Ionicons name="ellipsis-vertical" size={18} color={colors.grayscale.gray500} />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  rowDone: { opacity: 0.6 },
  colorDot: { width: 8, height: 8, borderRadius: 4 },
  info: { flex: 1 },
  subjectName: { color: colors.grayscale.gray100, fontSize: 14, fontWeight: '600' },
  sessionTime: { color: colors.grayscale.gray500, fontSize: 12, marginTop: 2 },
  remaining: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  remainingText: { color: colors.grayscale.gray500, fontSize: 12, fontVariant: ['tabular-nums'] },
  actionIcon: { paddingHorizontal: 4 },
  menuButton: { padding: 4 },
})
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/Home/components/SessionList/SessionRow.view.tsx
git commit -m "feat: add SessionRow component with play, done, and context menu"
```

---

## Task 11: SessionList Component

**Files:**
- Create: `src/screens/Home/components/SessionList/SessionList.view.tsx`

- [ ] **Step 1: Create the file**

```typescript
// src/screens/Home/components/SessionList/SessionList.view.tsx
import { colors } from '@/constants/colors'
import type { PlannedSession } from '@/shared/interfaces/cycle'
import { StyleSheet, Text, View } from 'react-native'
import { SessionRowView } from './SessionRow.view'

interface Props {
  sessions: PlannedSession[]
  subjectNameMap: Map<string, string>   // subjectId → name
  subjectColorMap: Map<string, string>  // subjectId → hex color
  inProgressElapsedSeconds: number      // elapsed for whichever session is in_progress
  inProgressSessionId: string | null    // which session is in_progress (if any)
  onPlay: (id: string) => void
  onOpenManualModal: (session: PlannedSession) => void
  onUndo: (id: string) => void
}

export const SessionListView = ({
  sessions,
  subjectNameMap,
  subjectColorMap,
  inProgressElapsedSeconds,
  inProgressSessionId,
  onPlay,
  onOpenManualModal,
  onUndo,
}: Props) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Sessões</Text>
      <View style={styles.list}>
        {sessions.map((session) => (
          <SessionRowView
            key={session.id}
            session={session}
            subjectName={subjectNameMap.get(session.subjectId) ?? '—'}
            subjectColor={subjectColorMap.get(session.subjectId) ?? '#4F6CF7'}
            elapsedSeconds={session.id === inProgressSessionId ? inProgressElapsedSeconds : 0}
            onPlay={onPlay}
            onOpenManualModal={onOpenManualModal}
            onUndo={onUndo}
          />
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  sectionTitle: {
    fontSize: 16,
    color: colors.grayscale.gray300,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  list: { gap: 8 },
})
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/Home/components/SessionList/SessionList.view.tsx
git commit -m "feat: add SessionList component"
```

---

## Task 12: ManualSessionModal Component

**Files:**
- Create: `src/screens/Home/components/ManualSessionModal/ManualSessionModal.view.tsx`

- [ ] **Step 1: Create the file**

```typescript
// src/screens/Home/components/ManualSessionModal/ManualSessionModal.view.tsx
import { colors } from '@/constants/colors'
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useState } from 'react'

interface Props {
  visible: boolean
  subjectName: string
  isLoading: boolean
  onConfirm: (minutes: number) => void
  onClose: () => void
}

export const ManualSessionModalView = ({
  visible,
  subjectName,
  isLoading,
  onConfirm,
  onClose,
}: Props) => {
  const [minutesText, setMinutesText] = useState('')

  const handleConfirm = () => {
    const minutes = parseFloat(minutesText)
    if (Number.isNaN(minutes) || minutes <= 0) return
    onConfirm(minutes)
  }

  const handleClose = () => {
    setMinutesText('')
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Registrar sessão manualmente</Text>
          <Text style={styles.subtitle}>{subjectName}</Text>

          <Text style={styles.label}>Quanto tempo você estudou? (minutos)</Text>
          <TextInput
            style={styles.input}
            value={minutesText}
            onChangeText={setMinutesText}
            keyboardType="decimal-pad"
            placeholder="ex: 120"
            placeholderTextColor={colors.grayscale.gray600}
            autoFocus
          />

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, isLoading && styles.buttonDisabled]}
              onPress={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.confirmText}>Confirmar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.background.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    gap: 12,
  },
  title: {
    fontSize: 18,
    color: colors.grayscale.gray100,
    fontFamily: 'Baloo2_800ExtraBold',
  },
  subtitle: { fontSize: 14, color: colors.grayscale.gray400 },
  label: { fontSize: 13, color: colors.grayscale.gray400 },
  input: {
    backgroundColor: colors.background.elevated,
    borderRadius: 8,
    padding: 12,
    color: colors.grayscale.gray100,
    fontSize: 16,
  },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.grayscale.gray700,
    alignItems: 'center',
  },
  cancelText: { color: colors.grayscale.gray400, fontWeight: '600' },
  confirmButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  confirmText: { color: '#fff', fontWeight: '700' },
})
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/Home/components/ManualSessionModal/ManualSessionModal.view.tsx
git commit -m "feat: add ManualSessionModal component"
```

---

## Task 13: useHomeViewModel Rewrite

**Files:**
- Rewrite: `src/screens/Home/useHome.viewModel.ts`

This ViewModel replaces the old recommendation-focused one entirely.

Key responsibilities:
- Load planned sessions and cycle subjects
- Derive circle center state and segment data
- Track wall-clock elapsed time for `in_progress` session (setInterval)
- Handle play, manual register, undo, open/close modal, open new cycle

- [ ] **Step 1: Rewrite the file**

```typescript
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

  const registerManualMutation = useRegisterManualSessionMutation()
  const undoMutation = useUndoSessionMutation()

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
    SessionRepository.getInProgressByPlannedSession(inProgressSession.id).then((ss) => {
      setInProgressStartedAt(ss?.startedAt ?? null)
    })
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
    registerManualMutation.mutate(
      { plannedSessionId, minutes },
      { onSuccess: () => setModalSession(null) }
    )
  }, [registerManualMutation])

  const handleUndoSession = useCallback((plannedSessionId: string) => {
    undoMutation.mutate({ plannedSessionId })
  }, [undoMutation])

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
    isRegisteringManual: registerManualMutation.isPending,
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
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd concursos-app && pnpm tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/screens/Home/useHome.viewModel.ts
git commit -m "feat: rewrite useHomeViewModel for cycle circle dashboard"
```

---

## Task 14: Home.view.tsx Rewrite

**Files:**
- Rewrite: `src/screens/Home/Home.view.tsx`

- [ ] **Step 1: Rewrite the file**

```typescript
// src/screens/Home/Home.view.tsx
import { colors } from '@/constants/colors'
import { Ionicons } from '@expo/vector-icons'
import BottomSheet from '@gorhom/bottom-sheet'
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NewCycleBottomSheetView } from '@/screens/Cycle/components/NewCycleBottomSheet/NewCycleBottomSheet.view'
import { HomeHeaderView } from './components/HomeHeader/HomeHeader.view'
import { CycleCircleView } from './components/CycleCircle/CycleCircle.view'
import { SessionListView } from './components/SessionList/SessionList.view'
import { ManualSessionModalView } from './components/ManualSessionModal/ManualSessionModal.view'
import { useHomeViewModel } from './useHome.viewModel'

export const HomeView = () => {
  const {
    user,
    plannedSessions,
    subjectColorMap,
    subjectNameMap,
    centerState,
    centerSubjectName,
    centerTimeLabel,
    inProgressSessionId,
    inProgressElapsedSeconds,
    modalSession,
    modalSubjectName,
    isRegisteringManual,
    bottomSheetRef,
    handlePlaySession,
    handleContinueSession,
    handleRegisterManual,
    handleUndoSession,
    handleOpenModal,
    handleCloseModal,
    handleOpenNewCycle,
  } = useHomeViewModel()

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <HomeHeaderView userPhotoUrl={user?.photoUrl ?? null} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <CycleCircleView
          sessions={plannedSessions}
          subjectColorMap={subjectColorMap}
          centerState={centerState}
          centerSubjectName={centerSubjectName}
          centerTimeLabel={centerTimeLabel}
          onStart={() => {
            const next = plannedSessions.find((s) => s.status === 'pending')
            if (next) handlePlaySession(next.id)
          }}
          onContinue={handleContinueSession}
        />

        {plannedSessions.length > 0 && (
          <SessionListView
            sessions={plannedSessions}
            subjectNameMap={subjectNameMap}
            subjectColorMap={subjectColorMap}
            inProgressElapsedSeconds={inProgressElapsedSeconds}
            inProgressSessionId={inProgressSessionId}
            onPlay={handlePlaySession}
            onOpenManualModal={handleOpenModal}
            onUndo={handleUndoSession}
          />
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleOpenNewCycle}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Manual Registration Modal */}
      <ManualSessionModalView
        visible={!!modalSession}
        subjectName={modalSubjectName}
        isLoading={isRegisteringManual}
        onConfirm={(minutes) => {
          if (modalSession) handleRegisterManual(modalSession.id, minutes)
        }}
        onClose={handleCloseModal}
      />

      {/* New Cycle Bottom Sheet */}
      <BottomSheet ref={bottomSheetRef} index={-1} snapPoints={['85%']} enablePanDownToClose>
        <NewCycleBottomSheetView onClose={() => bottomSheetRef.current?.close()} />
      </BottomSheet>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
    gap: 24,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
})
```

- [ ] **Step 2: Final TypeScript check**

```bash
cd concursos-app && pnpm tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/screens/Home/Home.view.tsx
git commit -m "feat: rewrite Home screen with CycleCircle, SessionList, FAB, and drawer header"
```

---

## Verification Checklist

After all tasks are complete, start the dev server (`pnpm start` in `concursos-app/`) and verify manually:

- [ ] Home screen shows header with hamburger (☰) that opens the drawer
- [ ] User avatar or person icon appears top right
- [ ] With an active cycle: circle shows colored arc segments for each session
- [ ] Sessions `done` show green segments in the circle
- [ ] Circle center shows next pending session name + time + "Iniciar" button
- [ ] Tapping "Iniciar" marks session `in_progress` and navigates to `/session`
- [ ] Returning from `/session` shows the session as `in_progress` with elapsed timer
- [ ] Circle center shows "Continuar" for `in_progress` session
- [ ] All sessions `done` → circle center shows "Ciclo concluído!"
- [ ] No active cycle → circle center shows "Nenhum ciclo ativo"
- [ ] Session list shows all sessions with correct status icons
- [ ] ⋮ menu on `pending`/`in_progress` session → "Registrar como feito"
- [ ] Manual registration modal accepts minutes and closes on confirm
- [ ] ⋮ menu on `done` session → "Desfazer execução" reverts to pending
- [ ] FAB (+) opens NewCycleBottomSheet
- [ ] After creating a new cycle, circle updates automatically
