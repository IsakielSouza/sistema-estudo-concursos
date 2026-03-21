import { SessionRepository } from '@/shared/database/repositories/session.repository'
import { getCurrentISOWeekBounds, getDaysElapsedSince } from '@/shared/helpers/time.helper'
import type { Subject } from '@/shared/interfaces/subject'
import type { CycleSubject } from '@/shared/interfaces/cycle'

export type PriorityBadge = 'slow_build' | 'revision' | null

export interface RecommendationItem {
  subjectId: string
  subjectName: string
  suggestedMinutes: number
  priorityBadge: PriorityBadge
  deficitHours: number
}

export interface RecommendationInput {
  cycleSubjects: Array<CycleSubject & { subject: Subject }>
  dayAvailableHours: number
  cycleStartedAt: string
}

export const RecommendationService = {
  async getWeeklyCompletedHours(
    subjectIds: string[]
  ): Promise<Map<string, number>> {
    const { start, end } = getCurrentISOWeekBounds()
    const map = new Map<string, number>()

    for (const subjectId of subjectIds) {
      const totalSeconds = await SessionRepository.getWeeklySecondsBySubject(
        subjectId,
        start,
        end
      )
      map.set(subjectId, totalSeconds / 3600)
    }

    return map
  },

  async recommend(input: RecommendationInput): Promise<RecommendationItem[]> {
    const { cycleSubjects, dayAvailableHours, cycleStartedAt } = input

    const daysElapsed = getDaysElapsedSince(cycleStartedAt)
    const isEarlyInCycle = daysElapsed <= 14

    const subjectIds = cycleSubjects.map((cs) => cs.subjectId)
    const weeklyCompleted = await RecommendationService.getWeeklyCompletedHours(subjectIds)

    const deficits = cycleSubjects
      .map((cs) => {
        const completedThisWeek = weeklyCompleted.get(cs.subjectId) ?? 0
        let deficit = cs.allocatedHours - completedThisWeek

        if (cs.subject.isSlowBuild && isEarlyInCycle) {
          deficit *= 1.3
        }

        const badge: PriorityBadge =
          cs.subject.isSlowBuild && isEarlyInCycle
            ? 'slow_build'
            : cs.subject.cycleStatus === 'revision'
            ? 'revision'
            : null

        return {
          subjectId: cs.subjectId,
          subjectName: cs.subject.name,
          deficit,
          badge,
        }
      })
      .filter((d) => d.deficit > 0)
      .sort((a, b) => b.deficit - a.deficit)

    if (!deficits.length) return []

    const totalDeficit = deficits.reduce((sum, d) => sum + d.deficit, 0)
    const dayAvailableMinutes = dayAvailableHours * 60

    return deficits.map((d) => {
      const proportion = d.deficit / totalDeficit
      const rawMinutes = proportion * dayAvailableMinutes
      const suggestedMinutes = Math.max(5, Math.round(rawMinutes / 5) * 5)

      return {
        subjectId: d.subjectId,
        subjectName: d.subjectName,
        suggestedMinutes,
        priorityBadge: d.badge,
        deficitHours: d.deficit,
      }
    })
  },

  async estimateWeeksToComplete(
    subjectId: string,
    doneTopic: number,
    totalTopics: number
  ): Promise<number | null> {
    if (totalTopics === 0) return null
    const remaining = totalTopics - doneTopic
    if (remaining === 0) return 0
    const allSessions = await SessionRepository.getBySubject(subjectId)
    if (allSessions.length === 0) return null
    return null // Phase 9 enhancement
  },
}
