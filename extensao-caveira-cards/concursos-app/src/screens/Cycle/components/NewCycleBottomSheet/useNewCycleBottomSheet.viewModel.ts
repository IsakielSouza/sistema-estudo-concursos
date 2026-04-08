import { yupResolver } from '@hookform/resolvers/yup'
import { useCreateCycleMutation } from '@/shared/queries/cycles/use-create-cycle.mutation'
import { cycleSchema, type CycleFormData } from '@/shared/schemas/cycle.schema'
import { SubjectRepository } from '@/shared/database/repositories/subject.repository'
import { useCycleStore } from '@/shared/stores/cycle.store'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect } from 'react'
import { useForm } from 'react-hook-form'

export const useNewCycleBottomSheetViewModel = (onClose: () => void) => {
  const activeConcursoId = useCycleStore((s) => s.activeConcursoId)
  const createCycleMutation = useCreateCycleMutation()

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects', activeConcursoId],
    queryFn: () => SubjectRepository.getSubjectsByConcurso(activeConcursoId!),
    enabled: !!activeConcursoId,
  })

  const form = useForm<CycleFormData>({
    resolver: yupResolver(cycleSchema),
    defaultValues: {
      name: `Ciclo ${new Date().toLocaleDateString('pt-BR')}`,
      plannedHours: 21,
      selectedSubjectIds: [],
    },
  })

  useEffect(() => {
    if (subjects.length > 0) {
      const ids = subjects.filter((s) => !s.isFreeStudy).map((s) => s.id)
      form.reset({
        ...form.getValues(),
        selectedSubjectIds: ids,
      })
    }
  }, [subjects]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = useCallback(
    async (data: CycleFormData) => {
      if (!activeConcursoId) return
      await createCycleMutation.mutateAsync({ ...data, concursoId: activeConcursoId })
      form.reset()
      onClose()
    },
    [activeConcursoId, createCycleMutation, form, onClose]
  )

  const toggleSubject = useCallback(
    (subjectId: string) => {
      const current = form.getValues('selectedSubjectIds')
      const updated = current.includes(subjectId)
        ? current.filter((id) => id !== subjectId)
        : [...current, subjectId]
      form.setValue('selectedSubjectIds', updated)
    },
    [form]
  )

  return {
    form,
    subjects,
    handleSubmit: form.handleSubmit(handleSubmit),
    isLoading: createCycleMutation.isPending,
    toggleSubject,
  }
}
