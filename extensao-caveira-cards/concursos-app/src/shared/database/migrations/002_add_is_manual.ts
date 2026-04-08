// src/shared/database/migrations/002_add_is_manual.ts
import type { SQLiteDatabase } from 'expo-sqlite'

export async function migration002(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    ALTER TABLE study_sessions ADD COLUMN is_manual INTEGER NOT NULL DEFAULT 0;
  `)
}
