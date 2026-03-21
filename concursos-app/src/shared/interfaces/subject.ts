// src/shared/interfaces/subject.ts
export interface Subject {
  id: string
  concursoId: string
  name: string
  points: number
  experience: number
  cycleStatus: 'active' | 'revision'
  isSlowBuild: boolean
  isFreeStudy: boolean
  createdAt: string
}

export interface Concurso {
  id: string
  name: string
  targetDate: string | null
  isActive: boolean
}
