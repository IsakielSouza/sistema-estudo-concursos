// src/shared/database/database.ts
import * as SQLite from 'expo-sqlite'
import { runMigrations } from './migrations'

let db: SQLite.SQLiteDatabase | null = null
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return Promise.resolve(db)
  if (initPromise) return initPromise
  initPromise = SQLite.openDatabaseAsync('concursos.db')
    .then(async (instance) => {
      await runMigrations(instance)
      db = instance
      return db as SQLite.SQLiteDatabase
    })
  return initPromise
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync()
    db = null
    initPromise = null
  }
}
