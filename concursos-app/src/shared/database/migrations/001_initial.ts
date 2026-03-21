// src/shared/database/migrations/001_initial.ts
import type { SQLiteDatabase } from 'expo-sqlite'

export async function migration001(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS concursos (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      target_date TEXT,
      is_active INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      concurso_id TEXT NOT NULL,
      name TEXT NOT NULL,
      points INTEGER NOT NULL DEFAULT 0,
      experience INTEGER NOT NULL DEFAULT 1,
      cycle_status TEXT NOT NULL DEFAULT 'active',
      is_slow_build INTEGER NOT NULL DEFAULT 0,
      is_free_study INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (concurso_id) REFERENCES concursos(id)
    );

    CREATE TABLE IF NOT EXISTS topics (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL,
      code TEXT NOT NULL,
      title TEXT NOT NULL,
      level INTEGER NOT NULL DEFAULT 1,
      "order" INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      is_dirty INTEGER NOT NULL DEFAULT 0,
      local_updated_at TEXT,
      FOREIGN KEY (subject_id) REFERENCES subjects(id)
    );

    CREATE TABLE IF NOT EXISTS cycles (
      id TEXT PRIMARY KEY,
      concurso_id TEXT NOT NULL,
      name TEXT NOT NULL,
      cycle_number INTEGER NOT NULL DEFAULT 1,
      planned_hours REAL NOT NULL DEFAULT 0,
      completed_hours REAL NOT NULL DEFAULT 0,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      FOREIGN KEY (concurso_id) REFERENCES concursos(id)
    );

    CREATE TABLE IF NOT EXISTS cycle_subjects (
      id TEXT PRIMARY KEY,
      cycle_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      allocated_hours REAL NOT NULL DEFAULT 0,
      completed_hours REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (cycle_id) REFERENCES cycles(id),
      FOREIGN KEY (subject_id) REFERENCES subjects(id)
    );

    CREATE TABLE IF NOT EXISTS planned_sessions (
      id TEXT PRIMARY KEY,
      cycle_subject_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      cycle_id TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      allocated_seconds INTEGER NOT NULL DEFAULT 7200,
      status TEXT NOT NULL DEFAULT 'pending',
      FOREIGN KEY (cycle_subject_id) REFERENCES cycle_subjects(id),
      FOREIGN KEY (subject_id) REFERENCES subjects(id),
      FOREIGN KEY (cycle_id) REFERENCES cycles(id)
    );

    CREATE TABLE IF NOT EXISTS study_sessions (
      id TEXT PRIMARY KEY,
      planned_session_id TEXT NOT NULL,
      cycle_subject_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      study_seconds INTEGER NOT NULL DEFAULT 0,
      review_seconds INTEGER NOT NULL DEFAULT 0,
      paused_seconds INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (planned_session_id) REFERENCES planned_sessions(id),
      FOREIGN KEY (cycle_subject_id) REFERENCES cycle_subjects(id),
      FOREIGN KEY (subject_id) REFERENCES subjects(id)
    );

    CREATE TABLE IF NOT EXISTS sync_log (
      id TEXT PRIMARY KEY,
      synced_at TEXT NOT NULL,
      spreadsheet_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'success',
      changes_count INTEGER NOT NULL DEFAULT 0
    );
  `)
}
