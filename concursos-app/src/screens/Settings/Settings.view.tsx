// src/screens/Settings/Settings.view.tsx
import { colors } from '@/constants/colors'
import { Controller } from 'react-hook-form'
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSettingsViewModel } from './useSettings.viewModel'

export const SettingsView = () => {
  const { form, handleSave, handleLogout, isValidating, validationError } =
    useSettingsViewModel()

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Configurações</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Link da Planilha Google Sheets</Text>
        <Controller
          control={form.control}
          name="spreadsheetUrl"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <>
              <TextInput
                style={styles.input}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                placeholderTextColor={colors.grayscale.gray600}
                value={value}
                onChangeText={onChange}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {error && <Text style={styles.errorText}>{error.message}</Text>}
            </>
          )}
        />
        {validationError && (
          <Text style={styles.errorText}>{validationError}</Text>
        )}

        <TouchableOpacity
          style={styles.saveButton}
          onPress={form.handleSubmit(handleSave)}
          disabled={isValidating}
        >
          {isValidating ? (
            <ActivityIndicator color={colors.grayscale.gray100} />
          ) : (
            <Text style={styles.saveButtonText}>Salvar</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.spacer} />
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sair da conta</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    color: colors.grayscale.gray100,
    fontFamily: 'Baloo2_800ExtraBold',
    marginTop: 24,
    marginBottom: 32,
  },
  section: { gap: 8, marginBottom: 24 },
  label: { fontSize: 14, color: colors.grayscale.gray400 },
  input: {
    backgroundColor: colors.background.elevated,
    borderRadius: 8,
    padding: 12,
    color: colors.grayscale.gray100,
    fontSize: 14,
  },
  errorText: { fontSize: 12, color: colors.status.error },
  saveButton: {
    backgroundColor: colors.brand.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: { color: colors.grayscale.gray100, fontWeight: '600' },
  spacer: { flex: 1 },
  logoutButton: { marginBottom: 24, alignItems: 'center' },
  logoutText: { color: colors.status.error, fontSize: 16 },
})
