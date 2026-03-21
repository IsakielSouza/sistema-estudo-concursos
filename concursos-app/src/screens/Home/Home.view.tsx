import { colors } from '@/constants/colors'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useHomeViewModel } from './useHome.viewModel'

export const HomeView = () => {
  const { isSyncing, syncError } = useHomeViewModel()

  return (
    <SafeAreaView style={styles.container}>
      {isSyncing && (
        <View style={styles.syncBanner}>
          <ActivityIndicator size="small" color={colors.grayscale.gray100} />
          <Text style={styles.syncText}>Sincronizando planilha...</Text>
        </View>
      )}
      {syncError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>Erro ao sincronizar: {syncError}</Text>
        </View>
      )}
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>Em construção — Phase 8</Text>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary, paddingHorizontal: 24 },
  syncBanner: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingVertical: 8 },
  syncText: { color: colors.grayscale.gray400, fontSize: 12 },
  errorBanner: { backgroundColor: colors.status.error + '33', padding: 8, borderRadius: 8, marginVertical: 4 },
  errorText: { color: colors.status.error, fontSize: 12 },
  title: { fontSize: 24, color: colors.grayscale.gray100, fontFamily: 'Baloo2_800ExtraBold', marginTop: 24 },
  subtitle: { fontSize: 14, color: colors.grayscale.gray400, marginTop: 8 },
})
