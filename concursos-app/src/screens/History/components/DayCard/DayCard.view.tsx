// src/screens/History/components/DayCard/DayCard.view.tsx
import { colors } from '@/constants/colors'
import { StyleSheet, Text, View } from 'react-native'
import type { SessionsByDate } from '@/shared/interfaces/session'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatSecondsToHHMM } from '@/shared/helpers/time.helper'

interface Props {
  day: SessionsByDate
}

export const DayCardView = ({ day }: Props) => {
  const label = format(parseISO(day.date), "EEE, dd 'de' MMM", { locale: ptBR })

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.date}>{label}</Text>
        <Text style={styles.total}>{formatSecondsToHHMM(day.totalSeconds)}</Text>
      </View>
      {day.sessions.map((s) => (
        <View key={s.sessionId} style={styles.row}>
          <Text style={styles.subject} numberOfLines={1}>{s.subjectName}</Text>
          <Text style={styles.time}>{formatSecondsToHHMM(s.studySeconds)}</Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: colors.background.elevated,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  date: { fontSize: 13, fontWeight: '600', color: colors.grayscale.gray300 },
  total: { fontSize: 13, fontWeight: '700', color: colors.brand.primary },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  subject: { fontSize: 13, color: colors.grayscale.gray200, flex: 1 },
  time: { fontSize: 13, color: colors.grayscale.gray400 },
})
