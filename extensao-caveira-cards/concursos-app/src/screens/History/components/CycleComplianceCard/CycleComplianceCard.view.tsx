// src/screens/History/components/CycleComplianceCard/CycleComplianceCard.view.tsx
import { colors } from '@/constants/colors'
import { StyleSheet, Text, View } from 'react-native'
import type { CycleComplianceStat } from '@/shared/interfaces/session'

interface Props {
  stat: CycleComplianceStat
}

export const CycleComplianceCardView = ({ stat }: Props) => {
  const ratio =
    stat.plannedHours > 0
      ? Math.min(stat.completedHours / stat.plannedHours, 1)
      : 0
  const pct = Math.round(ratio * 100)
  const isLate = stat.status === 'late'

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.label}>Ciclo #{stat.cycleNumber}</Text>
        <Text style={[styles.pct, isLate && styles.pctLate]}>{pct}%</Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { width: `${pct}%` as any },
            pct >= 80 ? styles.fillGood : styles.fillWeak,
          ]}
        />
      </View>
      <Text style={styles.sub}>
        {stat.completedHours.toFixed(1)}h / {stat.plannedHours.toFixed(1)}h planejadas
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.elevated,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    gap: 6,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 13, fontWeight: '600', color: colors.grayscale.gray200 },
  pct: { fontSize: 13, fontWeight: '700', color: colors.brand.primary },
  pctLate: { color: colors.status.warning },
  track: {
    height: 4,
    backgroundColor: colors.background.primary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: { height: 4, borderRadius: 2 },
  fillGood: { backgroundColor: colors.status.success },
  fillWeak: { backgroundColor: colors.status.warning },
  sub: { fontSize: 11, color: colors.grayscale.gray500 },
})
