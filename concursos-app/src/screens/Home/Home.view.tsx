import { colors } from '@/constants/colors'
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CycleProgressCardView } from './components/CycleProgressCard/CycleProgressCard.view'
import { RecommendationCardView } from './components/RecommendationCard/RecommendationCard.view'
import { useHomeViewModel } from './useHome.viewModel'

export const HomeView = () => {
  const {
    isSyncing, syncError, activeCycle, cycleProgress,
    cycleStatusLabel, recommendations, dayAvailableHours, setDayAvailableHours,
  } = useHomeViewModel()

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {isSyncing && (
          <View style={styles.syncBanner}>
            <ActivityIndicator size="small" color={colors.grayscale.gray400} />
            <Text style={styles.syncText}>Sincronizando planilha...</Text>
          </View>
        )}

        {syncError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>Erro ao sincronizar: {syncError}</Text>
          </View>
        )}

        {activeCycle && (
          <CycleProgressCardView
            cycle={activeCycle}
            progressRatio={cycleProgress}
            statusLabel={cycleStatusLabel}
          />
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recomendação de Hoje</Text>
            <View style={styles.hoursInput}>
              <Text style={styles.hoursLabel}>Horas disponíveis:</Text>
              <TextInput
                style={styles.hoursField}
                value={String(dayAvailableHours)}
                onChangeText={(v) => {
                  const n = parseFloat(v)
                  if (!Number.isNaN(n) && n >= 0) setDayAvailableHours(n)
                }}
                keyboardType="decimal-pad"
                selectTextOnFocus
              />
            </View>
          </View>

          {recommendations.length === 0 ? (
            <Text style={styles.empty}>
              {activeCycle ? 'Sem déficit para hoje! 🎉' : 'Crie um ciclo para ver recomendações'}
            </Text>
          ) : (
            <View style={styles.recList}>
              {recommendations.map((item) => (
                <RecommendationCardView key={item.subjectId} item={item} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100, gap: 20 },
  syncBanner: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  syncText: { color: colors.grayscale.gray500, fontSize: 12 },
  errorBanner: { backgroundColor: colors.status.error + '33', padding: 8, borderRadius: 8 },
  errorText: { color: colors.status.error, fontSize: 12 },
  section: { gap: 12 },
  sectionHeader: { gap: 8 },
  sectionTitle: { fontSize: 18, color: colors.grayscale.gray100, fontFamily: 'Baloo2_800ExtraBold' },
  hoursInput: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hoursLabel: { fontSize: 13, color: colors.grayscale.gray400 },
  hoursField: {
    backgroundColor: colors.background.card,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: colors.grayscale.gray100,
    fontSize: 14,
    minWidth: 50,
    textAlign: 'center',
  },
  recList: { gap: 8 },
  empty: { color: colors.grayscale.gray500, fontSize: 14, textAlign: 'center', paddingVertical: 20 },
})
