# Phase 3: Database Repositories Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement all SQLite repository classes — thin data-access layer between the database and services/queries. Each repository handles CRUD for one table.

**Architecture:** Each repository is a plain class with async methods. Receives `SQLiteDatabase` via `getDatabase()`. No business logic — only SQL. Types imported from `shared/interfaces/`.

**Tech Stack:** expo-sqlite, TypeScript

**Spec:** `docs/superpowers/specs/2026-03-21-sistema-estudo-concursos-design.md` — Seção 4 (Modelo de Dados)

**Requires:** Phase 1 complete (database setup + migrations)

---

## Task 11: TypeScript Interfaces

**Files:**
- Create: `src/shared/interfaces/subject.ts`
- Create: `src/shared/interfaces/topic.ts`
- Create: `src/shared/interfaces/cycle.ts`
- Create: `src/shared/interfaces/session.ts`

- [ ] **Step 1: Create subject.ts**

```typescript
// src/shared/interfaces/subject.ts
export interface Subject {
  id: string
  concursoId: string
  name: string
  points: number
  experience: number
  cycleStatus: 'active' | 'revision'
  isSlowBuild: boolean
  isFreeStudy: boolean
  createdAt: string
}

export interface Concurso {
  id: string
  name: string
  targetDate: string | null
  isActive: boolean
}
```

- [ ] **Step 2: Create topic.ts**

```typescript
// src/shared/interfaces/topic.ts
export interface Topic {
  id: string
  subjectId: string
  code: string
  title: string
  level: number
  order: number
  status: 'pending' | 'done'
  isDirty: boolean
  localUpdatedAt: string | null
}
```

- [ ] **Step 3: Create cycle.ts**

```typescript
// src/shared/interfaces/cycle.ts
export interface Cycle {
  id: string
  concursoId: string
  name: string
  cycleNumber: number
  plannedHours: number
  completedHours: number
  startedAt: string
  endedAt: string | null
  status: 'active' | 'completed' | 'late'
}

export interface CycleSubject {
  id: string
  cycleId: string
  subjectId: string
  allocatedHours: number
  completedHours: number
}

export interface PlannedSession {
  id: string
  cycleSubjectId: string
  subjectId: string
  cycleId: string
  position: number
  allocatedSeconds: number
  status: 'pending' | 'in_progress' | 'done'
}
```

- [ ] **Step 4: Create session.ts**

```typescript
// src/shared/interfaces/session.ts
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
}

export interface SyncLog {
  id: string
  syncedAt: string
  spreadsheetId: string
  status: 'success' | 'error'
  changesCount: number
}
```

- [ ] **Step 5: Commit**

```bash
git add concursos-app/src/shared/interfaces/
git commit -m "feat: add all TypeScript interfaces for database entities"
```

---

## Task 12: Subject + Concurso Repository

**Files:**
- Create: `src/shared/database/repositories/subject.repository.ts`

- [ ] **Step 1: Create subject.repository.ts**

```typescript
// src/shared/database/repositories/subject.repository.ts
import { getDatabase } from '../database'
import type { Concurso, Subject } from '@/shared/interfaces/subject'
import { randomUUID } from 'expo-crypto'

function rowToSubject(row: Record<string, unknown>): Subject {
  return {
    id: row.id as string,
    concursoId: row.concurso_id as string,
    name: row.name as string,
    points: row.points as number,
    experience: row.experience as number,
    cycleStatus: row.cycle_status as 'active' | 'revision',
    isSlowBuild: Boolean(row.is_slow_build),
    isFreeStudy: Boolean(row.is_free_study),
    createdAt: row.created_at as string,
  }
}

function rowToConcurso(row: Record<string, unknown>): Concurso {
  return {
    id: row.id as string,
    name: row.name as string,
    targetDate: row.target_date as string | null,
    isActive: Boolean(row.is_active),
  }
}

export const SubjectRepository = {
  async getActiveConcurso(): Promise<Concurso | null> {
    const db = await getDatabase()
    const row = await db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM concursos WHERE is_active = 1 LIMIT 1'
    )
    return row ? rowToConcurso(row) : null
  },

  async createConcurso(name: string, targetDate: string | null): Promise<Concurso> {
    const db = await getDatabase()
    const id = randomUUID()
    await db.runAsync(
      'INSERT INTO concursos (id, name, target_date, is_active) VALUES (?, ?, ?, 1)',
      [id, name, targetDate]
    )
    return { id, name, targetDate, isActive: true }
  },

  async getSubjectsByConcurso(concursoId: string): Promise<Subject[]> {
    const db = await getDatabase()
    const rows = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM subjects WHERE concurso_id = ? ORDER BY points DESC',
      [concursoId]
    )
    return rows.map(rowToSubject)
  },

  async getSubjectById(id: string): Promise<Subject | null> {
    const db = await getDatabase()
    const row = await db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM subjects WHERE id = ?',
      [id]
    )
    return row ? rowToSubject(row) : null
  },

  async upsertSubject(subject: Omit<Subject, 'id' | 'createdAt'> & { id?: string }): Promise<Subject> {
    const db = await getDatabase()
    const id = subject.id ?? randomUUID()
    const createdAt = new Date().toISOString()
    await db.runAsync(
      `INSERT INTO subjects (id, concurso_id, name, points, experience, cycle_status, is_slow_build, is_free_study, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         points = excluded.points,
         experience = excluded.experience,
         cycle_status = excluded.cycle_status,
         is_slow_build = excluded.is_slow_build,
         is_free_study = excluded.is_free_study`,
      [id, subject.concursoId, subject.name, subject.points, subject.experience,
       subject.cycleStatus, subject.isSlowBuild ? 1 : 0, subject.isFreeStudy ? 1 : 0, createdAt]
    )
    return { ...subject, id, createdAt }
  },

  async updateCycleStatus(id: string, cycleStatus: 'active' | 'revision'): Promise<void> {
    const db = await getDatabase()
    await db.runAsync('UPDATE subjects SET cycle_status = ? WHERE id = ?', [cycleStatus, id])
  },
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add concursos-app/src/shared/database/repositories/subject.repository.ts
git commit -m "feat: add SubjectRepository with concurso and subject CRUD"
```

---

## Task 13: Topic Repository

**Files:**
- Create: `src/shared/database/repositories/topic.repository.ts`

- [ ] **Step 1: Create topic.repository.ts**

```typescript
// src/shared/database/repositories/topic.repository.ts
import { getDatabase } from '../database'
import type { Topic } from '@/shared/interfaces/topic'
import { randomUUID } from 'expo-crypto'

function rowToTopic(row: Record<string, unknown>): Topic {
  return {
    id: row.id as string,
    subjectId: row.subject_id as string,
    code: row.code as string,
    title: row.title as string,
    level: row.level as number,
    order: row.order as number,
    status: row.status as 'pending' | 'done',
    isDirty: Boolean(row.is_dirty),
    localUpdatedAt: row.local_updated_at as string | null,
  }
}

export const TopicRepository = {
  async getBySubject(subjectId: string): Promise<Topic[]> {
    const db = await getDatabase()
    const rows = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM topics WHERE subject_id = ? ORDER BY "order" ASC',
      [subjectId]
    )
    return rows.map(rowToTopic)
  },

  async getDirtyTopics(subjectId: string): Promise<Topic[]> {
    const db = await getDatabase()
    const rows = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM topics WHERE subject_id = ? AND is_dirty = 1',
      [subjectId]
    )
    return rows.map(rowToTopic)
  },

  async getAllDirtyTopics(): Promise<Topic[]> {
    const db = await getDatabase()
    const rows = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM topics WHERE is_dirty = 1'
    )
    return rows.map(rowToTopic)
  },

  async upsertTopic(topic: Omit<Topic, 'id'> & { id?: string }): Promise<Topic> {
    const db = await getDatabase()
    const id = topic.id ?? randomUUID()
    await db.runAsync(
      `INSERT INTO topics (id, subject_id, code, title, level, "order", status, is_dirty, local_updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         title = excluded.title,
         status = excluded.status,
         is_dirty = excluded.is_dirty,
         local_updated_at = excluded.local_updated_at`,
      [id, topic.subjectId, topic.code, topic.title, topic.level, topic.order,
       topic.status, topic.isDirty ? 1 : 0, topic.localUpdatedAt]
    )
    return { ...topic, id }
  },

  async setTopicStatus(id: string, status: 'pending' | 'done'): Promise<void> {
    const db = await getDatabase()
    const now = new Date().toISOString()
    await db.runAsync(
      'UPDATE topics SET status = ?, is_dirty = 1, local_updated_at = ? WHERE id = ?',
      [status, now, id]
    )
  },

  async clearDirtyFlag(ids: string[]): Promise<void> {
    const db = await getDatabase()
    const placeholders = ids.map(() => '?').join(',')
    await db.runAsync(
      `UPDATE topics SET is_dirty = 0, local_updated_at = NULL WHERE id IN (${placeholders})`,
      ids
    )
  },

  async getProgressBySubject(subjectId: string): Promise<{ total: number; done: number }> {
    const db = await getDatabase()
    const row = await db.getFirstAsync<{ total: number; done: number }>(
      `SELECT COUNT(*) as total,
              SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done
       FROM topics WHERE subject_id = ? AND level > 0`,
      [subjectId]
    )
    return { total: row?.total ?? 0, done: row?.done ?? 0 }
  },
}
```

- [ ] **Step 2: Verify and commit**

```bash
npx tsc --noEmit
git add concursos-app/src/shared/database/repositories/topic.repository.ts
git commit -m "feat: add TopicRepository with dirty-flag support for offline sync"
```

---

## Task 14: Cycle + CycleSubject Repository

**Files:**
- Create: `src/shared/database/repositories/cycle.repository.ts`

- [ ] **Step 1: Create cycle.repository.ts**

```typescript
// src/shared/database/repositories/cycle.repository.ts
import { getDatabase } from '../database'
import type { Cycle, CycleSubject } from '@/shared/interfaces/cycle'
import { randomUUID } from 'expo-crypto'

function rowToCycle(row: Record<string, unknown>): Cycle {
  return {
    id: row.id as string,
    concursoId: row.concurso_id as string,
    name: row.name as string,
    cycleNumber: row.cycle_number as number,
    plannedHours: row.planned_hours as number,
    completedHours: row.completed_hours as number,
    startedAt: row.started_at as string,
    endedAt: row.ended_at as string | null,
    status: row.status as Cycle['status'],
  }
}

function rowToCycleSubject(row: Record<string, unknown>): CycleSubject {
  return {
    id: row.id as string,
    cycleId: row.cycle_id as string,
    subjectId: row.subject_id as string,
    allocatedHours: row.allocated_hours as number,
    completedHours: row.completed_hours as number,
  }
}

export const CycleRepository = {
  async getActiveCycle(concursoId: string): Promise<Cycle | null> {
    const db = await getDatabase()
    const row = await db.getFirstAsync<Record<string, unknown>>(
      "SELECT * FROM cycles WHERE concurso_id = ? AND status = 'active' LIMIT 1",
      [concursoId]
    )
    return row ? rowToCycle(row) : null
  },

  async getNextCycleNumber(concursoId: string): Promise<number> {
    const db = await getDatabase()
    const row = await db.getFirstAsync<{ max_num: number }>(
      'SELECT MAX(cycle_number) as max_num FROM cycles WHERE concurso_id = ?',
      [concursoId]
    )
    return (row?.max_num ?? 0) + 1
  },

  async createCycle(data: Omit<Cycle, 'id' | 'completedHours' | 'endedAt'>): Promise<Cycle> {
    const db = await getDatabase()
    const id = randomUUID()
    await db.runAsync(
      `INSERT INTO cycles (id, concurso_id, name, cycle_number, planned_hours, completed_hours, started_at, ended_at, status)
       VALUES (?, ?, ?, ?, ?, 0, ?, NULL, 'active')`,
      [id, data.concursoId, data.name, data.cycleNumber, data.plannedHours, data.startedAt]
    )
    return { ...data, id, completedHours: 0, endedAt: null }
  },

  async updateCompletedHours(cycleId: string, hours: number): Promise<void> {
    const db = await getDatabase()
    await db.runAsync(
      'UPDATE cycles SET completed_hours = completed_hours + ? WHERE id = ?',
      [hours, cycleId]
    )
  },

  async markLateIfNeeded(cycleId: string): Promise<void> {
    const db = await getDatabase()
    await db.runAsync(
      `UPDATE cycles SET status = 'late'
       WHERE id = ? AND status = 'active'
       AND julianday('now') - julianday(started_at) > 7`,
      [cycleId]
    )
  },

  async createCycleSubject(data: Omit<CycleSubject, 'id' | 'completedHours'>): Promise<CycleSubject> {
    const db = await getDatabase()
    const id = randomUUID()
    await db.runAsync(
      'INSERT INTO cycle_subjects (id, cycle_id, subject_id, allocated_hours, completed_hours) VALUES (?, ?, ?, ?, 0)',
      [id, data.cycleId, data.subjectId, data.allocatedHours]
    )
    return { ...data, id, completedHours: 0 }
  },

  async getCycleSubjects(cycleId: string): Promise<CycleSubject[]> {
    const db = await getDatabase()
    const rows = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM cycle_subjects WHERE cycle_id = ?',
      [cycleId]
    )
    return rows.map(rowToCycleSubject)
  },

  async incrementCycleSubjectHours(cycleSubjectId: string, hours: number): Promise<void> {
    const db = await getDatabase()
    await db.runAsync(
      'UPDATE cycle_subjects SET completed_hours = completed_hours + ? WHERE id = ?',
      [hours, cycleSubjectId]
    )
  },
}
```

- [ ] **Step 2: Verify and commit**

```bash
npx tsc --noEmit
git add concursos-app/src/shared/database/repositories/cycle.repository.ts
git commit -m "feat: add CycleRepository with active cycle and cycle_subjects CRUD"
```

---

## Task 15: PlannedSession Repository

**Files:**
- Create: `src/shared/database/repositories/planned-session.repository.ts`

- [ ] **Step 1: Create planned-session.repository.ts**

```typescript
// src/shared/database/repositories/planned-session.repository.ts
import { getDatabase } from '../database'
import type { PlannedSession } from '@/shared/interfaces/cycle'
import { randomUUID } from 'expo-crypto'

function rowToPlannedSession(row: Record<string, unknown>): PlannedSession {
  return {
    id: row.id as string,
    cycleSubjectId: row.cycle_subject_id as string,
    subjectId: row.subject_id as string,
    cycleId: row.cycle_id as string,
    position: row.position as number,
    allocatedSeconds: row.allocated_seconds as number,
    status: row.status as PlannedSession['status'],
  }
}

export const PlannedSessionRepository = {
  async getByCycle(cycleId: string): Promise<PlannedSession[]> {
    const db = await getDatabase()
    const rows = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM planned_sessions WHERE cycle_id = ? ORDER BY position ASC',
      [cycleId]
    )
    return rows.map(rowToPlannedSession)
  },

  async getById(id: string): Promise<PlannedSession | null> {
    const db = await getDatabase()
    const row = await db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM planned_sessions WHERE id = ?',
      [id]
    )
    return row ? rowToPlannedSession(row) : null
  },

  async createMany(sessions: Omit<PlannedSession, 'id'>[]): Promise<PlannedSession[]> {
    const db = await getDatabase()
    const created: PlannedSession[] = []
    for (const s of sessions) {
      const id = randomUUID()
      await db.runAsync(
        `INSERT INTO planned_sessions (id, cycle_subject_id, subject_id, cycle_id, position, allocated_seconds, status)
         VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
        [id, s.cycleSubjectId, s.subjectId, s.cycleId, s.position, s.allocatedSeconds]
      )
      created.push({ ...s, id })
    }
    return created
  },

  async updateStatus(id: string, status: PlannedSession['status']): Promise<void> {
    const db = await getDatabase()
    await db.runAsync(
      'UPDATE planned_sessions SET status = ? WHERE id = ?',
      [status, id]
    )
  },

  async getCountByCycle(cycleId: string): Promise<{ total: number; done: number }> {
    const db = await getDatabase()
    const row = await db.getFirstAsync<{ total: number; done: number }>(
      `SELECT COUNT(*) as total,
              SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done
       FROM planned_sessions WHERE cycle_id = ?`,
      [cycleId]
    )
    return { total: row?.total ?? 0, done: row?.done ?? 0 }
  },
}
```

- [ ] **Step 2: Verify and commit**

```bash
npx tsc --noEmit
git add concursos-app/src/shared/database/repositories/planned-session.repository.ts
git commit -m "feat: add PlannedSessionRepository with bulk create and status updates"
```

---

## Task 16: StudySession + SyncLog Repository

**Files:**
- Create: `src/shared/database/repositories/session.repository.ts`

- [ ] **Step 1: Create session.repository.ts**

```typescript
// src/shared/database/repositories/session.repository.ts
import { getDatabase } from '../database'
import type { StudySession, SyncLog } from '@/shared/interfaces/session'
import { randomUUID } from 'expo-crypto'

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
  }
}

export const SessionRepository = {
  async create(data: Omit<StudySession, 'id'>): Promise<StudySession> {
    const db = await getDatabase()
    const id = randomUUID()
    await db.runAsync(
      `INSERT INTO study_sessions
       (id, planned_session_id, cycle_subject_id, subject_id, started_at, ended_at, study_seconds, review_seconds, paused_seconds)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, data.plannedSessionId, data.cycleSubjectId, data.subjectId,
       data.startedAt, data.endedAt, data.studySeconds, data.reviewSeconds, data.pausedSeconds]
    )
    return { ...data, id }
  },

  async getBySubject(subjectId: string): Promise<StudySession[]> {
    const db = await getDatabase()
    const rows = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM study_sessions WHERE subject_id = ? ORDER BY started_at DESC',
      [subjectId]
    )
    return rows.map(rowToStudySession)
  },

  async getByDateRange(from: string, to: string): Promise<StudySession[]> {
    const db = await getDatabase()
    const rows = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM study_sessions WHERE started_at >= ? AND started_at <= ? ORDER BY started_at DESC',
      [from, to]
    )
    return rows.map(rowToStudySession)
  },

  async getWeeklySecondsBySubject(
    subjectId: string,
    weekStart: string,
    weekEnd: string
  ): Promise<number> {
    const db = await getDatabase()
    const row = await db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(study_seconds), 0) as total
       FROM study_sessions
       WHERE subject_id = ? AND started_at >= ? AND started_at <= ?`,
      [subjectId, weekStart, weekEnd]
    )
    return row?.total ?? 0
  },

  // SyncLog
  async getLastSync(spreadsheetId: string): Promise<SyncLog | null> {
    const db = await getDatabase()
    const row = await db.getFirstAsync<Record<string, unknown>>(
      "SELECT * FROM sync_log WHERE spreadsheet_id = ? AND status = 'success' ORDER BY synced_at DESC LIMIT 1",
      [spreadsheetId]
    )
    if (!row) return null
    return {
      id: row.id as string,
      syncedAt: row.synced_at as string,
      spreadsheetId: row.spreadsheet_id as string,
      status: row.status as 'success' | 'error',
      changesCount: row.changes_count as number,
    }
  },

  async createSyncLog(data: Omit<SyncLog, 'id'>): Promise<void> {
    const db = await getDatabase()
    const id = randomUUID()
    await db.runAsync(
      'INSERT INTO sync_log (id, synced_at, spreadsheet_id, status, changes_count) VALUES (?, ?, ?, ?, ?)',
      [id, data.syncedAt, data.spreadsheetId, data.status, data.changesCount]
    )
  },
}
```

- [ ] **Step 2: Verify all TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors across all repository files.

- [ ] **Step 3: Commit**

```bash
git add concursos-app/src/shared/database/repositories/session.repository.ts
git commit -m "feat: add SessionRepository and SyncLog repository"
```

---

## Phase 3 Complete

At this point you have:
- ✅ All TypeScript interfaces for database entities
- ✅ SubjectRepository — subjects + concursos CRUD
- ✅ TopicRepository — with dirty-flag + progress tracking
- ✅ CycleRepository — active cycle, cycle_subjects CRUD
- ✅ PlannedSessionRepository — bulk create + status updates
- ✅ SessionRepository — study sessions + weekly aggregates + sync log

**Next:** `docs/superpowers/plans/2026-03-21-phase-4-sheets-sync.md`
