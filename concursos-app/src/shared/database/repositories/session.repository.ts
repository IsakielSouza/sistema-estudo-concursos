// src/shared/database/repositories/session.repository.ts
import { getDatabase } from '../database'
import type {
  StudySession,
  SyncLog,
  SessionHistoryItem,
  SessionsByDate,
  SessionsByWeek,
  WeeklySubjectTotal,
  CycleComplianceStat,
} from '@/shared/interfaces/session'
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
    isManual: (row.is_manual as number) === 1,
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
      [
        id, data.plannedSessionId, data.cycleSubjectId, data.subjectId,
        data.startedAt, data.endedAt, data.studySeconds, data.reviewSeconds, data.pausedSeconds,
      ]
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

  async getAllSessionsGroupedByDate(concursoId?: string): Promise<SessionsByDate[]> {
    const db = await getDatabase()
    const rows = await db.getAllAsync<{
      date: string
      subject_name: string
      study_seconds: number
      review_seconds: number
      session_id: string
    }>(
      concursoId
        ? `
      SELECT
        date(ss.started_at) AS date,
        sub.name AS subject_name,
        ss.study_seconds,
        ss.review_seconds,
        ss.id AS session_id
      FROM study_sessions ss
      JOIN subjects sub ON sub.id = ss.subject_id
      JOIN cycles c ON c.id = ss.cycle_id
      WHERE c.concurso_id = ?
      ORDER BY ss.started_at DESC
    `
        : `
      SELECT
        date(ss.started_at) AS date,
        sub.name AS subject_name,
        ss.study_seconds,
        ss.review_seconds,
        ss.id AS session_id
      FROM study_sessions ss
      JOIN subjects sub ON sub.id = ss.subject_id
      ORDER BY ss.started_at DESC
    `,
      concursoId ? [concursoId] : []
    )

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
      totalSeconds: sessions.reduce((acc, s) => acc + s.studySeconds + s.reviewSeconds, 0),
    }))
  },

  async getSessionsGroupedByISOWeek(concursoId?: string): Promise<SessionsByWeek[]> {
    const db = await getDatabase()
    // Group by the Monday of the week (ISO week starts Monday)
    const rows = await db.getAllAsync<{
      week_start: string
      subject_name: string
      total_seconds: number
    }>(
      concursoId
        ? `
      SELECT
        date(ss.started_at, 'weekday 1', '-6 days') AS week_start,
        sub.name AS subject_name,
        SUM(ss.study_seconds + ss.review_seconds) AS total_seconds
      FROM study_sessions ss
      JOIN subjects sub ON sub.id = ss.subject_id
      JOIN cycles c ON c.id = ss.cycle_id
      WHERE c.concurso_id = ?
      GROUP BY week_start, ss.subject_id
      ORDER BY week_start DESC
    `
        : `
      SELECT
        date(ss.started_at, 'weekday 1', '-6 days') AS week_start,
        sub.name AS subject_name,
        SUM(ss.study_seconds + ss.review_seconds) AS total_seconds
      FROM study_sessions ss
      JOIN subjects sub ON sub.id = ss.subject_id
      GROUP BY week_start, ss.subject_id
      ORDER BY week_start DESC
    `,
      concursoId ? [concursoId] : []
    )

    const map = new Map<string, WeeklySubjectTotal[]>()
    for (const row of rows) {
      if (!map.has(row.week_start)) map.set(row.week_start, [])
      map.get(row.week_start)!.push({
        subjectName: row.subject_name,
        totalSeconds: row.total_seconds,
      })
    }

    return Array.from(map.entries()).map(([weekKey, subjects]) => ({
      weekKey, // e.g. '2026-03-16' (the Monday)
      subjects,
      totalSeconds: subjects.reduce((acc, s) => acc + s.totalSeconds, 0),
    }))
  },

  async getCycleComplianceStats(concursoId: string): Promise<CycleComplianceStat[]> {
    const db = await getDatabase()
    const rows = await db.getAllAsync<{
      cycle_id: string
      cycle_number: number
      planned_hours: number
      completed_hours: number
      status: string
    }>(`
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

    return rows.map((row) => ({
      cycleId: row.cycle_id,
      cycleNumber: row.cycle_number,
      plannedHours: row.planned_hours,
      completedHours: row.completed_hours,
      status: row.status as CycleComplianceStat['status'],
    }))
  },

  // SyncLog methods
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
