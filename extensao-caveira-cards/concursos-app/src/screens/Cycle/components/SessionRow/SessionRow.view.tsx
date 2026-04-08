import { colors } from '@/constants/colors'
import { Ionicons } from '@expo/vector-icons'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import type { PlannedSession } from '@/shared/interfaces/cycle'

interface Props {
  session: PlannedSession & { subjectName: string }
  onPlay: (id: string) => void
}

function formatSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':')
}

export const SessionRowView = ({ session, onPlay }: Props) => {
  const isDone = session.status === 'done'

  return (
    <View style={[styles.row, isDone && styles.rowDone]}>
      <Text style={[styles.subjectName, isDone && styles.textDone]} numberOfLines={1}>
        {session.subjectName}
      </Text>
      <Text style={[styles.sessionTime, isDone && styles.textDone]}>
        {formatSeconds(session.allocatedSeconds)}
      </Text>
      <TouchableOpacity
        style={[styles.playButton, isDone && styles.playButtonDone]}
        onPress={() => !isDone && onPlay(session.id)}
        disabled={isDone}
      >
        <Ionicons
          name={isDone ? 'checkmark' : 'play'}
          size={16}
          color={isDone ? colors.status.success : colors.grayscale.gray100}
        />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 8,
  },
  rowDone: { opacity: 0.5 },
  subjectName: { flex: 1, color: colors.grayscale.gray100, fontSize: 15, fontWeight: '600' },
  sessionTime: { color: colors.grayscale.gray100, fontSize: 15, fontWeight: '600', minWidth: 70, textAlign: 'center' },
  textDone: { color: colors.grayscale.gray600 },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonDone: { backgroundColor: colors.background.elevated },
})
