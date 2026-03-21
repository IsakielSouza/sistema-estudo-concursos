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
    const row = await db.getFirstAsync<{ total: number; done: number | null }>(
      `SELECT COUNT(*) as total,
              SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done
       FROM planned_sessions WHERE cycle_id = ?`,
      [cycleId]
    )
    return { total: row?.total ?? 0, done: row?.done ?? 0 }
  },
}
