// src/screens/Settings/Settings.view.tsx
import { colors } from '@/constants/colors'
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Controller } from 'react-hook-form'
import { Ionicons } from '@expo/vector-icons'
import { useSettingsViewModel } from './useSettings.viewModel'

export const SettingsView = () => {
  const {
    user,
    form,
    handleSaveSpreadsheet,
    handleSyncNow,
    isSyncing,
    notificationsEnabled,
    setNotificationsEnabled,
    handleLogout,
  } = useSettingsViewModel()

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.pageTitle}>Configurações</Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Account */}
        <View style={styles.card}>
          <View style={styles.accountRow}>
            {user?.photoUrl ? (
              <Image source={{ uri: user.photoUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={20} color={colors.grayscale.gray400} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{user?.name ?? '—'}</Text>
              <Text style={styles.userEmail}>{user?.email ?? '—'}</Text>
            </View>
          </View>
        </View>

        {/* Spreadsheet URL */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Planilha Google</Text>
          <Controller
            control={form.control}
            name="spreadsheetUrl"
            render={({ field, fieldState }) => (
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, fieldState.error && styles.inputError]}
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  placeholderTextColor={colors.grayscale.gray600}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {fieldState.error && (
                  <Text style={styles.errorText}>{fieldState.error.message}</Text>
                )}
              </View>
            )}
          />
          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveSpreadsheet}>
            <Text style={styles.saveBtnText}>Salvar planilha</Text>
          </TouchableOpacity>
        </View>

        {/* Sync */}
        <TouchableOpacity
          style={[styles.syncBtn, isSyncing && styles.syncBtnDisabled]}
          onPress={handleSyncNow}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator color={colors.grayscale.gray100} size="small" />
          ) : (
            <Ionicons name="refresh-outline" size={18} color={colors.grayscale.gray100} />
          )}
          <Text style={styles.syncBtnText}>
            {isSyncing ? 'Sincronizando...' : 'Sincronizar agora'}
          </Text>
        </TouchableOpacity>

        {/* Notifications */}
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Notificações de sessão</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ true: colors.brand.primary }}
          />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={colors.status.error} />
          <Text style={styles.logoutText}>Sair da conta</Text>
        </TouchableOpacity>

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
  },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: {
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: { fontSize: 15, fontWeight: '600', color: colors.grayscale.gray100 },
  userEmail: { fontSize: 12, color: colors.grayscale.gray500, marginTop: 2 },
  section: { marginHorizontal: 16, marginBottom: 12, gap: 8 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.grayscale.gray400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: { gap: 4 },
  input: {
    backgroundColor: colors.background.elevated,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    color: colors.grayscale.gray100,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: { borderColor: colors.status.error },
  errorText: { fontSize: 12, color: colors.status.error },
  saveBtn: {
    backgroundColor: colors.brand.primary + '22',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  saveBtnText: { fontSize: 14, fontWeight: '600', color: colors.brand.primary },
  syncBtn: {
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
  syncBtnDisabled: { opacity: 0.6 },
  syncBtnText: { color: colors.grayscale.gray100, fontWeight: '600', fontSize: 15 },
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
  logoutBtn: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: colors.status.error + '11',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: colors.status.error },
})
