// src/screens/History/History.view.tsx
import { colors } from '@/constants/colors'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { DayCardView } from './components/DayCard/DayCard.view'
import { CycleComplianceCardView } from './components/CycleComplianceCard/CycleComplianceCard.view'
import { useHistoryViewModel } from './useHistory.viewModel'
import { formatSecondsToHHMM } from '@/shared/helpers/time.helper'

export const HistoryView = () => {
  const { sessionsByDate, sessionsByWeek, cycleStats, totalStudiedFormatted, isLoading } =
    useHistoryViewModel()

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.pageTitle}>Histórico</Text>

      {isLoading ? (
        <ActivityIndicator color={colors.brand.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Total geral */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total estudado</Text>
            <Text style={styles.summaryValue}>{totalStudiedFormatted}</Text>
          </View>

          {/* Totais por semana ISO */}
          {sessionsByWeek.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Por semana</Text>
              {sessionsByWeek.map((week) => (
                <View key={week.weekKey} style={styles.weekCard}>
                  <View style={styles.weekHeader}>
                    <Text style={styles.weekKey}>{week.weekKey}</Text>
                    <Text style={styles.weekTotal}>{formatSecondsToHHMM(week.totalSeconds)}</Text>
                  </View>
                  {week.subjects.map((s) => (
                    <View key={s.subjectName} style={styles.weekRow}>
                      <Text style={styles.weekSubject} numberOfLines={1}>{s.subjectName}</Text>
                      <Text style={styles.weekTime}>{formatSecondsToHHMM(s.totalSeconds)}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}

          {/* Cumprimento por ciclo */}
          {cycleStats.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cumprimento por ciclo</Text>
              {cycleStats.map((stat) => (
                <CycleComplianceCardView key={stat.cycleId} stat={stat} />
              ))}
            </View>
          )}

          {/* Sessões por data */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sessões</Text>
            {sessionsByDate.length === 0 ? (
              <Text style={styles.empty}>Nenhuma sessão registrada ainda.</Text>
            ) : (
              sessionsByDate.map((day) => (
                <DayCardView key={day.date} day={day} />
              ))
            )}
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.grayscale.gray100,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: colors.background.elevated,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: { fontSize: 14, color: colors.grayscale.gray400 },
  summaryValue: { fontSize: 22, fontWeight: '700', color: colors.brand.primary },
  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.grayscale.gray400,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  empty: { fontSize: 14, color: colors.grayscale.gray500, textAlign: 'center', marginTop: 24 },
  weekCard: {
    backgroundColor: colors.background.elevated,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    gap: 6,
  },
  weekHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  weekKey: { fontSize: 12, fontWeight: '700', color: colors.grayscale.gray300 },
  weekTotal: { fontSize: 12, fontWeight: '700', color: colors.brand.primary },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  weekSubject: { fontSize: 12, color: colors.grayscale.gray200, flex: 1 },
  weekTime: { fontSize: 12, color: colors.grayscale.gray400 },
})
