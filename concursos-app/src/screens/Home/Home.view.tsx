import { colors } from '@/constants/colors'
import { StyleSheet, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
export const HomeView = () => (
  <SafeAreaView style={styles.container}>
    <Text style={styles.text}>Home — em breve</Text>
  </SafeAreaView>
)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary, alignItems: 'center', justifyContent: 'center' },
  text: { color: colors.grayscale.gray100, fontSize: 18 },
})
