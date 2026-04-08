import {
  startOfISOWeek,
  endOfISOWeek,
  differenceInDays,
} from 'date-fns'

export function getCurrentISOWeekBounds(): { start: string; end: string } {
  const now = new Date()
  return {
    start: startOfISOWeek(now).toISOString(),
    end: endOfISOWeek(now).toISOString(),
  }
}

export function getDaysElapsedSince(isoDateString: string): number {
  return differenceInDays(new Date(), new Date(isoDateString))
}

export function formatHoursToDisplay(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (m === 0) return `${h}h`
  return `${h}h${String(m).padStart(2, '0')}m`
}

export function formatSecondsToHHMM(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
