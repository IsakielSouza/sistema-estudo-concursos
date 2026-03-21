import { colors } from '@/constants/colors'
import { Ionicons } from '@expo/vector-icons'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import type { Topic } from '@/shared/interfaces/topic'

interface Props {
  topic: Topic
  onToggle: (id: string, status: 'pending' | 'done') => void
}

const INDENT = [0, 0, 16, 32]

export const TopicRowView = ({ topic, onToggle }: Props) => {
  const isDone = topic.status === 'done'
  const indent = INDENT[topic.level] ?? 32

  return (
    <TouchableOpacity
      style={[styles.row, { paddingLeft: 16 + indent }]}
      onPress={() => onToggle(topic.id, topic.status)}
      activeOpacity={0.7}
    >
      <View style={[styles.checkbox, isDone && styles.checkboxDone]}>
        {isDone && <Ionicons name="checkmark" size={14} color={colors.grayscale.gray100} />}
      </View>
      <Text
        style={[
          styles.title,
          topic.level === 1 ? styles.levelOne : styles.levelTwo,
          isDone && styles.done,
        ]}
      >
        {topic.code ? `${topic.code} — ${topic.title}` : topic.title}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingRight: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.background.elevated,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.grayscale.gray600,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxDone: { backgroundColor: colors.status.success, borderColor: colors.status.success },
  title: { flex: 1, color: colors.grayscale.gray200, lineHeight: 20 },
  levelOne: { fontSize: 15, fontWeight: '600' },
  levelTwo: { fontSize: 13, color: colors.grayscale.gray400 },
  done: { textDecorationLine: 'line-through', color: colors.grayscale.gray600 },
})
