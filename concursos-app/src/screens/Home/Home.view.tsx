import { View } from 'react-native'
import { useHomeViewModel } from './useHome.viewModel'

export const HomeView = () => {
  useHomeViewModel()
  return <View />
}
