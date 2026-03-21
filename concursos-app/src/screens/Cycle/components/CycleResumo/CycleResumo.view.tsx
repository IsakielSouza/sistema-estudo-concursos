import { colors } from '@/constants/colors'
import { Ionicons } from '@expo/vector-icons'
import { StyleSheet, Text, View } from 'react-native'

interface ResumoRow {
  label: string
  allocatedSeconds: number
  completedSeconds: number
  isTotal?: boolean
}

interface Props {
  rows: ResumoRow[]
}

function formatSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':')
}

export const CycleResumoView = ({ rows }: Props) => (
  <View style={styles.container}>
    <Text style={styles.heading}>Resumo</Text>
    <View style={styles.table}>
      {rows.map((row) => (
        <View key={row.label} style={[styles.row, row.isTotal && styles.totalRow]}>
          <Text style={[styles.label, row.isTotal && styles.totalLabel]} numberOfLines={1}>
            {row.label}
          </Text>
          <Text style={[styles.value, row.isTotal && styles.totalLabel]}>
            {formatSeconds(row.allocatedSeconds)}
          </Text>
          <View style={styles.completed}>
            <Ionicons name="time-outline" size={14} color={colors.grayscale.gray400} />
            <Text style={[styles.value, row.isTotal && styles.totalLabel]}>
              {formatSeconds(row.completedSeconds)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  </View>
)

const styles = StyleSheet.create({
  container: { marginTop: 32 },
  heading: { fontSize: 18, color: colors.grayscale.gray100, fontFamily: 'Baloo2_800ExtraBold', marginBottom: 12 },
  table: { backgroundColor: colors.background.card, borderRadius: 12, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.background.elevated,
  },
  totalRow: { backgroundColor: colors.background.elevated },
  label: { flex: 1, color: colors.grayscale.gray300, fontSize: 15 },
  totalLabel: { color: colors.grayscale.gray100, fontWeight: '700' },
  value: { color: colors.grayscale.gray300, fontSize: 15, minWidth: 80, textAlign: 'center' },
  completed: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 100 },
})
