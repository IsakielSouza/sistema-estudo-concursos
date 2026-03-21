import { colors } from '@/constants/colors'
import { Ionicons } from '@expo/vector-icons'
import BottomSheet from '@gorhom/bottom-sheet'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CycleResumoView } from './components/CycleResumo/CycleResumo.view'
import { NewCycleBottomSheetView } from './components/NewCycleBottomSheet/NewCycleBottomSheet.view'
import { SessionRowView } from './components/SessionRow/SessionRow.view'
import { useCycleViewModel } from './useCycle.viewModel'

export const CycleView = () => {
  const {
    plannedSessions,
    cycleSubjects,
    isLoading,
    totalSessions,
    doneSessions,
    totalAllocatedHours,
    totalCompletedHours,
    activeCycleId,
    bottomSheetRef,
    handlePlaySession,
    handleOpenNewCycle,
  } = useCycleViewModel()

  const resumoRows = [
    {
      label: 'Total',
      allocatedSeconds: Math.round(totalAllocatedHours * 3600),
      completedSeconds: Math.round(totalCompletedHours * 3600),
      isTotal: true,
    },
    ...cycleSubjects.map((cs) => ({
      label: cs.subject?.name ?? '',
      allocatedSeconds: Math.round(cs.allocatedHours * 3600),
      completedSeconds: Math.round(cs.completedHours * 3600),
    })),
  ]

  if (!activeCycleId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Nenhum ciclo ativo</Text>
          <TouchableOpacity style={styles.newButton} onPress={handleOpenNewCycle}>
            <Ionicons name="add" size={20} color={colors.grayscale.gray100} />
            <Text style={styles.newButtonText}>Novo Ciclo</Text>
          </TouchableOpacity>
        </View>
        <BottomSheet ref={bottomSheetRef} index={-1} snapPoints={['85%']} enablePanDownToClose>
          <NewCycleBottomSheetView onClose={() => bottomSheetRef.current?.close()} />
        </BottomSheet>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Ciclo Ativo</Text>
          <Text style={styles.progress}>
            {doneSessions} de {totalSessions} sessões concluídas
          </Text>
        </View>
        <TouchableOpacity style={styles.newButton} onPress={handleOpenNewCycle}>
          <Ionicons name="add" size={18} color={colors.grayscale.gray100} />
        </TouchableOpacity>
      </View>

      <View style={styles.columnHeaders}>
        <Text style={[styles.colHeader, { flex: 1 }]}>Matéria</Text>
        <Text style={[styles.colHeader, { minWidth: 70, textAlign: 'center' }]}>Sessão</Text>
        <Text style={[styles.colHeader, { minWidth: 100 }]}>Tempo restante</Text>
        <View style={{ width: 36 + 8 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.sessionList}>
          {plannedSessions.map((session) => {
            const cs = cycleSubjects.find((cs) => cs.id === session.cycleSubjectId)
            return (
              <SessionRowView
                key={session.id}
                session={{ ...session, subjectName: cs?.subject?.name ?? '' }}
                onPlay={handlePlaySession}
              />
            )
          })}
        </View>

        <CycleResumoView rows={resumoRows} />
      </ScrollView>

      <BottomSheet ref={bottomSheetRef} index={-1} snapPoints={['85%']} enablePanDownToClose>
        <NewCycleBottomSheetView onClose={() => bottomSheetRef.current?.close()} />
      </BottomSheet>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: { fontSize: 22, color: colors.grayscale.gray100, fontFamily: 'Baloo2_800ExtraBold' },
  progress: { fontSize: 13, color: colors.grayscale.gray400, marginTop: 2 },
  columnHeaders: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 8,
    alignItems: 'center',
  },
  colHeader: { fontSize: 12, color: colors.grayscale.gray500, textTransform: 'uppercase' },
  scroll: { paddingHorizontal: 20, paddingBottom: 100 },
  sessionList: { gap: 12 },
  newButton: {
    backgroundColor: colors.brand.primary,
    borderRadius: 8,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  newButtonText: { color: colors.grayscale.gray100, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  emptyTitle: { fontSize: 18, color: colors.grayscale.gray400 },
  sheetContent: { padding: 24, alignItems: 'center' },
  sheetTitle: { fontSize: 20, color: colors.grayscale.gray100, fontFamily: 'Baloo2_800ExtraBold' },
  sheetSubtitle: { fontSize: 14, color: colors.grayscale.gray400, marginTop: 8 },
})
