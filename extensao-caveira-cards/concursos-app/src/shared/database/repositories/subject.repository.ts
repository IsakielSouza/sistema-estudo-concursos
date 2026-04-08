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

  async upsertSubject(
    subject: Omit<Subject, 'id' | 'createdAt'> & { id?: string }
  ): Promise<Subject> {
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
      [
        id, subject.concursoId, subject.name, subject.points, subject.experience,
        subject.cycleStatus, subject.isSlowBuild ? 1 : 0, subject.isFreeStudy ? 1 : 0, createdAt,
      ]
    )
    return { ...subject, id, createdAt }
  },

  async updateCycleStatus(id: string, cycleStatus: 'active' | 'revision'): Promise<void> {
    const db = await getDatabase()
    await db.runAsync('UPDATE subjects SET cycle_status = ? WHERE id = ?', [cycleStatus, id])
  },
}
