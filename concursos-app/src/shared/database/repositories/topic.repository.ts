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
      [
        id, topic.subjectId, topic.code, topic.title, topic.level, topic.order,
        topic.status, topic.isDirty ? 1 : 0, topic.localUpdatedAt,
      ]
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
    if (ids.length === 0) return
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
