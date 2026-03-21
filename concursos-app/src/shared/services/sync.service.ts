import { SubjectRepository } from '@/shared/database/repositories/subject.repository'
import { TopicRepository } from '@/shared/database/repositories/topic.repository'
import { SessionRepository } from '@/shared/database/repositories/session.repository'
import { SheetsService } from './sheets.service'
import { randomUUID } from 'expo-crypto'

export interface SyncResult {
  subjectsUpserted: number
  topicsUpserted: number
  topicsWrittenBack: number
  error?: string
}

export const SyncService = {
  async syncOnLogin(spreadsheetId: string, concursoId: string): Promise<SyncResult> {
    const lastSync = await SessionRepository.getLastSync(spreadsheetId)
    const result: SyncResult = { subjectsUpserted: 0, topicsUpserted: 0, topicsWrittenBack: 0 }

    try {
      const sheetsData = await SheetsService.readAllSubjects(spreadsheetId)

      const allExistingSubjects = await SubjectRepository.getSubjectsByConcurso(concursoId)
      const subjectByName = new Map(allExistingSubjects.map((s) => [s.name, s]))

      for (const subjectData of sheetsData) {
        const existing = subjectByName.get(subjectData.name)

        const subject = await SubjectRepository.upsertSubject({
          id: existing?.id,
          concursoId,
          name: subjectData.name,
          points: existing?.points ?? 0,
          experience: existing?.experience ?? 1,
          cycleStatus: existing?.cycleStatus ?? 'active',
          isSlowBuild: existing?.isSlowBuild ?? false,
          isFreeStudy: existing?.isFreeStudy ?? false,
        })
        result.subjectsUpserted++

        const existingTopics = await TopicRepository.getBySubject(subject.id)
        const topicByCode = new Map(existingTopics.map((t) => [t.code, t]))

        for (const topicRow of subjectData.topics) {
          const existingTopic = topicByCode.get(topicRow.code)
          const sheetsStatus = topicRow.status === 'FEITO' ? 'done' : 'pending'

          if (existingTopic?.isDirty && lastSync) {
            continue
          }

          await TopicRepository.upsertTopic({
            id: existingTopic?.id ?? randomUUID(),
            subjectId: subject.id,
            code: topicRow.code,
            title: topicRow.title,
            level: topicRow.level,
            order: topicRow.sheetRow,
            status: sheetsStatus,
            isDirty: false,
            localUpdatedAt: null,
          })
          result.topicsUpserted++
        }
      }

      const dirtyTopics = await TopicRepository.getAllDirtyTopics()
      for (const topic of dirtyTopics) {
        const subject = await SubjectRepository.getSubjectById(topic.subjectId)
        if (!subject) continue
        await SheetsService.updateTopicStatus(
          spreadsheetId,
          subject.name,
          topic.order,
          topic.status === 'done' ? 'FEITO' : 'PENDENTE'
        )
        result.topicsWrittenBack++
      }
      await TopicRepository.clearDirtyFlag(dirtyTopics.map((t) => t.id))

      await SessionRepository.createSyncLog({
        syncedAt: new Date().toISOString(),
        spreadsheetId,
        status: 'success',
        changesCount: result.topicsUpserted + result.topicsWrittenBack,
      })
    } catch (e) {
      result.error = e instanceof Error ? e.message : 'Unknown error'
      await SessionRepository.createSyncLog({
        syncedAt: new Date().toISOString(),
        spreadsheetId,
        status: 'error',
        changesCount: 0,
      })
    }

    return result
  },

  async writeDirtyTopics(spreadsheetId: string, subjectId: string): Promise<void> {
    const dirtyTopics = await TopicRepository.getDirtyTopics(subjectId)
    if (!dirtyTopics.length) return

    const subject = await SubjectRepository.getSubjectById(subjectId)
    if (!subject) return

    for (const topic of dirtyTopics) {
      await SheetsService.updateTopicStatus(
        spreadsheetId,
        subject.name,
        topic.order,
        topic.status === 'done' ? 'FEITO' : 'PENDENTE'
      )
    }
    await TopicRepository.clearDirtyFlag(dirtyTopics.map((t) => t.id))
  },
}
