import { colors } from '@/constants/colors'
import { Ionicons } from '@expo/vector-icons'
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSessionViewModel } from './useSession.viewModel'

function formatSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':')
}

export const SessionView = () => {
  const {
    subject, plannedSession, elapsedSeconds, remainingSeconds, allocatedSeconds,
    reviewSeconds, isRunning, includeReview, showExitModal, isSaving,
    play, pause, setIncludeReview, handleEarlyExit, confirmExit, cancelExit,
  } = useSessionViewModel()

  if (!plannedSession || !subject) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={colors.brand.primary} />
      </SafeAreaView>
    )
  }

  const progressRatio = allocatedSeconds > 0 ? elapsedSeconds / allocatedSeconds : 0

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleEarlyExit}>
          <Ionicons name="close" size={24} color={colors.grayscale.gray400} />
        </TouchableOpacity>
        <Text style={styles.subjectName} numberOfLines={1}>{subject.name}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.timerContainer}>
        <Text style={styles.elapsed}>{formatSeconds(elapsedSeconds)}</Text>
        <Text style={styles.remaining}>Restam {formatSeconds(remainingSeconds)}</Text>
        <Text style={styles.goal}>Meta: {formatSeconds(allocatedSeconds)}</Text>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.min(100, progressRatio * 100)}%` }]} />
        </View>

        {includeReview && (
          <Text style={styles.reviewInfo}>
            Revisão: {formatSeconds(reviewSeconds)} incluída
          </Text>
        )}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.toggleButton, includeReview && styles.toggleActive]}
          onPress={() => setIncludeReview(!includeReview)}
        >
          <Ionicons name="refresh" size={16} color={includeReview ? colors.grayscale.gray100 : colors.grayscale.gray500} />
          <Text style={[styles.toggleText, includeReview && styles.toggleTextActive]}>
            Revisão (1/3)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.playPauseButton}
          onPress={isRunning ? pause : play}
        >
          <Ionicons
            name={isRunning ? 'pause' : 'play'}
            size={32}
            color={colors.grayscale.gray100}
          />
        </TouchableOpacity>
      </View>

      <Modal visible={showExitModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Encerrar sessão?</Text>
            <Text style={styles.modalBody}>
              Progresso ({formatSeconds(elapsedSeconds)}) será salvo.
            </Text>
            <TouchableOpacity style={styles.confirmButton} onPress={confirmExit} disabled={isSaving}>
              {isSaving
                ? <ActivityIndicator color={colors.grayscale.gray100} />
                : <Text style={styles.confirmText}>Encerrar e salvar</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={cancelExit}>
              <Text style={styles.cancelText}>Continuar estudando</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingTop: 8,
    paddingBottom: 16,
  },
  subjectName: { fontSize: 18, color: colors.grayscale.gray100, fontWeight: '600', flex: 1, textAlign: 'center' },
  timerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  elapsed: { fontSize: 72, color: colors.grayscale.gray100, fontFamily: 'Baloo2_800ExtraBold', letterSpacing: -2 },
  remaining: { fontSize: 18, color: colors.grayscale.gray400, marginTop: 8 },
  goal: { fontSize: 14, color: colors.grayscale.gray600, marginTop: 4 },
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: colors.background.elevated,
    borderRadius: 3,
    marginTop: 32,
    overflow: 'hidden',
  },
  progressFill: { height: 6, backgroundColor: colors.brand.primary, borderRadius: 3 },
  reviewInfo: { fontSize: 13, color: colors.status.warning, marginTop: 12 },
  controls: { paddingHorizontal: 40, paddingBottom: 48, gap: 24, alignItems: 'center' },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.grayscale.gray700,
  },
  toggleActive: { borderColor: colors.brand.primary, backgroundColor: colors.brand.primary + '22' },
  toggleText: { fontSize: 14, color: colors.grayscale.gray500 },
  toggleTextActive: { color: colors.grayscale.gray100 },
  playPauseButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: { flex: 1, backgroundColor: '#000000AA', alignItems: 'center', justifyContent: 'center' },
  modalCard: {
    backgroundColor: colors.background.card,
    borderRadius: 16,
    padding: 24,
    width: '85%',
    gap: 12,
  },
  modalTitle: { fontSize: 20, color: colors.grayscale.gray100, fontWeight: '700', textAlign: 'center' },
  modalBody: { fontSize: 14, color: colors.grayscale.gray400, textAlign: 'center' },
  confirmButton: {
    backgroundColor: colors.brand.primary,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  confirmText: { color: colors.grayscale.gray100, fontWeight: '700' },
  cancelButton: { padding: 14, alignItems: 'center' },
  cancelText: { color: colors.grayscale.gray400 },
})
