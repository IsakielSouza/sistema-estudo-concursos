import { colors } from '@/constants/colors'
import type { PlannedSession } from '@/shared/interfaces/cycle'
import { StyleSheet, Text, View } from 'react-native'
import { SessionRowView } from './SessionRow.view'

interface Props {
  sessions: PlannedSession[]
  subjectNameMap: Map<string, string>   // subjectId → name
  subjectColorMap: Map<string, string>  // subjectId → hex color
  inProgressElapsedSeconds: number      // elapsed for whichever session is in_progress
  inProgressSessionId: string | null    // which session is in_progress (if any)
  onPlay: (id: string) => void
  onOpenManualModal: (session: PlannedSession) => void
  onUndo: (id: string) => void
}

export const SessionListView = ({
  sessions,
  subjectNameMap,
  subjectColorMap,
  inProgressElapsedSeconds,
  inProgressSessionId,
  onPlay,
  onOpenManualModal,
  onUndo,
}: Props) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Sessões</Text>
      <View style={styles.list}>
        {sessions.map((session) => (
          <SessionRowView
            key={session.id}
            session={session}
            subjectName={subjectNameMap.get(session.subjectId) ?? '—'}
            subjectColor={subjectColorMap.get(session.subjectId) ?? '#4F6CF7'}
            elapsedSeconds={session.id === inProgressSessionId ? inProgressElapsedSeconds : 0}
            onPlay={onPlay}
            onOpenManualModal={onOpenManualModal}
            onUndo={onUndo}
          />
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  sectionTitle: {
    fontSize: 16,
    color: colors.grayscale.gray300,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  list: { gap: 8 },
})
