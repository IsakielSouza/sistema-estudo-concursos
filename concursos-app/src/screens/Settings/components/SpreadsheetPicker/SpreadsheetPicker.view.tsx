// src/screens/Settings/components/SpreadsheetPicker/SpreadsheetPicker.view.tsx
import { colors } from '@/constants/colors'
import { DriveSpreadsheet, useListSpreadsheetsQuery } from '@/shared/queries/drive/use-list-spreadsheets.query'
import { Ionicons } from '@expo/vector-icons'
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

interface Props {
  visible: boolean
  onSelect: (spreadsheet: DriveSpreadsheet) => void
  onClose: () => void
}

export function SpreadsheetPicker({ visible, onSelect, onClose }: Props) {
  const { data, isLoading, isError, refetch } = useListSpreadsheetsQuery(visible)

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Selecionar Planilha</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.grayscale.gray300} />
            </TouchableOpacity>
          </View>

          {isLoading && (
            <View style={styles.center}>
              <ActivityIndicator color={colors.brand.primary} />
              <Text style={styles.hint}>Carregando planilhas...</Text>
            </View>
          )}

          {isError && (
            <View style={styles.center}>
              <Text style={styles.errorText}>Erro ao carregar planilhas.</Text>
              <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
                <Text style={styles.retryText}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          )}

          {!isLoading && !isError && data?.length === 0 && (
            <View style={styles.center}>
              <Text style={styles.hint}>Nenhuma planilha encontrada no Drive.</Text>
            </View>
          )}

          {!isLoading && !isError && data && data.length > 0 && (
            <FlatList
              data={data}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.item} onPress={() => onSelect(item)}>
                  <Ionicons
                    name="document-text-outline"
                    size={20}
                    color={colors.brand.primary}
                    style={styles.itemIcon}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemDate}>
                      Modificado em {formatDate(item.modifiedTime)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.grayscale.gray500} />
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.elevated,
  },
  title: { fontSize: 16, fontWeight: '700', color: colors.grayscale.gray100 },
  center: { alignItems: 'center', padding: 32, gap: 12 },
  hint: { fontSize: 14, color: colors.grayscale.gray500 },
  errorText: { fontSize: 14, color: colors.status.error },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.brand.primary + '22',
    borderRadius: 8,
  },
  retryText: { fontSize: 14, fontWeight: '600', color: colors.brand.primary },
  list: { paddingVertical: 8 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.background.elevated,
  },
  itemIcon: { marginTop: 2 },
  itemName: { fontSize: 14, fontWeight: '500', color: colors.grayscale.gray100 },
  itemDate: { fontSize: 12, color: colors.grayscale.gray500, marginTop: 2 },
})
