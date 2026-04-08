// src/shared/interfaces/cycle.ts
export interface Cycle {
  id: string
  concursoId: string
  name: string
  cycleNumber: number
  plannedHours: number
  completedHours: number
  startedAt: string
  endedAt: string | null
  status: 'active' | 'completed' | 'late'
}

export interface CycleSubject {
  id: string
  cycleId: string
  subjectId: string
  allocatedHours: number
  completedHours: number
}

export interface PlannedSession {
  id: string
  cycleSubjectId: string
  subjectId: string
  cycleId: string
  position: number
  allocatedSeconds: number
  status: 'pending' | 'in_progress' | 'done'
}
