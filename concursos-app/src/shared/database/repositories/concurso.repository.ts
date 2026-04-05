import { getDatabase } from '../database'
import { randomUUID } from 'expo-crypto'

export const ConcursoRepository = {
  async getOrCreate(name: string): Promise<{ id: string; name: string }> {
    const db = await getDatabase()
    const existing = await db.getFirstAsync<{ id: string; name: string }>(
      'SELECT id, name FROM concursos WHERE is_active = 1 LIMIT 1'
    )
    if (existing) return existing
    const id = randomUUID()
    await db.runAsync(
      'INSERT INTO concursos (id, name, is_active) VALUES (?, ?, 1)',
      [id, name]
    )
    return { id, name }
  },
}
