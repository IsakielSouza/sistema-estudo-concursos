// src/shared/database/database.ts
import * as SQLite from 'expo-sqlite'
import { runMigrations } from './migrations'

let db: SQLite.SQLiteDatabase | null = null

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db
  db = await SQLite.openDatabaseAsync('concursos.db')
  await runMigrations(db)
  return db
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync()
    db = null
  }
}
