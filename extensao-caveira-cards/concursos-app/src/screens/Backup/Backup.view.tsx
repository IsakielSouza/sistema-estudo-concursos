// src/screens/Backup/Backup.view.tsx
import { colors } from '@/constants/colors'
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useBackupViewModel } from './useBackup.viewModel'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const BackupView = () => {
  const {
    lastBackupFormatted,
    autoBackupEnabled,
    setAutoBackup,
    backupFiles,
    loadingFiles,
    handleBackupNow,
    handleRestore,
    isBackingUp,
    isRestoring,
  } = useBackupViewModel()

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.pageTitle}>Backup</Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Status */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Último backup</Text>
          <Text style={styles.cardValue}>{lastBackupFormatted}</Text>
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={[styles.button, isBackingUp && styles.buttonDisabled]}
          onPress={handleBackupNow}
          disabled={isBackingUp}
        >
          {isBackingUp ? (
            <ActivityIndicator color={colors.grayscale.gray100} size="small" />
          ) : (
            <Ionicons name="cloud-upload-outline" size={18} color={colors.grayscale.gray100} />
          )}
          <Text style={styles.buttonText}>
            {isBackingUp ? 'Fazendo backup...' : 'Fazer backup agora'}
          </Text>
        </TouchableOpacity>

        {/* Auto-backup toggle */}
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Backup automático após sessão</Text>
          <Switch
            value={autoBackupEnabled}
            onValueChange={setAutoBackup}
            trackColor={{ true: colors.brand.primary }}
          />
        </View>

        {/* Backup list */}
        <Text style={styles.sectionTitle}>Backups disponíveis</Text>

        {loadingFiles && (
          <ActivityIndicator color={colors.brand.primary} style={{ marginTop: 16 }} />
        )}

        {!loadingFiles && backupFiles.length === 0 && (
          <Text style={styles.empty}>Nenhum backup encontrado no Google Drive.</Text>
        )}

        {backupFiles.map((file) => (
          <View key={file.id} style={styles.fileRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fileName}>{file.name}</Text>
              <Text style={styles.fileDate}>
                {format(parseISO(file.createdTime), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.restoreBtn}
              onPress={() => handleRestore(file.id, file.name)}
              disabled={isRestoring}
            >
              <Text style={styles.restoreBtnText}>Restaurar</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={{ height: 32 }} />
      </ScrollView>
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
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: colors.background.elevated,
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  cardTitle: { fontSize: 13, color: colors.grayscale.gray400 },
  cardValue: { fontSize: 17, fontWeight: '600', color: colors.grayscale.gray100 },
  button: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: colors.brand.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.grayscale.gray100, fontWeight: '600', fontSize: 15 },
  row: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: colors.background.elevated,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: { fontSize: 14, color: colors.grayscale.gray200 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.grayscale.gray400,
    paddingHorizontal: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  empty: { fontSize: 14, color: colors.grayscale.gray500, textAlign: 'center', marginTop: 12 },
  fileRow: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: colors.background.elevated,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fileName: { fontSize: 13, color: colors.grayscale.gray200, fontWeight: '500' },
  fileDate: { fontSize: 11, color: colors.grayscale.gray500, marginTop: 2 },
  restoreBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.status.warning + '22',
    borderRadius: 8,
  },
  restoreBtnText: { fontSize: 12, color: colors.status.warning, fontWeight: '600' },
})
