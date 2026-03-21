// src/screens/Login/Login.view.tsx
import { colors } from '@/constants/colors'
import { AntDesign } from '@expo/vector-icons'
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLoginViewModel } from './useLogin.viewModel'

export const LoginView = () => {
  const { handleGoogleLogin, isLoading, error } = useLoginViewModel()

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Concursos</Text>
        <Text style={styles.subtitle}>Controle seus estudos</Text>
      </View>

      <View style={styles.footer}>
        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={styles.button}
          onPress={handleGoogleLogin}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.grayscale.gray900} />
          ) : (
            <>
              <AntDesign name="google" size={20} color={colors.grayscale.gray900} />
              <Text style={styles.buttonText}>Entrar com Google</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  header: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 40,
    color: colors.grayscale.gray100,
    fontFamily: 'Baloo2_800ExtraBold',
  },
  subtitle: {
    fontSize: 18,
    color: colors.grayscale.gray400,
    marginTop: 8,
  },
  footer: {
    paddingBottom: 40,
    gap: 12,
  },
  button: {
    backgroundColor: colors.grayscale.gray100,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.grayscale.gray900,
  },
  error: {
    color: colors.status.error,
    textAlign: 'center',
    fontSize: 14,
  },
})
