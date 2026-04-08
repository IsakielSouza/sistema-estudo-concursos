import { colors } from '@/constants/colors'
import { StyleSheet, Text, View } from 'react-native'
import type { Cycle } from '@/shared/interfaces/cycle'

interface Props { cycle: Cycle; progressRatio: number; statusLabel: string }

export const CycleProgressCardView = ({ cycle, progressRatio, statusLabel }: Props) => {
  const statusColor =
    statusLabel === 'Atrasado' ? (colors.status.late ?? colors.status.error) :
    statusLabel === 'Concluído' ? colors.status.success :
    colors.brand.primary  // 'Em dia' / active = brand blue

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.cycleName}>{cycle.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '33' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.min(100, progressRatio * 100)}%` }]} />
      </View>
      <Text style={styles.hoursLabel}>
        {cycle.completedHours.toFixed(1)}h / {cycle.plannedHours}h
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.card,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cycleName: { fontSize: 16, color: colors.grayscale.gray100, fontWeight: '600', flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
  progressTrack: { height: 8, backgroundColor: colors.background.elevated, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, backgroundColor: colors.brand.primary, borderRadius: 4 },
  hoursLabel: { fontSize: 13, color: colors.grayscale.gray500 },
})
