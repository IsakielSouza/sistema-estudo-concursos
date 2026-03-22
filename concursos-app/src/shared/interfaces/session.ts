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
  isManual: boolean
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
  weekKey: string               // ISO week Monday date, e.g. '2026-03-16'
  subjects: WeeklySubjectTotal[]
  totalSeconds: number
}

export interface CycleComplianceStat {
  cycleId: string
  cycleNumber: number
  plannedHours: number
  completedHours: number
  status: 'active' | 'completed' | 'late'
}
