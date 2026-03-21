import { colors } from '@/constants/colors'
import { Ionicons } from '@expo/vector-icons'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { TopicRowView } from './components/TopicRow/TopicRow.view'
import { useSubjectViewModel } from './useSubject.viewModel'

export const SubjectView = () => {
  const {
    subject, topics, progress, progressRatio,
    handleTopicToggle, handleEditalComplete,
  } = useSubjectViewModel()

  if (!subject) return null

  const isRevision = subject.cycleStatus === 'revision'

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.grayscale.gray100} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{subject.name}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.meta}>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Peso na prova</Text>
          <Text style={styles.metaValue}>{subject.points} pts</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Status</Text>
          <View style={[styles.badge, isRevision ? styles.badgeRevision : styles.badgeActive]}>
            <Text style={styles.badgeText}>{isRevision ? 'Revisão' : 'Ativo'}</Text>
          </View>
        </View>
        {!isRevision && (
          <TouchableOpacity style={styles.editalButton} onPress={handleEditalComplete}>
            <Ionicons name="checkmark-circle-outline" size={16} color={colors.brand.primary} />
            <Text style={styles.editalButtonText}>Concluiu o edital?</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Progresso dos tópicos</Text>
          <Text style={styles.progressCount}>
            {progress?.done ?? 0} / {progress?.total ?? 0}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressRatio * 100}%` }]} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {topics.map((topic) => (
          <TopicRowView
            key={topic.id}
            topic={topic}
            onToggle={handleTopicToggle}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: { fontSize: 18, color: colors.grayscale.gray100, fontWeight: '600', flex: 1, textAlign: 'center' },
  meta: { paddingHorizontal: 20, gap: 8, paddingBottom: 16 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaLabel: { fontSize: 14, color: colors.grayscale.gray500 },
  metaValue: { fontSize: 14, color: colors.grayscale.gray200, fontWeight: '600' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeActive: { backgroundColor: colors.brand.primary + '33' },
  badgeRevision: { backgroundColor: colors.status.warning + '33' },
  badgeText: { fontSize: 12, color: colors.grayscale.gray100, fontWeight: '600' },
  editalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  editalButtonText: { fontSize: 14, color: colors.brand.primary },
  progressSection: { paddingHorizontal: 20, paddingBottom: 16, gap: 8 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: 13, color: colors.grayscale.gray400 },
  progressCount: { fontSize: 13, color: colors.grayscale.gray400 },
  progressTrack: { height: 6, backgroundColor: colors.background.elevated, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: colors.brand.primary, borderRadius: 3 },
})
