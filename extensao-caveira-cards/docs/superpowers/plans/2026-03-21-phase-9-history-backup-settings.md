# Phase 9: History, Backup & Settings Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the History screen (sessions by date with weekly/cycle totals), Backup screen (SQLite → Google Drive upload/download, auto-backup toggle), and Settings screen (spreadsheet URL, sync now, notification preferences).

**Architecture:** History queries SQLite `study_sessions` grouped by date and ISO week. Backup uses `expo-file-system` to read the `.db` file and `drive.client.ts` to upload to AppData. Settings is an extension of the auth setup screen from Phase 2, now with sync trigger and notification toggle. MVVM pattern throughout.

**Tech Stack:** expo-sqlite repositories, TanStack Query, expo-file-system, drive.client.ts, Zustand settings.store, date-fns

**Spec:** `docs/superpowers/specs/2026-03-21-sistema-estudo-concursos-design.md` — Seções 6, 10

**Requires:** Phases 1–8 complete

> **Store naming note:** All stores use camelCase per Phase 1 definitions. Fields are:
> - `auth.store`: `spreadsheetId`, `googleAccessToken`, `googleRefreshToken`, `logout`
> - `cycle.store`: `activeCycleId`, `activeConcursoId`
> - `settings.store`: `autoBackupEnabled`, `setAutoBackup` (Phase 1 name), plus new fields added in Task 36 below
>
> **File paths note:** All `src/...` paths live under `concursos-app/src/...` relative to the repo root (the Expo app lives in the `concursos-app/` subdirectory). The `git add` commands already use the `concursos-app/` prefix.

---

## Task 34: History Queries

**Files:**
- Create: `src/shared/queries/sessions/use-get-history.query.ts`

- [ ] **Step 1: Create use-get-history.query.ts**

```typescript
// src/shared/queries/sessions/use-get-history.query.ts
import { useQuery } from '@tanstack/react-query'
import { SessionRepository } from '@/shared/database/repositories/session.repository'
import { useCycleStore } from '@/shared/stores/cycle.store'

export function useGetSessionHistoryQuery() {
  return useQuery({
    queryKey: ['session-history'],
    queryFn: () => SessionRepository.getAllSessionsGroupedByDate(),
    staleTime: 30_000,
  })
}

export function useGetWeeklySessionsQuery() {
  return useQuery({
    queryKey: ['weekly-sessions'],
    queryFn: () => SessionRepository.getSessionsGroupedByISOWeek(),
    staleTime: 30_000,
  })
}

export function useGetCycleComplianceQuery() {
  const activeConcursoId = useCycleStore((s) => s.activeConcursoId)

  return useQuery({
    queryKey: ['cycle-compliance', activeConcursoId],
    queryFn: () => SessionRepository.getCycleComplianceStats(activeConcursoId!),
    enabled: !!activeConcursoId,
    staleTime: 60_000,
  })
}
```

- [ ] **Step 2: Add missing repository methods to SessionRepository**

Add to `src/shared/database/repositories/session.repository.ts`:

```typescript
// Add these methods to SessionRepository

// Returns sessions grouped by calendar date (YYYY-MM-DD), most recent first
static async getAllSessionsGroupedByDate(): Promise<SessionsByDate[]> {
  const db = await getDatabase()
  const rows = await db.getAllAsync<{
    date: string
    subject_name: string
    study_seconds: number
    review_seconds: number
    session_id: string
  }>(`
    SELECT
      date(ss.started_at) AS date,
      sub.name AS subject_name,
      ss.study_seconds,
      ss.review_seconds,
      ss.id AS session_id
    FROM study_sessions ss
    JOIN subjects sub ON sub.id = ss.subject_id
    ORDER BY ss.started_at DESC
  `)

  // Group by date
  const map = new Map<string, SessionHistoryItem[]>()
  for (const row of rows) {
    if (!map.has(row.date)) map.set(row.date, [])
    map.get(row.date)!.push({
      sessionId: row.session_id,
      subjectName: row.subject_name,
      studySeconds: row.study_seconds,
      reviewSeconds: row.review_seconds,
    })
  }

  return Array.from(map.entries()).map(([date, sessions]) => ({
    date,
    sessions,
    totalSeconds: sessions.reduce(
      (acc, s) => acc + s.studySeconds + s.reviewSeconds,
      0
    ),
  }))
}

// Returns sessions grouped by ISO calendar week, most recent first
// Used by the History screen "weekly totals" section
static async getSessionsGroupedByISOWeek(): Promise<SessionsByWeek[]> {
  const db = await getDatabase()
  const rows = await db.getAllAsync<{
    iso_year: number
    iso_week: number
    subject_name: string
    total_seconds: number
  }>(`
    SELECT
      CAST(strftime('%Y', ss.started_at) AS INTEGER) AS iso_year,
      CAST(strftime('%W', ss.started_at) AS INTEGER) AS iso_week,
      sub.name AS subject_name,
      SUM(ss.study_seconds + ss.review_seconds) AS total_seconds
    FROM study_sessions ss
    JOIN subjects sub ON sub.id = ss.subject_id
    GROUP BY iso_year, iso_week, ss.subject_id
    ORDER BY iso_year DESC, iso_week DESC
  `)

  // Group by week key
  const map = new Map<string, WeeklySubjectTotal[]>()
  for (const row of rows) {
    const key = `${row.iso_year}-W${String(row.iso_week).padStart(2, '0')}`
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push({ subjectName: row.subject_name, totalSeconds: row.total_seconds })
  }

  return Array.from(map.entries()).map(([weekKey, subjects]) => ({
    weekKey,
    subjects,
    totalSeconds: subjects.reduce((acc, s) => acc + s.totalSeconds, 0),
  }))
}

// Returns compliance stats per cycle: planned_hours vs completed_hours
// Note: completed_hours is summed from cycle_subjects (written by use-save-session.mutation),
// which keeps it in sync with cycles.completed_hours. Both columns are updated together.
static async getCycleComplianceStats(concursoId: string): Promise<CycleComplianceStat[]> {
  const db = await getDatabase()
  return db.getAllAsync<CycleComplianceStat>(`
    SELECT
      c.id AS cycle_id,
      c.cycle_number,
      c.planned_hours,
      c.status,
      COALESCE(SUM(cs.completed_hours), 0) AS completed_hours
    FROM cycles c
    LEFT JOIN cycle_subjects cs ON cs.cycle_id = c.id
    WHERE c.concurso_id = ?
    GROUP BY c.id
    ORDER BY c.cycle_number DESC
    LIMIT 10
  `, [concursoId])
}
```

- [ ] **Step 3: Add interfaces**

Add to `src/shared/interfaces/session.ts` (or create it):

```typescript
export interface SessionHistoryItem {
  sessionId: string
  subjectName: string
  studySeconds: number
  reviewSeconds: number
}

export interface SessionsByDate {
  date: string           // 'YYYY-MM-DD'
  sessions: SessionHistoryItem[]
  totalSeconds: number
}

export interface WeeklySubjectTotal {
  subjectName: string
  totalSeconds: number
}

export interface SessionsByWeek {
  weekKey: string               // e.g. '2026-W12'
  subjects: WeeklySubjectTotal[]
  totalSeconds: number
}

export interface CycleComplianceStat {
  cycle_id: string
  cycle_number: number
  planned_hours: number
  completed_hours: number
  status: 'active' | 'completed' | 'late'
}
```

- [ ] **Step 4: Commit**

```bash
npx tsc --noEmit
git add concursos-app/src/shared/queries/sessions/use-get-history.query.ts \
        concursos-app/src/shared/interfaces/session.ts \
        concursos-app/src/shared/database/repositories/session.repository.ts
git commit -m "feat: add session history and cycle compliance queries"
```

---

## Task 35: History Screen MVVM

**Files:**
- Create: `src/screens/History/useHistory.viewModel.ts`
- Create: `src/screens/History/History.view.tsx`
- Create: `src/screens/History/components/DayCard/DayCard.view.tsx`
- Create: `src/screens/History/components/CycleComplianceCard/CycleComplianceCard.view.tsx`
- Modify: `src/app/(private)/history.tsx`

- [ ] **Step 1: Create useHistory.viewModel.ts**

```typescript
// src/screens/History/useHistory.viewModel.ts
import {
  useGetSessionHistoryQuery,
  useGetWeeklySessionsQuery,
  useGetCycleComplianceQuery,
} from '@/shared/queries/sessions/use-get-history.query'
import { formatSeconds } from '@/shared/helpers/time.helper'

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
    totalStudiedFormatted: formatSeconds(totalStudiedSeconds),
    isLoading: loadingSessions || loadingWeekly || loadingCycles,
  }
}
```

- [ ] **Step 2: Create DayCard component**

```typescript
// src/screens/History/components/DayCard/DayCard.view.tsx
import { colors } from '@/constants/colors'
import { formatSeconds } from '@/shared/helpers/time.helper'
import { StyleSheet, Text, View } from 'react-native'
import type { SessionsByDate } from '@/shared/interfaces/session'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Props {
  day: SessionsByDate
}

export const DayCardView = ({ day }: Props) => {
  const label = format(parseISO(day.date), "EEE, dd 'de' MMM", { locale: ptBR })

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.date}>{label}</Text>
        <Text style={styles.total}>{formatSeconds(day.totalSeconds)}</Text>
      </View>
      {day.sessions.map((s) => (
        <View key={s.sessionId} style={styles.row}>
          <Text style={styles.subject} numberOfLines={1}>{s.subjectName}</Text>
          <Text style={styles.time}>{formatSeconds(s.studySeconds)}</Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: colors.background.elevated,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  date: { fontSize: 13, fontWeight: '600', color: colors.grayscale.gray300 },
  total: { fontSize: 13, fontWeight: '700', color: colors.brand.primary },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  subject: { fontSize: 13, color: colors.grayscale.gray200, flex: 1 },
  time: { fontSize: 13, color: colors.grayscale.gray400 },
})
```

- [ ] **Step 3: Create CycleComplianceCard component**

```typescript
// src/screens/History/components/CycleComplianceCard/CycleComplianceCard.view.tsx
import { colors } from '@/constants/colors'
import { StyleSheet, Text, View } from 'react-native'
import type { CycleComplianceStat } from '@/shared/interfaces/session'

interface Props {
  stat: CycleComplianceStat
}

export const CycleComplianceCardView = ({ stat }: Props) => {
  const ratio =
    stat.planned_hours > 0
      ? Math.min(stat.completed_hours / stat.planned_hours, 1)
      : 0
  const pct = Math.round(ratio * 100)
  const isLate = stat.status === 'late'

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.label}>Ciclo #{stat.cycle_number}</Text>
        <Text style={[styles.pct, isLate && styles.pctLate]}>{pct}%</Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${pct}%` as any },
            pct >= 80 ? styles.fillGood : styles.fillWeak,
          ]}
        />
      </View>
      <Text style={styles.sub}>
        {stat.completed_hours.toFixed(1)}h / {stat.planned_hours.toFixed(1)}h planejadas
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.elevated,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    gap: 6,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 13, fontWeight: '600', color: colors.grayscale.gray200 },
  pct: { fontSize: 13, fontWeight: '700', color: colors.brand.primary },
  pctLate: { color: colors.status.warning },
  track: { height: 4, backgroundColor: colors.background.primary, borderRadius: 2, overflow: 'hidden' },
  fill: { height: 4, borderRadius: 2 },
  fillGood: { backgroundColor: colors.status.success },
  fillWeak: { backgroundColor: colors.status.warning },
  sub: { fontSize: 11, color: colors.grayscale.gray500 },
})
```

- [ ] **Step 4: Create History.view.tsx**

```typescript
// src/screens/History/History.view.tsx
import { colors } from '@/constants/colors'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { DayCardView } from './components/DayCard/DayCard.view'
import { CycleComplianceCardView } from './components/CycleComplianceCard/CycleComplianceCard.view'
import { useHistoryViewModel } from './useHistory.viewModel'
import { formatSeconds } from '@/shared/helpers/time.helper'

export const HistoryView = () => {
  const { sessionsByDate, sessionsByWeek, cycleStats, totalStudiedFormatted, isLoading } =
    useHistoryViewModel()

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.pageTitle}>Histórico</Text>

      {isLoading ? (
        <ActivityIndicator color={colors.brand.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Total geral */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total estudado</Text>
            <Text style={styles.summaryValue}>{totalStudiedFormatted}</Text>
          </View>

          {/* Totais por semana ISO (spec: "por semana (ISO calendar week)") */}
          {sessionsByWeek.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Por semana</Text>
              {sessionsByWeek.map((week) => (
                <View key={week.weekKey} style={styles.weekCard}>
                  <View style={styles.weekHeader}>
                    <Text style={styles.weekKey}>{week.weekKey}</Text>
                    <Text style={styles.weekTotal}>{formatSeconds(week.totalSeconds)}</Text>
                  </View>
                  {week.subjects.map((s) => (
                    <View key={s.subjectName} style={styles.weekRow}>
                      <Text style={styles.weekSubject} numberOfLines={1}>{s.subjectName}</Text>
                      <Text style={styles.weekTime}>{formatSeconds(s.totalSeconds)}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}

          {/* Cumprimento por ciclo */}
          {cycleStats.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cumprimento por ciclo</Text>
              {cycleStats.map((stat) => (
                <CycleComplianceCardView key={stat.cycle_id} stat={stat} />
              ))}
            </View>
          )}

          {/* Sessões por data */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sessões</Text>
            {sessionsByDate.length === 0 ? (
              <Text style={styles.empty}>Nenhuma sessão registrada ainda.</Text>
            ) : (
              sessionsByDate.map((day) => (
                <DayCardView key={day.date} day={day} />
              ))
            )}
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.grayscale.gray100,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: colors.background.elevated,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: { fontSize: 14, color: colors.grayscale.gray400 },
  summaryValue: { fontSize: 22, fontWeight: '700', color: colors.brand.primary },
  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.grayscale.gray400,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  empty: { fontSize: 14, color: colors.grayscale.gray500, textAlign: 'center', marginTop: 24 },
  weekCard: {
    backgroundColor: colors.background.elevated,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    gap: 6,
  },
  weekHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  weekKey: { fontSize: 12, fontWeight: '700', color: colors.grayscale.gray300 },
  weekTotal: { fontSize: 12, fontWeight: '700', color: colors.brand.primary },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  weekSubject: { fontSize: 12, color: colors.grayscale.gray200, flex: 1 },
  weekTime: { fontSize: 12, color: colors.grayscale.gray400 },
})
```

- [ ] **Step 5: Wire route**

```typescript
// src/app/(private)/history.tsx
import { HistoryView } from '@/screens/History/History.view'
export default HistoryView
```

- [ ] **Step 6: Commit**

```bash
git add concursos-app/src/screens/History/ \
        concursos-app/src/app/\(private\)/history.tsx
git commit -m "feat: implement History screen with session log and cycle compliance stats"
```

---

## Task 36: BackupService

**Files:**
- Create: `src/shared/services/backup.service.ts`
- Create: `src/shared/queries/backup/use-backup.mutation.ts`
- Create: `src/shared/queries/backup/use-list-backups.query.ts`
- Create: `src/shared/queries/backup/use-restore-backup.mutation.ts`

- [ ] **Step 1: Create backup.service.ts**

```typescript
// src/shared/services/backup.service.ts
import * as FileSystem from 'expo-file-system'
import { getDriveClient } from '@/shared/api/drive.client'
import { format } from 'date-fns'

const BACKUP_FOLDER = 'sistema-estudo-concursos/backups'
const DB_PATH = `${FileSystem.documentDirectory}SQLite/estudos.db`

export interface BackupFile {
  id: string
  name: string
  createdTime: string
  size: number
}

export const BackupService = {
  /**
   * Uploads current SQLite .db file to Google Drive AppData.
   * Returns the Drive file ID.
   */
  async backupNow(accessToken: string): Promise<string> {
    const name = `backup-${format(new Date(), 'yyyy-MM-dd-HHmm')}.db`
    const dbInfo = await FileSystem.getInfoAsync(DB_PATH)
    if (!dbInfo.exists) throw new Error('Database file not found')

    const fileContent = await FileSystem.readAsStringAsync(DB_PATH, {
      encoding: FileSystem.EncodingType.Base64,
    })

    const client = getDriveClient(accessToken)

    // Create multipart metadata + binary upload
    const metadata = {
      name,
      parents: ['appDataFolder'],
    }

    // Use resumable or multipart upload
    const response = await client.post(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      createMultipartBody(metadata, fileContent),
      {
        headers: {
          'Content-Type': `multipart/related; boundary=boundary_estudos`,
        },
      }
    )

    return response.data.id as string
  },

  /**
   * Lists backup files stored in AppData.
   */
  async listBackups(accessToken: string): Promise<BackupFile[]> {
    const client = getDriveClient(accessToken)
    const res = await client.get(
      'https://www.googleapis.com/drive/v3/files',
      {
        params: {
          spaces: 'appDataFolder',
          fields: 'files(id,name,createdTime,size)',
          q: `name contains 'backup-' and name contains '.db'`,
          orderBy: 'createdTime desc',
        },
      }
    )
    return (res.data.files ?? []) as BackupFile[]
  },

  /**
   * Downloads a backup file and replaces the local SQLite DB.
   * Caller is responsible for restarting Zustand stores after this.
   *
   * Note: We use expo-file-system's downloadAsync instead of axios to avoid
   * needing a Buffer polyfill (Buffer is not natively available in React Native).
   */
  async restoreBackup(accessToken: string, fileId: string): Promise<void> {
    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`
    const tempPath = `${FileSystem.cacheDirectory}restore-temp.db`

    const result = await FileSystem.downloadAsync(downloadUrl, tempPath, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (result.status !== 200) {
      throw new Error(`Download failed with status ${result.status}`)
    }

    // Move the downloaded file to the SQLite DB path
    await FileSystem.moveAsync({ from: tempPath, to: DB_PATH })
  },
}

function createMultipartBody(metadata: object, base64Content: string): string {
  const BOUNDARY = 'boundary_estudos'
  return [
    `--${BOUNDARY}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    `--${BOUNDARY}`,
    'Content-Type: application/octet-stream',
    'Content-Transfer-Encoding: base64',
    '',
    base64Content,
    `--${BOUNDARY}--`,
  ].join('\r\n')
}
```

- [ ] **Step 2: Create backup mutations and query**

```typescript
// src/shared/queries/backup/use-backup.mutation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { BackupService } from '@/shared/services/backup.service'
import { useAuthStore } from '@/shared/stores/auth.store'
import { useSettingsStore } from '@/shared/stores/settings.store'

export function useBackupNowMutation() {
  const googleAccessToken = useAuthStore((s) => s.googleAccessToken)
  const setLastBackupAt = useSettingsStore((s) => s.setLastBackupAt)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => {
      if (!googleAccessToken) throw new Error('Not authenticated')
      return BackupService.backupNow(googleAccessToken)
    },
    onSuccess: () => {
      setLastBackupAt(new Date().toISOString())
      queryClient.invalidateQueries({ queryKey: ['backup-list'] })
    },
  })
}
```

```typescript
// src/shared/queries/backup/use-list-backups.query.ts
import { useQuery } from '@tanstack/react-query'
import { BackupService } from '@/shared/services/backup.service'
import { useAuthStore } from '@/shared/stores/auth.store'

export function useListBackupsQuery() {
  const googleAccessToken = useAuthStore((s) => s.googleAccessToken)

  return useQuery({
    queryKey: ['backup-list'],
    queryFn: () => BackupService.listBackups(googleAccessToken!),
    enabled: !!googleAccessToken,
    staleTime: 60_000,
  })
}
```

```typescript
// src/shared/queries/backup/use-restore-backup.mutation.ts
import { useMutation } from '@tanstack/react-query'
import { BackupService } from '@/shared/services/backup.service'
import { useAuthStore } from '@/shared/stores/auth.store'
import { useCycleStore } from '@/shared/stores/cycle.store'
import { useSessionStore } from '@/shared/stores/session.store'
import { useSettingsStore } from '@/shared/stores/settings.store'
import { Alert } from 'react-native'

export function useRestoreBackupMutation() {
  const googleAccessToken = useAuthStore((s) => s.googleAccessToken)
  // Reset ALL stores per spec Section 10: auth, cycle, session, settings
  const resetAuth = useAuthStore((s) => s.logout)         // logout clears auth store state
  const resetCycle = useCycleStore((s) => s.reset)
  const resetSession = useSessionStore((s) => s.reset)
  const resetSettings = useSettingsStore((s) => s.reset)

  return useMutation({
    mutationFn: (fileId: string) => {
      if (!googleAccessToken) throw new Error('Not authenticated')
      return BackupService.restoreBackup(googleAccessToken, fileId)
    },
    onSuccess: () => {
      // Reset ALL Zustand stores so they re-hydrate from the restored DB (spec Section 10)
      resetAuth()
      resetCycle()
      resetSession()
      resetSettings()
      Alert.alert('Backup restaurado', 'O app será reiniciado com os dados restaurados.')
    },
    onError: (err) => {
      Alert.alert('Erro', `Falha ao restaurar backup: ${(err as Error).message}`)
    },
  })
}
```

- [ ] **Step 3: Expand settings.store with all Phase 9 fields**

Phase 1 defined `settings.store` with only `autoBackupEnabled` and `setAutoBackup`. This step adds the remaining fields needed for Phase 9. Replace `src/shared/stores/settings.store.ts` entirely:

```typescript
// src/shared/stores/settings.store.ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface SettingsStore {
  autoBackupEnabled: boolean
  notificationsEnabled: boolean
  lastBackupAt: string | null
  setAutoBackup: (value: boolean) => void
  setNotificationsEnabled: (value: boolean) => void
  setLastBackupAt: (iso: string) => void
  reset: () => void
}

const initialState = {
  autoBackupEnabled: false,
  notificationsEnabled: true,
  lastBackupAt: null,
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...initialState,
      setAutoBackup: (autoBackupEnabled) => set({ autoBackupEnabled }),
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      setLastBackupAt: (lastBackupAt) => set({ lastBackupAt }),
      reset: () => set(initialState),
    }),
    {
      name: '@concursos:settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
```

Also verify that `cycle.store` and `session.store` expose a `reset()` method (they need it for the restore flow). If they don't, add them following the same pattern as above.

- [ ] **Step 4: Commit**

```bash
npx tsc --noEmit
git add concursos-app/src/shared/services/backup.service.ts \
        concursos-app/src/shared/queries/backup/ \
        concursos-app/src/shared/stores/settings.store.ts
git commit -m "feat: add BackupService with Google Drive upload/download and backup mutations"
```

---

## Task 37: Backup Screen MVVM

**Files:**
- Create: `src/screens/Backup/useBackup.viewModel.ts`
- Create: `src/screens/Backup/Backup.view.tsx`
- Modify: `src/app/(private)/backup.tsx`

- [ ] **Step 1: Create useBackup.viewModel.ts**

```typescript
// src/screens/Backup/useBackup.viewModel.ts
import { useBackupNowMutation } from '@/shared/queries/backup/use-backup.mutation'
import { useListBackupsQuery } from '@/shared/queries/backup/use-list-backups.query'
import { useRestoreBackupMutation } from '@/shared/queries/backup/use-restore-backup.mutation'
import { useSettingsStore } from '@/shared/stores/settings.store'
import { Alert } from 'react-native'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const useBackupViewModel = () => {
  const lastBackupAt = useSettingsStore((s) => s.lastBackupAt)
  const autoBackupEnabled = useSettingsStore((s) => s.autoBackupEnabled)
  const setAutoBackup = useSettingsStore((s) => s.setAutoBackup)    // defined in Phase 1 / Task 36

  const { data: backupFiles = [], isLoading: loadingFiles } = useListBackupsQuery()
  const backupMutation = useBackupNowMutation()
  const restoreMutation = useRestoreBackupMutation()

  const lastBackupFormatted = lastBackupAt
    ? format(parseISO(lastBackupAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    : 'Nunca'

  const handleBackupNow = () => {
    backupMutation.mutate()
  }

  const handleRestore = (fileId: string, fileName: string) => {
    Alert.alert(
      'Restaurar backup',
      `Isso substituirá todos os dados locais com ${fileName}. Continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Restaurar', style: 'destructive', onPress: () => restoreMutation.mutate(fileId) },
      ]
    )
  }

  return {
    lastBackupFormatted,
    autoBackupEnabled,
    setAutoBackup,
    backupFiles,
    loadingFiles,
    handleBackupNow,
    handleRestore,
    isBackingUp: backupMutation.isPending,
    isRestoring: restoreMutation.isPending,
  }
}
```

- [ ] **Step 2: Create Backup.view.tsx**

```typescript
// src/screens/Backup/Backup.view.tsx
import { colors } from '@/constants/colors'
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useBackupViewModel } from './useBackup.viewModel'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const BackupView = () => {
  const {
    lastBackupFormatted,
    autoBackupEnabled,
    setAutoBackup,
    backupFiles,
    loadingFiles,
    handleBackupNow,
    handleRestore,
    isBackingUp,
    isRestoring,
  } = useBackupViewModel()

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.pageTitle}>Backup</Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Status */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Último backup</Text>
          <Text style={styles.cardValue}>{lastBackupFormatted}</Text>
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={[styles.button, isBackingUp && styles.buttonDisabled]}
          onPress={handleBackupNow}
          disabled={isBackingUp}
        >
          {isBackingUp ? (
            <ActivityIndicator color={colors.grayscale.gray100} size="small" />
          ) : (
            <Ionicons name="cloud-upload-outline" size={18} color={colors.grayscale.gray100} />
          )}
          <Text style={styles.buttonText}>
            {isBackingUp ? 'Fazendo backup...' : 'Fazer backup agora'}
          </Text>
        </TouchableOpacity>

        {/* Auto-backup toggle */}
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Backup automático após sessão</Text>
          <Switch
            value={autoBackupEnabled}
            onValueChange={setAutoBackup}
            trackColor={{ true: colors.brand.primary }}
          />
        </View>

        {/* Backup list */}
        <Text style={styles.sectionTitle}>Backups disponíveis</Text>

        {loadingFiles && (
          <ActivityIndicator color={colors.brand.primary} style={{ marginTop: 16 }} />
        )}

        {!loadingFiles && backupFiles.length === 0 && (
          <Text style={styles.empty}>Nenhum backup encontrado no Google Drive.</Text>
        )}

        {backupFiles.map((file) => (
          <View key={file.id} style={styles.fileRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fileName}>{file.name}</Text>
              <Text style={styles.fileDate}>
                {format(parseISO(file.createdTime), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.restoreBtn}
              onPress={() => handleRestore(file.id, file.name)}
              disabled={isRestoring}
            >
              <Text style={styles.restoreBtnText}>Restaurar</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.grayscale.gray100,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: colors.background.elevated,
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  cardTitle: { fontSize: 13, color: colors.grayscale.gray400 },
  cardValue: { fontSize: 17, fontWeight: '600', color: colors.grayscale.gray100 },
  button: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: colors.brand.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.grayscale.gray100, fontWeight: '600', fontSize: 15 },
  row: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: colors.background.elevated,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: { fontSize: 14, color: colors.grayscale.gray200 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.grayscale.gray400,
    paddingHorizontal: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  empty: { fontSize: 14, color: colors.grayscale.gray500, textAlign: 'center', marginTop: 12 },
  fileRow: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: colors.background.elevated,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fileName: { fontSize: 13, color: colors.grayscale.gray200, fontWeight: '500' },
  fileDate: { fontSize: 11, color: colors.grayscale.gray500, marginTop: 2 },
  restoreBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.status.warning + '22',
    borderRadius: 8,
  },
  restoreBtnText: { fontSize: 12, color: colors.status.warning, fontWeight: '600' },
})
```

- [ ] **Step 3: Wire route**

```typescript
// src/app/(private)/backup.tsx
import { BackupView } from '@/screens/Backup/Backup.view'
export default BackupView
```

- [ ] **Step 4: Commit**

```bash
git add concursos-app/src/screens/Backup/ \
        concursos-app/src/app/\(private\)/backup.tsx
git commit -m "feat: implement Backup screen with Drive upload, list, and restore"
```

---

## Task 38: Settings Screen MVVM (Full)

**Files:**
- Modify: `src/screens/Settings/useSettings.viewModel.ts`
- Modify: `src/screens/Settings/Settings.view.tsx`
- Modify: `src/app/(private)/settings.tsx`

Phase 2 created a stub Settings screen for spreadsheet setup. This task replaces it with the full screen.

- [ ] **Step 1: Update useSettings.viewModel.ts**

```typescript
// src/screens/Settings/useSettings.viewModel.ts
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { object, string } from 'yup'
import { useAuthStore } from '@/shared/stores/auth.store'
import { useSettingsStore } from '@/shared/stores/settings.store'
import { useSyncSheetsMutation } from '@/shared/queries/sheets/use-sync-sheets.mutation'
import { router } from 'expo-router'
import { Alert } from 'react-native'

const settingsSchema = object({
  spreadsheetUrl: string()
    .required('URL obrigatória')
    .matches(
      /docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/,
      'URL inválida — use a URL completa da planilha Google'
    ),
})

function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)
  return match?.[1] ?? null
}

export const useSettingsViewModel = () => {
  const user = useAuthStore((s) => s.user)
  const spreadsheetId = useAuthStore((s) => s.spreadsheetId)
  const setSpreadsheetId = useAuthStore((s) => s.setSpreadsheetId)
  const logout = useAuthStore((s) => s.logout)

  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled)
  const setNotificationsEnabled = useSettingsStore((s) => s.setNotificationsEnabled)

  const syncMutation = useSyncSheetsMutation()

  const form = useForm({
    resolver: yupResolver(settingsSchema),
    defaultValues: {
      spreadsheetUrl: spreadsheetId
        ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
        : '',
    },
  })

  const handleSaveSpreadsheet = form.handleSubmit((values) => {
    const id = extractSpreadsheetId(values.spreadsheetUrl)
    if (!id) {
      Alert.alert('Erro', 'Não foi possível extrair o ID da planilha.')
      return
    }
    setSpreadsheetId(id)
    Alert.alert('Salvo', 'ID da planilha atualizado.')
  })

  const handleSyncNow = () => {
    syncMutation.mutate()
  }

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja realmente sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: () => {
          logout()
          router.replace('/(public)/login')
        },
      },
    ])
  }

  return {
    user,
    form,
    handleSaveSpreadsheet,
    handleSyncNow,
    isSyncing: syncMutation.isPending,
    notificationsEnabled,
    setNotificationsEnabled,
    handleLogout,
  }
}
```

- [ ] **Step 2: Update Settings.view.tsx**

```typescript
// src/screens/Settings/Settings.view.tsx
import { colors } from '@/constants/colors'
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Controller } from 'react-hook-form'
import { Ionicons } from '@expo/vector-icons'
import { useSettingsViewModel } from './useSettings.viewModel'

export const SettingsView = () => {
  const {
    user,
    form,
    handleSaveSpreadsheet,
    handleSyncNow,
    isSyncing,
    notificationsEnabled,
    setNotificationsEnabled,
    handleLogout,
  } = useSettingsViewModel()

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.pageTitle}>Configurações</Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Account */}
        <View style={styles.card}>
          <View style={styles.accountRow}>
            {user?.photoUrl ? (
              <Image source={{ uri: user.photoUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={20} color={colors.grayscale.gray400} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{user?.name ?? '—'}</Text>
              <Text style={styles.userEmail}>{user?.email ?? '—'}</Text>
            </View>
          </View>
        </View>

        {/* Spreadsheet URL */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Planilha Google</Text>
          <Controller
            control={form.control}
            name="spreadsheetUrl"
            render={({ field, fieldState }) => (
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, fieldState.error && styles.inputError]}
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  placeholderTextColor={colors.grayscale.gray600}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {fieldState.error && (
                  <Text style={styles.errorText}>{fieldState.error.message}</Text>
                )}
              </View>
            )}
          />
          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveSpreadsheet}>
            <Text style={styles.saveBtnText}>Salvar planilha</Text>
          </TouchableOpacity>
        </View>

        {/* Sync */}
        <TouchableOpacity
          style={[styles.syncBtn, isSyncing && styles.syncBtnDisabled]}
          onPress={handleSyncNow}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator color={colors.grayscale.gray100} size="small" />
          ) : (
            <Ionicons name="refresh-outline" size={18} color={colors.grayscale.gray100} />
          )}
          <Text style={styles.syncBtnText}>
            {isSyncing ? 'Sincronizando...' : 'Sincronizar agora'}
          </Text>
        </TouchableOpacity>

        {/* Notifications */}
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Notificações de sessão</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ true: colors.brand.primary }}
          />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={colors.status.error} />
          <Text style={styles.logoutText}>Sair da conta</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.grayscale.gray100,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: colors.background.elevated,
    borderRadius: 12,
    padding: 16,
  },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: {
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: { fontSize: 15, fontWeight: '600', color: colors.grayscale.gray100 },
  userEmail: { fontSize: 12, color: colors.grayscale.gray500, marginTop: 2 },
  section: { marginHorizontal: 16, marginBottom: 12, gap: 8 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.grayscale.gray400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: { gap: 4 },
  input: {
    backgroundColor: colors.background.elevated,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    color: colors.grayscale.gray100,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: { borderColor: colors.status.error },
  errorText: { fontSize: 12, color: colors.status.error },
  saveBtn: {
    backgroundColor: colors.brand.primary + '22',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  saveBtnText: { fontSize: 14, fontWeight: '600', color: colors.brand.primary },
  syncBtn: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: colors.brand.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  syncBtnDisabled: { opacity: 0.6 },
  syncBtnText: { color: colors.grayscale.gray100, fontWeight: '600', fontSize: 15 },
  row: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: colors.background.elevated,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: { fontSize: 14, color: colors.grayscale.gray200 },
  logoutBtn: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: colors.status.error + '11',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: colors.status.error },
})
```

- [ ] **Step 3: Confirm settings.store was expanded in Task 36 Step 3**

Task 36 Step 3 already replaces `settings.store` with the full definition including `notificationsEnabled` and `setNotificationsEnabled`. No additional changes needed here.

- [ ] **Step 4: Wire route**

```typescript
// src/app/(private)/settings.tsx
import { SettingsView } from '@/screens/Settings/Settings.view'
export default SettingsView
```

- [ ] **Step 5: Commit**

```bash
npx tsc --noEmit
git add concursos-app/src/screens/Settings/ \
        concursos-app/src/app/\(private\)/settings.tsx
git commit -m "feat: implement full Settings screen with spreadsheet, sync, notifications, and logout"
```

---

## Task 39: Wire auto-backup into save-session mutation

The `use-save-session.mutation.ts` (Phase 6) already has a placeholder comment for auto-backup. This task ensures it's actually triggered.

**Files:**
- Modify: `src/shared/queries/sessions/use-save-session.mutation.ts`

- [ ] **Step 1: Add auto-backup call to onSuccess**

In `use-save-session.mutation.ts`, update `onSuccess` to conditionally trigger backup:

```typescript
// Add at top of file:
import { BackupService } from '@/shared/services/backup.service'
import { useSettingsStore } from '@/shared/stores/settings.store'

// Inside the hook, add alongside existing auth/store reads:
const autoBackupEnabled = useSettingsStore((s) => s.autoBackupEnabled)
const googleAccessToken = useAuthStore((s) => s.googleAccessToken)

// In onSuccess (add after existing invalidations):
onSuccess: async (_, vars) => {
  // ... existing invalidations ...

  if (autoBackupEnabled && googleAccessToken) {
    try {
      await BackupService.backupNow(googleAccessToken)
      useSettingsStore.getState().setLastBackupAt(new Date().toISOString())
    } catch {
      // Silent fail — backup is best-effort
    }
  }
},
```

- [ ] **Step 2: Commit**

```bash
npx tsc --noEmit
git add concursos-app/src/shared/queries/sessions/use-save-session.mutation.ts
git commit -m "feat: trigger auto-backup after session save when setting is enabled"
```

---

## Task 40: Final TypeScript check and manual smoke test

- [ ] **Step 1: Full TypeScript check**

```bash
cd concursos-app
npx tsc --noEmit
```

Expected: 0 errors

- [ ] **Step 2: Smoke test History**

1. Complete at least one study session (via Session screen)
2. Open Drawer → Histórico
3. Verify session appears under today's date
4. Verify cycle compliance card shows correct percentage

- [ ] **Step 3: Smoke test Backup**

1. Open Drawer → Backup
2. Tap "Fazer backup agora"
3. Verify "Último backup" updates to current time
4. Go to Google Drive AppData → confirm file `backup-YYYY-MM-DD-HHmm.db` exists
5. Toggle "Backup automático" ON, complete a session, verify a new backup appears

- [ ] **Step 4: Smoke test Settings**

1. Open Drawer → Configurações
2. Verify Google account name/email/photo shown
3. Update spreadsheet URL → tap Save → reopen screen → URL persists
4. Tap "Sincronizar agora" → spinner appears → completes without error
5. Toggle notifications → persists across app restart
6. Tap "Sair" → confirm → returns to login screen

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: phase 9 complete — history, backup, and settings screens"
```

---

## Phase 9 Complete

At this point you have:
- ✅ History screen — sessions grouped by date, cycle compliance rate per cycle
- ✅ `BackupService` — SQLite → Google Drive AppData upload (multipart), list, restore
- ✅ Backup screen — backup now, restore list, auto-backup toggle
- ✅ Settings screen — account info, spreadsheet URL edit, sync now, notification toggle, logout
- ✅ Auto-backup wired into session save mutation

**All 9 phases complete. The full sistema-estudo-concursos app is implemented.**

### Phase summary

| Phase | Description |
|-------|-------------|
| 1 | Foundation: project, SQLite migrations, stores, navigation shell |
| 2 | Auth: Google OAuth, spreadsheet setup, Login screen |
| 3 | Repositories: all 6 domain repositories with TypeScript interfaces |
| 4 | Sheets sync: SheetsService, SyncService, dirty-flag merge |
| 5 | Cycle: CycleService, planned sessions, Cycle screen |
| 6 | Session timer: wall-clock timer, background task, Session screen |
| 7 | Subject & Topics: topic checkboxes, progress bar, edital toggle |
| 8 | Recommendation & Home: RecommendationService, HomeView |
| 9 | History, Backup, Settings |
