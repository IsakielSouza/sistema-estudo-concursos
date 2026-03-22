// src/screens/Home/Home.view.tsx
import { colors } from '@/constants/colors'
import { Ionicons } from '@expo/vector-icons'
import BottomSheet from '@gorhom/bottom-sheet'
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NewCycleBottomSheetView } from '@/screens/Cycle/components/NewCycleBottomSheet/NewCycleBottomSheet.view'
import { HomeHeaderView } from './components/HomeHeader/HomeHeader.view'
import { CycleCircleView } from './components/CycleCircle/CycleCircle.view'
import { SessionListView } from './components/SessionList/SessionList.view'
import { ManualSessionModalView } from './components/ManualSessionModal/ManualSessionModal.view'
import { useHomeViewModel } from './useHome.viewModel'

export const HomeView = () => {
  const {
    user,
    plannedSessions,
    subjectColorMap,
    subjectNameMap,
    centerState,
    centerSubjectName,
    centerTimeLabel,
    inProgressSessionId,
    inProgressElapsedSeconds,
    modalSession,
    modalSubjectName,
    isRegisteringManual,
    bottomSheetRef,
    handlePlaySession,
    handleContinueSession,
    handleRegisterManual,
    handleUndoSession,
    handleOpenModal,
    handleCloseModal,
    handleOpenNewCycle,
  } = useHomeViewModel()

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <HomeHeaderView userPhotoUrl={user?.photoUrl ?? null} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <CycleCircleView
          sessions={plannedSessions}
          subjectColorMap={subjectColorMap}
          centerState={centerState}
          centerSubjectName={centerSubjectName}
          centerTimeLabel={centerTimeLabel}
          onStart={() => {
            const next = plannedSessions.find((s) => s.status === 'pending')
            if (next) handlePlaySession(next.id)
          }}
          onContinue={handleContinueSession}
        />

        {plannedSessions.length > 0 && (
          <SessionListView
            sessions={plannedSessions}
            subjectNameMap={subjectNameMap}
            subjectColorMap={subjectColorMap}
            inProgressElapsedSeconds={inProgressElapsedSeconds}
            inProgressSessionId={inProgressSessionId}
            onPlay={handlePlaySession}
            onOpenManualModal={handleOpenModal}
            onUndo={handleUndoSession}
          />
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleOpenNewCycle}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Manual Registration Modal */}
      <ManualSessionModalView
        visible={!!modalSession}
        subjectName={modalSubjectName}
        isLoading={isRegisteringManual}
        onConfirm={(minutes) => {
          if (modalSession) handleRegisterManual(modalSession.id, minutes)
        }}
        onClose={handleCloseModal}
      />

      {/* New Cycle Bottom Sheet */}
      <BottomSheet ref={bottomSheetRef} index={-1} snapPoints={['85%']} enablePanDownToClose>
        <NewCycleBottomSheetView onClose={() => bottomSheetRef.current?.close()} />
      </BottomSheet>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
    gap: 24,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
})
