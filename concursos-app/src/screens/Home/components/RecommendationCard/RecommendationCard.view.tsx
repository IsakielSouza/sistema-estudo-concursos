import { colors } from '@/constants/colors'
import { StyleSheet, Text, View } from 'react-native'
import type { RecommendationItem } from '@/shared/services/recommendation.service'

interface Props { item: RecommendationItem }

const BADGE_LABELS = {
  slow_build: '🐢 Construção lenta',
  revision: '🔄 Revisão',
}

export const RecommendationCardView = ({ item }: Props) => {
  const hours = Math.floor(item.suggestedMinutes / 60)
  const mins = item.suggestedMinutes % 60
  const timeLabel = hours > 0 ? `${hours}h${mins > 0 ? `${mins}min` : ''}` : `${mins}min`

  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <Text style={styles.name} numberOfLines={1}>{item.subjectName}</Text>
        {item.priorityBadge && (
          <Text style={styles.badge}>{BADGE_LABELS[item.priorityBadge]}</Text>
        )}
      </View>
      <Text style={styles.time}>{timeLabel}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  left: { flex: 1, gap: 2 },
  name: { fontSize: 15, color: colors.grayscale.gray100, fontWeight: '600' },
  badge: { fontSize: 11, color: colors.status.warning },
  time: { fontSize: 20, color: colors.brand.primary, fontWeight: '700', marginLeft: 12 },
})
