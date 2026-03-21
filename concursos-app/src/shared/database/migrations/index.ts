// src/shared/database/migrations/index.ts
import type { SQLiteDatabase } from 'expo-sqlite'
import { migration001 } from './001_initial'

const MIGRATIONS = [
  { id: 1, name: '001_initial', fn: migration001 },
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
