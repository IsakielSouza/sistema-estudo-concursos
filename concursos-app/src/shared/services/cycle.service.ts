import type { Subject } from '@/shared/interfaces/subject'
import type { CycleSubject, PlannedSession } from '@/shared/interfaces/cycle'

export interface AllocationInput {
  plannedHours: number
  subjects: Subject[]
}

export interface AllocationResult {
  cycleSubjectAllocations: Array<{
    subjectId: string
    allocatedHours: number
  }>
  plannedSessions: Array<Omit<PlannedSession, 'id' | 'cycleSubjectId' | 'cycleId'> & {
    subjectId: string
  }>
}

const FREE_STUDY_BLOCK_SECONDS = 3600
const DEFAULT_BLOCK_SECONDS = 7200

export const CycleService = {
  allocateHours(input: AllocationInput): Array<{ subjectId: string; allocatedHours: number }> {
    const { plannedHours, subjects } = input

    const freeStudy = subjects.find((s) => s.isFreeStudy)
    const freeStudyHours = freeStudy ? 3 : 0
    const studyPool = Math.max(0, plannedHours - freeStudyHours)

    const studySubjects = subjects.filter((s) => !s.isFreeStudy)
    const effectivePoints = studySubjects.map((s) => ({
      subjectId: s.id,
      points: s.cycleStatus === 'revision' ? s.points * 0.5 : s.points,
    }))

    const totalPoints = effectivePoints.reduce((sum, s) => sum + s.points, 0)

    const allocations: Array<{ subjectId: string; allocatedHours: number }> = []

    for (const ep of effectivePoints) {
      const hours = totalPoints > 0 ? (ep.points / totalPoints) * studyPool : 0
      allocations.push({ subjectId: ep.subjectId, allocatedHours: Number(hours.toFixed(4)) })
    }

    if (freeStudy) {
      allocations.push({ subjectId: freeStudy.id, allocatedHours: freeStudyHours })
    }

    return allocations
  },

  splitIntoBlocks(
    subjectId: string,
    allocatedHours: number,
    isFreeStudy: boolean
  ): Array<{ subjectId: string; allocatedSeconds: number }> {
    const blockSize = isFreeStudy ? FREE_STUDY_BLOCK_SECONDS : DEFAULT_BLOCK_SECONDS
    const totalSeconds = Math.round(allocatedHours * 3600)
    const blocks: Array<{ subjectId: string; allocatedSeconds: number }> = []

    let remaining = totalSeconds
    while (remaining > 0) {
      const block = Math.min(remaining, blockSize)
      if (block >= 60) {
        blocks.push({ subjectId, allocatedSeconds: block })
      }
      remaining -= block
    }

    return blocks
  },

  interleaveBlocks(
    allBlocks: Array<Array<{ subjectId: string; allocatedSeconds: number }>>
  ): Array<{ subjectId: string; allocatedSeconds: number; position: number }> {
    const queues = allBlocks.map((blocks) => [...blocks])
    const result: Array<{ subjectId: string; allocatedSeconds: number; position: number }> = []
    let position = 0

    while (queues.some((q) => q.length > 0)) {
      const sortedQueues = [...queues].sort((a, b) => b.length - a.length)
      for (const queue of sortedQueues) {
        if (queue.length > 0) {
          const block = queue.shift()!
          result.push({ ...block, position: position++ })
        }
      }
    }

    return result
  },

  buildCycleData(input: AllocationInput): AllocationResult {
    const allocations = CycleService.allocateHours(input)
    const subjectMap = new Map(input.subjects.map((s) => [s.id, s]))

    const allBlockQueues = allocations.map(({ subjectId, allocatedHours }) => {
      const subject = subjectMap.get(subjectId)!
      return CycleService.splitIntoBlocks(subjectId, allocatedHours, subject.isFreeStudy)
    })

    const interleaved = CycleService.interleaveBlocks(allBlockQueues)

    return {
      cycleSubjectAllocations: allocations,
      plannedSessions: interleaved.map((b) => ({
        subjectId: b.subjectId,
        allocatedSeconds: b.allocatedSeconds,
        position: b.position,
        status: 'pending' as const,
      })),
    }
  },
}
