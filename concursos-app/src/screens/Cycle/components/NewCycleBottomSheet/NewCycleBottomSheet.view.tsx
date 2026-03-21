import { colors } from '@/constants/colors'
import { Controller } from 'react-hook-form'
import {
  ActivityIndicator, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native'
import { useNewCycleBottomSheetViewModel } from './useNewCycleBottomSheet.viewModel'

interface Props { onClose: () => void }

export const NewCycleBottomSheetView = ({ onClose }: Props) => {
  const { form, subjects, handleSubmit, isLoading, toggleSubject } =
    useNewCycleBottomSheetViewModel(onClose)

  const selectedIds = form.watch('selectedSubjectIds')

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Novo Ciclo</Text>

      <Text style={styles.label}>Nome</Text>
      <Controller
        control={form.control}
        name="name"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <>
            <TextInput style={styles.input} value={value} onChangeText={onChange}
              placeholderTextColor={colors.grayscale.gray600} />
            {error && <Text style={styles.error}>{error.message}</Text>}
          </>
        )}
      />

      <Text style={styles.label}>Horas disponíveis na semana</Text>
      <Controller
        control={form.control}
        name="plannedHours"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <>
            <TextInput
              style={styles.input}
              value={String(value)}
              onChangeText={(v) => onChange(Number(v))}
              keyboardType="numeric"
              placeholderTextColor={colors.grayscale.gray600}
            />
            {error && <Text style={styles.error}>{error.message}</Text>}
          </>
        )}
      />

      <Text style={styles.label}>Matérias</Text>
      {subjects.map((subject) => {
        const isSelected = selectedIds.includes(subject.id)
        const isFixed = subject.isFreeStudy
        return (
          <TouchableOpacity
            key={subject.id}
            style={[styles.subjectRow, isSelected && styles.subjectSelected]}
            onPress={() => !isFixed && toggleSubject(subject.id)}
            disabled={isFixed}
          >
            <View>
              <Text style={styles.subjectName}>
                {subject.name}
                {isFixed && ' (fixo)'}
              </Text>
              {subject.isSlowBuild && (
                <Text style={styles.slowBuildBadge}>
                  Construção lenta — prioridade nas primeiras 2 semanas
                </Text>
              )}
            </View>
            <Text style={styles.subjectPoints}>{subject.points} pts</Text>
          </TouchableOpacity>
        )
      })}

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={isLoading}>
        {isLoading
          ? <ActivityIndicator color={colors.grayscale.gray100} />
          : <Text style={styles.submitText}>Criar Ciclo</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24, backgroundColor: colors.background.card },
  title: { fontSize: 20, color: colors.grayscale.gray100, fontFamily: 'Baloo2_800ExtraBold', marginBottom: 20 },
  label: { fontSize: 13, color: colors.grayscale.gray400, marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: colors.background.elevated,
    borderRadius: 8,
    padding: 12,
    color: colors.grayscale.gray100,
    fontSize: 15,
  },
  error: { fontSize: 12, color: colors.status.error, marginTop: 4 },
  subjectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: colors.background.elevated,
  },
  subjectSelected: { borderWidth: 1, borderColor: colors.brand.primary },
  subjectName: { color: colors.grayscale.gray100, fontSize: 15, fontWeight: '600' },
  slowBuildBadge: { fontSize: 11, color: colors.status.warning, marginTop: 2 },
  subjectPoints: { color: colors.grayscale.gray400, fontSize: 13 },
  submitButton: {
    backgroundColor: colors.brand.primary,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  submitText: { color: colors.grayscale.gray100, fontWeight: '700', fontSize: 16 },
})
