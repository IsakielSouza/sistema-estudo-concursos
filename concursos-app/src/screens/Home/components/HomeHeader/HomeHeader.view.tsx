import { colors } from '@/constants/colors'
import { useNavigation } from '@react-navigation/native'
import type { DrawerNavigationProp } from '@react-navigation/drawer'
import { Ionicons } from '@expo/vector-icons'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface Props {
  userPhotoUrl: string | null
}

export const HomeHeaderView = ({ userPhotoUrl }: Props) => {
  const navigation = useNavigation<DrawerNavigationProp<any>>()

  const handleOpenDrawer = () => {
    navigation.getParent<DrawerNavigationProp<any>>()?.openDrawer()
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleOpenDrawer} style={styles.iconButton}>
        <Ionicons name="menu" size={24} color={colors.grayscale.gray100} />
      </TouchableOpacity>

      <Text style={styles.title}>Início</Text>

      {userPhotoUrl ? (
        <Image source={{ uri: userPhotoUrl }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarFallback}>
          <Ionicons name="person" size={18} color={colors.grayscale.gray400} />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  iconButton: { padding: 4 },
  title: {
    fontSize: 18,
    color: colors.grayscale.gray100,
    fontFamily: 'Baloo2_800ExtraBold',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
