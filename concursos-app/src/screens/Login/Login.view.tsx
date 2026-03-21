// src/screens/Login/Login.view.tsx
import { colors } from '@/constants/colors'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export const LoginView = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Sistema de Estudos</Text>
      <Text style={styles.subtitle}>Login — em breve</Text>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    color: colors.grayscale.gray100,
    fontFamily: 'Baloo2_800ExtraBold',
  },
  subtitle: {
    fontSize: 16,
    color: colors.grayscale.gray400,
    marginTop: 8,
  },
})
