import { useQuery } from '@tanstack/react-query'
import { CycleRepository } from '@/shared/database/repositories/cycle.repository'
import { SubjectRepository } from '@/shared/database/repositories/subject.repository'
import { useCycleStore } from '@/shared/stores/cycle.store'

export function useGetCycleSubjectsQuery() {
  const activeCycleId = useCycleStore((s) => s.activeCycleId)

  return useQuery({
    queryKey: ['cycle-subjects', activeCycleId],
    queryFn: async () => {
      const cycleSubjects = await CycleRepository.getCycleSubjects(activeCycleId!)
      const enriched = await Promise.all(
        cycleSubjects.map(async (cs) => {
          const subject = await SubjectRepository.getSubjectById(cs.subjectId)
          return { ...cs, subject: subject! }
        })
      )
      return enriched
    },
    enabled: !!activeCycleId,
  })
}
