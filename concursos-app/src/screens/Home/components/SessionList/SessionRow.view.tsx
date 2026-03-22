import { colors } from '@/constants/colors'
import type { PlannedSession } from '@/shared/interfaces/cycle'
import { Ionicons } from '@expo/vector-icons'
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

function formatSeconds(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

interface Props {
  session: PlannedSession
  subjectName: string
  subjectColor: string
  elapsedSeconds: number   // Only meaningful for in_progress; 0 otherwise
  onPlay: (id: string) => void
  onOpenManualModal: (session: PlannedSession) => void
  onUndo: (id: string) => void
}

export const SessionRowView = ({
  session,
  subjectName,
  subjectColor,
  elapsedSeconds,
  onPlay,
  onOpenManualModal,
  onUndo,
}: Props) => {
  const isDone = session.status === 'done'
  const isInProgress = session.status === 'in_progress'

  const remaining =
    isDone ? 0
    : isInProgress ? Math.max(0, session.allocatedSeconds - elapsedSeconds)
    : session.allocatedSeconds

  const handleMenu = () => {
    if (isDone) {
      Alert.alert('Sessão', subjectName, [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desfazer execução',
          style: 'destructive',
          onPress: () => onUndo(session.id),
        },
      ])
    } else {
      Alert.alert('Sessão', subjectName, [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Registrar como feito',
          onPress: () => onOpenManualModal(session),
        },
      ])
    }
  }

  return (
    <View style={[styles.row, isDone && styles.rowDone]}>
      <View style={[styles.colorDot, { backgroundColor: isDone ? '#4CAF50' : subjectColor }]} />

      <View style={styles.info}>
        <Text style={styles.subjectName} numberOfLines={1}>{subjectName}</Text>
        <Text style={styles.sessionTime}>{formatSeconds(session.allocatedSeconds)}</Text>
      </View>

      <View style={styles.remaining}>
        <Ionicons name="time-outline" size={12} color={colors.grayscale.gray500} />
        <Text style={styles.remainingText}>{formatSeconds(remaining)}</Text>
      </View>

      {isDone ? (
        <Ionicons name="checkmark-circle" size={28} color="#4CAF50" style={styles.actionIcon} />
      ) : (
        <TouchableOpacity onPress={() => onPlay(session.id)} style={styles.actionIcon}>
          <Ionicons
            name={isInProgress ? 'play-circle' : 'play-circle-outline'}
            size={28}
            color={isInProgress ? colors.brand.primary : colors.grayscale.gray400}
          />
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={handleMenu} style={styles.menuButton}>
        <Ionicons name="ellipsis-vertical" size={18} color={colors.grayscale.gray500} />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  rowDone: { opacity: 0.6 },
  colorDot: { width: 8, height: 8, borderRadius: 4 },
  info: { flex: 1 },
  subjectName: { color: colors.grayscale.gray100, fontSize: 14, fontWeight: '600' },
  sessionTime: { color: colors.grayscale.gray500, fontSize: 12, marginTop: 2 },
  remaining: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  remainingText: { color: colors.grayscale.gray500, fontSize: 12, fontVariant: ['tabular-nums'] },
  actionIcon: { paddingHorizontal: 4 },
  menuButton: { padding: 4 },
})
