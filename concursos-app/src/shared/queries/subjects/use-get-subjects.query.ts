import { useQuery } from '@tanstack/react-query'
import { SubjectRepository } from '@/shared/database/repositories/subject.repository'
import { TopicRepository } from '@/shared/database/repositories/topic.repository'
import { useCycleStore } from '@/shared/stores/cycle.store'

export function useGetSubjectsQuery() {
  const activeConcursoId = useCycleStore((s) => s.activeConcursoId)

  return useQuery({
    queryKey: ['subjects', activeConcursoId],
    queryFn: () => SubjectRepository.getSubjectsByConcurso(activeConcursoId!),
    enabled: !!activeConcursoId,
  })
}

export function useGetSubjectDetailQuery(subjectId: string) {
  return useQuery({
    queryKey: ['subject', subjectId],
    queryFn: () => SubjectRepository.getSubjectById(subjectId),
    enabled: !!subjectId,
  })
}

export function useGetTopicsQuery(subjectId: string) {
  return useQuery({
    queryKey: ['topics', subjectId],
    queryFn: () => TopicRepository.getBySubject(subjectId),
    enabled: !!subjectId,
  })
}

export function useGetTopicProgressQuery(subjectId: string) {
  return useQuery({
    queryKey: ['topic-progress', subjectId],
    queryFn: () => TopicRepository.getProgressBySubject(subjectId),
    enabled: !!subjectId,
  })
}
