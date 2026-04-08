# Phase 4: Google Sheets Sync Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement full Google Sheets ↔ SQLite sync — read the spreadsheet on login, map subjects/topics to the local DB, and write topic status changes back. Handles offline dirty-flag conflict resolution.

**Architecture:** `sheets.client.ts` (axios) → `sheets.service.ts` (raw Sheets API calls) → `sync.service.ts` (diff/merge logic) → `use-sync-sheets.mutation.ts` (TanStack Query mutation). Sync triggered on login and after topic changes.

**Tech Stack:** axios, Google Sheets API v4, TanStack Query, expo-sqlite repositories from Phase 3

**Spec:** `docs/superpowers/specs/2026-03-21-sistema-estudo-concursos-design.md` — Seções 8 (Sync) e 4 (Modelo de Dados)

**Requires:** Phases 1–3 complete

---

## Task 17: HTTP Interfaces + Axios Clients

**Files:**
- Create: `src/shared/interfaces/http/sheets-response.ts`
- Create: `src/shared/interfaces/http/drive-response.ts`
- Create: `src/shared/interfaces/http/sync-payload.ts`
- Create: `src/shared/api/sheets.client.ts`
- Create: `src/shared/api/drive.client.ts`

- [ ] **Step 1: Create HTTP interfaces**

```typescript
// src/shared/interfaces/http/sheets-response.ts
export interface SheetsValueRange {
  range: string
  majorDimension: string
  values: string[][]
}

export interface SpreadsheetMetadata {
  spreadsheetId: string
  properties: { title: string }
  sheets: Array<{
    properties: { sheetId: number; title: string; index: number }
  }>
}
```

```typescript
// src/shared/interfaces/http/sync-payload.ts
export interface TopicSyncRow {
  subjectName: string
  code: string
  title: string
  level: number
  order: number
  status: 'FEITO' | 'PENDENTE'
}

export interface SubjectSyncData {
  name: string
  topics: TopicSyncRow[]
}
```

```typescript
// src/shared/interfaces/http/drive-response.ts
export interface DriveFile {
  id: string
  name: string
  createdTime: string
  modifiedTime: string
}

export interface DriveFileList {
  files: DriveFile[]
}
```

- [ ] **Step 2: Create sheets.client.ts**

```typescript
// src/shared/api/sheets.client.ts
import axios from 'axios'
import { useAuthStore } from '@/shared/stores/auth.store'

const BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets'

export const sheetsClient = axios.create({ baseURL: BASE_URL })

sheetsClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().googleAccessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
```

- [ ] **Step 3: Create drive.client.ts**

```typescript
// src/shared/api/drive.client.ts
import axios from 'axios'
import { useAuthStore } from '@/shared/stores/auth.store'

export const driveClient = axios.create({
  baseURL: 'https://www.googleapis.com',
})

driveClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().googleAccessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
```

- [ ] **Step 4: Commit**

```bash
git add concursos-app/src/shared/interfaces/http/ concursos-app/src/shared/api/
git commit -m "feat: add HTTP interfaces and axios clients for Sheets + Drive APIs"
```

---

## Task 18: Google Sheets Service (Read)

**Files:**
- Modify: `src/shared/services/sheets.service.ts`

- [ ] **Step 1: Implement full sheets.service.ts**

```typescript
// src/shared/services/sheets.service.ts
import { sheetsClient } from '@/shared/api/sheets.client'
import type { SpreadsheetMetadata, SheetsValueRange } from '@/shared/interfaces/http/sheets-response'
import type { SubjectSyncData, TopicSyncRow } from '@/shared/interfaces/http/sync-payload'

// Status column value constants
const STATUS_DONE = 'FEITO'
const STATUS_PENDING = 'PENDENTE'
const STATUS_HEADER = 'STATUS'

export const SheetsService = {
  async validateSpreadsheetAccess(
    spreadsheetId: string,
    accessToken: string
  ): Promise<boolean> {
    try {
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=spreadsheetId`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      return res.ok
    } catch {
      return false
    }
  },

  async getMetadata(spreadsheetId: string): Promise<SpreadsheetMetadata> {
    const { data } = await sheetsClient.get<SpreadsheetMetadata>(`/${spreadsheetId}`)
    return data
  },

  async getSheetValues(
    spreadsheetId: string,
    sheetTitle: string
  ): Promise<string[][]> {
    const range = encodeURIComponent(`${sheetTitle}!A:Z`)
    const { data } = await sheetsClient.get<SheetsValueRange>(
      `/${spreadsheetId}/values/${range}`
    )
    return data.values ?? []
  },

  /**
   * Reads all sheets from the spreadsheet and maps them to SubjectSyncData[].
   * Each sheet = one subject. Rows with a STATUS column = topics.
   *
   * Expected sheet structure per spec section 8:
   * Row N: [code, title, STATUS_VALUE]  (or just [code, title] for header rows)
   * Summary rows at bottom: TOTAL, FEITO, PENDENTE, %FEITO — skipped.
   */
  async readAllSubjects(spreadsheetId: string): Promise<SubjectSyncData[]> {
    const metadata = await SheetsService.getMetadata(spreadsheetId)
    const subjects: SubjectSyncData[] = []

    for (const sheet of metadata.sheets) {
      const title = sheet.properties.title
      // Skip summary or non-subject sheets
      if (['TOTAL', 'RESUMO', 'Dashboard'].includes(title)) continue

      const values = await SheetsService.getSheetValues(spreadsheetId, title)
      if (!values.length) continue

      const topics: TopicSyncRow[] = []
      let orderCounter = 0

      for (const row of values) {
        if (!row[0] && !row[1]) continue // empty row
        const code = (row[0] ?? '').trim()
        const rowTitle = (row[1] ?? row[0] ?? '').trim()
        const statusCell = (row[2] ?? '').trim().toUpperCase()

        // Skip header/summary rows
        if ([STATUS_HEADER, 'TOTAL', 'FEITO', 'PENDENTE', '%FEITO', 'BARRA DE PROGRESSO'].includes(rowTitle.toUpperCase())) continue
        if (!rowTitle) continue

        const level = SheetsService._getLevel(code)
        const status =
          statusCell === STATUS_DONE ? 'FEITO' : 'PENDENTE'

        topics.push({
          subjectName: title,
          code,
          title: rowTitle,
          level,
          order: orderCounter++,
          status,
        })
      }

      if (topics.length > 0) {
        subjects.push({ name: title, topics })
      }
    }

    return subjects
  },

  /**
   * Write topic status back to the spreadsheet.
   * Finds the row by matching the title column and updates STATUS column.
   */
  async updateTopicStatus(
    spreadsheetId: string,
    sheetTitle: string,
    rowOrder: number,
    status: 'FEITO' | 'PENDENTE'
  ): Promise<void> {
    // Row is 1-indexed in Sheets. +2 accounts for header + 0-indexed offset.
    const range = encodeURIComponent(`${sheetTitle}!C${rowOrder + 2}`)
    await sheetsClient.put(`/${spreadsheetId}/values/${range}`, {
      range: `${sheetTitle}!C${rowOrder + 2}`,
      majorDimension: 'ROWS',
      values: [[status]],
    }, {
      params: { valueInputOption: 'RAW' },
    })
  },

  /** Derive hierarchy level from dot-notation code: "1" = 1, "1.2" = 2, "1.2.3" = 3 */
  _getLevel(code: string): number {
    if (!code || !code.includes('.')) return 1
    return code.split('.').length
  },
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add concursos-app/src/shared/services/sheets.service.ts
git commit -m "feat: implement SheetsService with full spreadsheet read and topic write"
```

---

## Task 19: Sync Service (Diff + Merge)

**Files:**
- Create: `src/shared/services/sync.service.ts`

- [ ] **Step 1: Create sync.service.ts**

```typescript
// src/shared/services/sync.service.ts
import { SubjectRepository } from '@/shared/database/repositories/subject.repository'
import { TopicRepository } from '@/shared/database/repositories/topic.repository'
import { SessionRepository } from '@/shared/database/repositories/session.repository'
import { SheetsService } from './sheets.service'
import { useCycleStore } from '@/shared/stores/cycle.store'
import { randomUUID } from 'expo-crypto'

export interface SyncResult {
  subjectsUpserted: number
  topicsUpserted: number
  topicsWrittenBack: number
  error?: string
}

export const SyncService = {
  /**
   * Full sync on login:
   * 1. Read all subjects+topics from Sheets
   * 2. Upsert to SQLite (Sheets wins for clean topics, local wins for dirty topics)
   * 3. Write dirty local topics back to Sheets
   * 4. Log sync
   */
  async syncOnLogin(spreadsheetId: string, concursoId: string): Promise<SyncResult> {
    const lastSync = await SessionRepository.getLastSync(spreadsheetId)
    const result: SyncResult = { subjectsUpserted: 0, topicsUpserted: 0, topicsWrittenBack: 0 }

    try {
      // Step 1: Read from Sheets
      const sheetsData = await SheetsService.readAllSubjects(spreadsheetId)

      // Step 2: Upsert subjects and topics
      for (const subjectData of sheetsData) {
        // Upsert subject
        const existing = (await SubjectRepository.getSubjectsByConcurso(concursoId))
          .find((s) => s.name === subjectData.name)

        const subject = await SubjectRepository.upsertSubject({
          id: existing?.id,
          concursoId,
          name: subjectData.name,
          points: existing?.points ?? 0,
          experience: existing?.experience ?? 1,
          cycleStatus: existing?.cycleStatus ?? 'active',
          isSlowBuild: existing?.isSlowBuild ?? false,
          isFreeStudy: existing?.isFreeStudy ?? false,
        })
        result.subjectsUpserted++

        // Upsert topics with conflict resolution
        const existingTopics = await TopicRepository.getBySubject(subject.id)
        const topicByCode = new Map(existingTopics.map((t) => [t.code, t]))

        for (const topicRow of subjectData.topics) {
          const existing = topicByCode.get(topicRow.code)
          const sheetsStatus = topicRow.status === 'FEITO' ? 'done' : 'pending'

          if (existing?.isDirty && lastSync) {
            // Local wins: skip upsert, write local status back to Sheets later
            continue
          }

          // Sheets wins (or first sync)
          await TopicRepository.upsertTopic({
            id: existing?.id ?? randomUUID(),
            subjectId: subject.id,
            code: topicRow.code,
            title: topicRow.title,
            level: topicRow.level,
            order: topicRow.order,
            status: sheetsStatus,
            isDirty: false,
            localUpdatedAt: null,
          })
          result.topicsUpserted++
        }
      }

      // Step 3: Write dirty local topics back to Sheets
      const dirtyTopics = await TopicRepository.getAllDirtyTopics()
      for (const topic of dirtyTopics) {
        const subject = await SubjectRepository.getSubjectById(topic.subjectId)
        if (!subject) continue
        await SheetsService.updateTopicStatus(
          spreadsheetId,
          subject.name,
          topic.order,
          topic.status === 'done' ? 'FEITO' : 'PENDENTE'
        )
        result.topicsWrittenBack++
      }
      await TopicRepository.clearDirtyFlag(dirtyTopics.map((t) => t.id))

      // Step 4: Log sync
      await SessionRepository.createSyncLog({
        syncedAt: new Date().toISOString(),
        spreadsheetId,
        status: 'success',
        changesCount: result.topicsUpserted + result.topicsWrittenBack,
      })
    } catch (e) {
      result.error = e instanceof Error ? e.message : 'Unknown error'
      await SessionRepository.createSyncLog({
        syncedAt: new Date().toISOString(),
        spreadsheetId,
        status: 'error',
        changesCount: 0,
      })
    }

    return result
  },

  /**
   * Partial sync: write specific dirty topics back to Sheets.
   * Called when user exits /subject/[id] screen.
   */
  async writeDirtyTopics(spreadsheetId: string, subjectId: string): Promise<void> {
    const dirtyTopics = await TopicRepository.getDirtyTopics(subjectId)
    if (!dirtyTopics.length) return

    const subject = await SubjectRepository.getSubjectById(subjectId)
    if (!subject) return

    for (const topic of dirtyTopics) {
      await SheetsService.updateTopicStatus(
        spreadsheetId,
        subject.name,
        topic.order,
        topic.status === 'done' ? 'FEITO' : 'PENDENTE'
      )
    }
    await TopicRepository.clearDirtyFlag(dirtyTopics.map((t) => t.id))
  },
}
```

- [ ] **Step 2: Verify and commit**

```bash
npx tsc --noEmit
git add concursos-app/src/shared/services/sync.service.ts
git commit -m "feat: implement SyncService with diff/merge and offline dirty-flag resolution"
```

---

## Task 20: TanStack Query Mutations for Sync

**Files:**
- Create: `src/shared/queries/sheets/use-sync-sheets.mutation.ts`
- Create: `src/shared/queries/sheets/use-get-spreadsheet.query.ts`

- [ ] **Step 1: Create use-sync-sheets.mutation.ts**

```typescript
// src/shared/queries/sheets/use-sync-sheets.mutation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { SyncService } from '@/shared/services/sync.service'
import { useAuthStore } from '@/shared/stores/auth.store'
import { useCycleStore } from '@/shared/stores/cycle.store'

export function useSyncSheetsMutation() {
  const queryClient = useQueryClient()
  const spreadsheetId = useAuthStore((s) => s.spreadsheetId)
  const activeConcursoId = useCycleStore((s) => s.activeConcursoId)

  return useMutation({
    mutationFn: async () => {
      if (!spreadsheetId || !activeConcursoId) {
        throw new Error('Spreadsheet ou concurso não configurado')
      }
      return SyncService.syncOnLogin(spreadsheetId, activeConcursoId)
    },
    onSuccess: () => {
      // Invalidate all subject and topic queries after sync
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      queryClient.invalidateQueries({ queryKey: ['topics'] })
    },
  })
}
```

- [ ] **Step 2: Create use-get-spreadsheet.query.ts**

```typescript
// src/shared/queries/sheets/use-get-spreadsheet.query.ts
import { useQuery } from '@tanstack/react-query'
import { SheetsService } from '@/shared/services/sheets.service'
import { useAuthStore } from '@/shared/stores/auth.store'

export function useGetSpreadsheetQuery() {
  const spreadsheetId = useAuthStore((s) => s.spreadsheetId)

  return useQuery({
    queryKey: ['spreadsheet', spreadsheetId],
    queryFn: () => SheetsService.getMetadata(spreadsheetId!),
    enabled: !!spreadsheetId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
```

- [ ] **Step 3: Commit**

```bash
git add concursos-app/src/shared/queries/sheets/
git commit -m "feat: add sync mutation and spreadsheet query with TanStack Query"
```

---

## Task 21: Wire Sync to App Startup

**Files:**
- Modify: `src/app/(private)/(tabs)/home.tsx` (trigger sync on mount)
- Modify: `src/screens/Home/useHome.viewModel.ts`

- [ ] **Step 1: Trigger sync in Home viewModel on mount**

```typescript
// src/screens/Home/useHome.viewModel.ts
import { useSyncSheetsMutation } from '@/shared/queries/sheets/use-sync-sheets.mutation'
import { useEffect } from 'react'

export const useHomeViewModel = () => {
  const syncMutation = useSyncSheetsMutation()

  useEffect(() => {
    // Sync on first render (app open / login)
    syncMutation.mutate()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    isSyncing: syncMutation.isPending,
    syncError: syncMutation.error?.message ?? null,
  }
}
```

- [ ] **Step 2: Update Home.view.tsx to show sync status**

```typescript
// src/screens/Home/Home.view.tsx
import { colors } from '@/constants/colors'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useHomeViewModel } from './useHome.viewModel'

export const HomeView = () => {
  const { isSyncing, syncError } = useHomeViewModel()

  return (
    <SafeAreaView style={styles.container}>
      {isSyncing && (
        <View style={styles.syncBanner}>
          <ActivityIndicator size="small" color={colors.grayscale.gray100} />
          <Text style={styles.syncText}>Sincronizando planilha...</Text>
        </View>
      )}
      {syncError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>Erro ao sincronizar: {syncError}</Text>
        </View>
      )}
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>Em construção — Phase 8</Text>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary, paddingHorizontal: 24 },
  syncBanner: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingVertical: 8 },
  syncText: { color: colors.grayscale.gray400, fontSize: 12 },
  errorBanner: { backgroundColor: colors.status.error + '33', padding: 8, borderRadius: 8, marginVertical: 4 },
  errorText: { color: colors.status.error, fontSize: 12 },
  title: { fontSize: 24, color: colors.grayscale.gray100, fontFamily: 'Baloo2_800ExtraBold', marginTop: 24 },
  subtitle: { fontSize: 14, color: colors.grayscale.gray400, marginTop: 8 },
})
```

- [ ] **Step 3: Manual test — verify sync runs on app open**

After logging in with a valid spreadsheet:
1. Open app → Home screen should show "Sincronizando planilha..."
2. Check SQLite via breakpoint or log: subjects and topics should be populated
3. No crash

- [ ] **Step 4: Commit**

```bash
git add concursos-app/src/screens/Home/
git commit -m "feat: trigger Google Sheets sync on app startup via Home viewModel"
```

---

## Phase 4 Complete

At this point you have:
- ✅ Axios clients for Sheets and Drive APIs
- ✅ `SheetsService` reads all subjects/topics from spreadsheet
- ✅ `SheetsService` writes topic status back to spreadsheet
- ✅ `SyncService` — diff/merge with dirty-flag offline conflict resolution
- ✅ TanStack Query mutation wired to app startup
- ✅ Home screen shows sync status indicator

**Next:** `docs/superpowers/plans/2026-03-21-phase-5-cycle.md`
