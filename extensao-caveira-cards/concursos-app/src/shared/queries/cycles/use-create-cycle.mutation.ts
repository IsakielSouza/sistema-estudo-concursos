import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CycleService } from '@/shared/services/cycle.service'
import { CycleRepository } from '@/shared/database/repositories/cycle.repository'
import { PlannedSessionRepository } from '@/shared/database/repositories/planned-session.repository'
import { SubjectRepository } from '@/shared/database/repositories/subject.repository'
import { useCycleStore } from '@/shared/stores/cycle.store'
import type { CycleFormData } from '@/shared/schemas/cycle.schema'

export function useCreateCycleMutation() {
  const queryClient = useQueryClient()
  const { setActiveCycle } = useCycleStore()
  const activeConcursoId = useCycleStore((s) => s.activeConcursoId)

  return useMutation({
    mutationFn: async (data: CycleFormData & { concursoId: string }) => {
      const { name, plannedHours, selectedSubjectIds, concursoId } = data

      const allSubjects = await SubjectRepository.getSubjectsByConcurso(concursoId)
      const selectedSubjects = allSubjects.filter((s) =>
        selectedSubjectIds.includes(s.id) || s.isFreeStudy
      )

      const { cycleSubjectAllocations, plannedSessions } =
        CycleService.buildCycleData({ plannedHours, subjects: selectedSubjects })

      const cycleNumber = await CycleRepository.getNextCycleNumber(concursoId)
      const cycle = await CycleRepository.createCycle({
        concursoId,
        name,
        cycleNumber,
        plannedHours,
        startedAt: new Date().toISOString(),
        status: 'active',
      })

      const cycleSubjectMap = new Map<string, string>()
      for (const alloc of cycleSubjectAllocations) {
        const cs = await CycleRepository.createCycleSubject({
          cycleId: cycle.id,
          subjectId: alloc.subjectId,
          allocatedHours: alloc.allocatedHours,
        })
        cycleSubjectMap.set(alloc.subjectId, cs.id)
      }

      const sessionsToCreate = plannedSessions.map((s) => ({
        cycleSubjectId: cycleSubjectMap.get(s.subjectId)!,
        subjectId: s.subjectId,
        cycleId: cycle.id,
        position: s.position,
        allocatedSeconds: s.allocatedSeconds,
        status: 'pending' as const,
      }))
      await PlannedSessionRepository.createMany(sessionsToCreate)

      return cycle
    },
    onSuccess: (cycle) => {
      setActiveCycle(cycle.id, cycle.concursoId)
      queryClient.invalidateQueries({ queryKey: ['planned-sessions'] })
      queryClient.invalidateQueries({ queryKey: ['cycle-subjects'] })
    },
  })
}
