export interface TopicSyncRow {
  subjectName: string
  code: string
  title: string
  level: number
  order: number
  status: 'FEITO' | 'PENDENTE'
}

export interface SubjectSyncData {
  name: string
  topics: TopicSyncRow[]
}
