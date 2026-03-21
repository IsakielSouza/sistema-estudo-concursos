// src/shared/interfaces/topic.ts
export interface Topic {
  id: string
  subjectId: string
  code: string
  title: string
  level: number
  order: number
  status: 'pending' | 'done'
  isDirty: boolean
  localUpdatedAt: string | null
}
