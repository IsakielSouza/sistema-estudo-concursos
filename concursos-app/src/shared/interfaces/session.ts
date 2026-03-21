// src/shared/interfaces/session.ts
export interface StudySession {
  id: string
  plannedSessionId: string
  cycleSubjectId: string
  subjectId: string
  startedAt: string
  endedAt: string | null
  studySeconds: number
  reviewSeconds: number
  pausedSeconds: number
}

export interface SyncLog {
  id: string
  syncedAt: string
  spreadsheetId: string
  status: 'success' | 'error'
  changesCount: number
}

export interface SessionHistoryItem {
  sessionId: string
  subjectName: string
  studySeconds: number
  reviewSeconds: number
}

export interface SessionsByDate {
  date: string
  sessions: SessionHistoryItem[]
  totalSeconds: number
}

export interface WeeklySubjectTotal {
  subjectName: string
  totalSeconds: number
}

export interface SessionsByWeek {
  weekKey: string
  subjects: WeeklySubjectTotal[]
  totalSeconds: number
}

export interface CycleComplianceStat {
  cycle_id: string
  cycle_number: number
  planned_hours: number
  completed_hours: number
  status: 'active' | 'completed' | 'late'
}
