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

  async getById(id: string): Promise<Cycle | null> {
    const db = await getDatabase()
    const row = await db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM cycles WHERE id = ?',
      [id]
    )
    return row ? rowToCycle(row) : null
  },

  async getNextCycleNumber(concursoId: string): Promise<number> {
    const db = await getDatabase()
    const row = await db.getFirstAsync<{ max_num: number | null }>(
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

  async createCycleSubject(
    data: Omit<CycleSubject, 'id' | 'completedHours'>
  ): Promise<CycleSubject> {
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
      'SELECT * FROM cycle_subjects WHERE cycle_id = ? ORDER BY id ASC',
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

  async decrementCycleSubjectHours(cycleSubjectId: string, hours: number): Promise<void> {
    const db = await getDatabase()
    await db.runAsync(
      'UPDATE cycle_subjects SET completed_hours = MAX(0, completed_hours - ?) WHERE id = ?',
      [hours, cycleSubjectId]
    )
  },
}
