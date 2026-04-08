import {
  useGetSubjectDetailQuery,
  useGetTopicsQuery,
  useGetTopicProgressQuery,
} from '@/shared/queries/subjects/use-get-subjects.query'
import {
  useUpdateTopicStatusMutation,
  useWriteDirtyTopicsMutation,
} from '@/shared/queries/subjects/use-update-topic-status.mutation'
import { SubjectRepository } from '@/shared/database/repositories/subject.repository'
import { useLocalSearchParams, router } from 'expo-router'
import { useCallback, useEffect, useRef } from 'react'
import { Alert } from 'react-native'
import { useQueryClient } from '@tanstack/react-query'

export const useSubjectViewModel = () => {
  const { id } = useLocalSearchParams<{ id: string }>()
  const subjectId = Array.isArray(id) ? id[0] : id
  const queryClient = useQueryClient()

  const { data: subject } = useGetSubjectDetailQuery(subjectId)
  const { data: topics = [] } = useGetTopicsQuery(subjectId)
  const { data: progress } = useGetTopicProgressQuery(subjectId)

  const updateTopicMutation = useUpdateTopicStatusMutation()
  const writeDirtyMutation = useWriteDirtyTopicsMutation()

  // Keep ref up to date so unmount effect always has the latest mutate fn
  const writeDirtyMutationRef = useRef(writeDirtyMutation.mutate)
  useEffect(() => {
    writeDirtyMutationRef.current = writeDirtyMutation.mutate
  })

  // Sync dirty topics back to Sheets when leaving screen
  useEffect(() => {
    const subjectIdSnapshot = subjectId
    return () => {
      writeDirtyMutationRef.current(subjectIdSnapshot)
    }
  }, [subjectId])

  // Stable mutate reference to avoid re-creating handleTopicToggle on every render
  const updateTopicMutate = updateTopicMutation.mutate

  const handleTopicToggle = useCallback(
    (topicId: string, currentStatus: 'pending' | 'done') => {
      updateTopicMutate({
        topicId,
        subjectId,
        status: currentStatus === 'done' ? 'pending' : 'done',
      })
    },
    [subjectId, updateTopicMutate]
  )

  // Keep subject ref up to date so handleEditalComplete always reads latest value
  const subjectRef = useRef(subject)
  useEffect(() => {
    subjectRef.current = subject
  })

  const handleEditalComplete = useCallback(() => {
    const currentSubject = subjectRef.current
    if (!currentSubject) return
    if (currentSubject.cycleStatus === 'revision') return

    Alert.alert(
      'Concluiu o Edital?',
      'Esta matéria entrará em modo revisão com 50% das horas. Permanecerá no ciclo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            await SubjectRepository.updateCycleStatus(currentSubject.id, 'revision')
            queryClient.invalidateQueries({ queryKey: ['subject', subjectId] })
            queryClient.invalidateQueries({ queryKey: ['cycle-subjects'] })
          },
        },
      ]
    )
  }, [subjectId, queryClient])

  const progressRatio =
    progress && progress.total > 0 ? progress.done / progress.total : 0

  return {
    subject,
    topics,
    progress,
    progressRatio,
    handleTopicToggle,
    handleEditalComplete,
    isUpdating: updateTopicMutation.isPending,
  }
}
