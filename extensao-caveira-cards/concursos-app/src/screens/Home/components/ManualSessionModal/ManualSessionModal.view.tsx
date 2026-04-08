import { colors } from '@/constants/colors'
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useState } from 'react'

interface Props {
  visible: boolean
  subjectName: string
  isLoading: boolean
  onConfirm: (minutes: number) => void
  onClose: () => void
}

export const ManualSessionModalView = ({
  visible,
  subjectName,
  isLoading,
  onConfirm,
  onClose,
}: Props) => {
  const [minutesText, setMinutesText] = useState('')

  const handleConfirm = () => {
    const minutes = parseFloat(minutesText)
    if (Number.isNaN(minutes) || minutes <= 0) return
    onConfirm(minutes)
  }

  const handleClose = () => {
    setMinutesText('')
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Registrar sessão manualmente</Text>
          <Text style={styles.subtitle}>{subjectName}</Text>

          <Text style={styles.label}>Quanto tempo você estudou? (minutos)</Text>
          <TextInput
            style={styles.input}
            value={minutesText}
            onChangeText={setMinutesText}
            keyboardType="decimal-pad"
            placeholder="ex: 120"
            placeholderTextColor={colors.grayscale.gray600}
            autoFocus
          />

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, isLoading && styles.buttonDisabled]}
              onPress={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.confirmText}>Confirmar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.background.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    gap: 12,
  },
  title: {
    fontSize: 18,
    color: colors.grayscale.gray100,
    fontFamily: 'Baloo2_800ExtraBold',
  },
  subtitle: { fontSize: 14, color: colors.grayscale.gray400 },
  label: { fontSize: 13, color: colors.grayscale.gray400 },
  input: {
    backgroundColor: colors.background.elevated,
    borderRadius: 8,
    padding: 12,
    color: colors.grayscale.gray100,
    fontSize: 16,
  },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.grayscale.gray700,
    alignItems: 'center',
  },
  cancelText: { color: colors.grayscale.gray400, fontWeight: '600' },
  confirmButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  confirmText: { color: '#fff', fontWeight: '700' },
})
