// src/app/(private)/_layout.tsx
import { Drawer } from 'expo-router/drawer'
import { colors } from '@/constants/colors'

export default function PrivateLayout() {
  return (
    <Drawer
      screenOptions={{
        headerShown: false,
        drawerStyle: { backgroundColor: colors.background.card },
        drawerActiveTintColor: colors.brand.primary,
        drawerInactiveTintColor: colors.grayscale.gray400,
      }}
    >
      <Drawer.Screen
        name="(tabs)"
        options={{ drawerLabel: 'Início', title: 'Início' }}
      />
      <Drawer.Screen
        name="history"
        options={{ drawerLabel: 'Histórico', title: 'Histórico' }}
      />
      <Drawer.Screen
        name="backup"
        options={{ drawerLabel: 'Backup', title: 'Backup' }}
      />
      <Drawer.Screen
        name="settings"
        options={{ drawerLabel: 'Configurações', title: 'Configurações' }}
      />
      <Drawer.Screen
        name="subject/[id]"
        options={{ drawerItemStyle: { display: 'none' } }}
      />
      <Drawer.Screen
        name="session"
        options={{ drawerItemStyle: { display: 'none' } }}
      />
    </Drawer>
  )
}
