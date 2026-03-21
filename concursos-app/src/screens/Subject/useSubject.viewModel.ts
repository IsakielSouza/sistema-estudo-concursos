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
import { useCallback, useEffect } from 'react'
import { Alert } from 'react-native'
import { useQueryClient } from '@tanstack/react-query'

export const useSubjectViewModel = () => {
  const { id: subjectId } = useLocalSearchParams<{ id: string }>()
  const queryClient = useQueryClient()

  const { data: subject } = useGetSubjectDetailQuery(subjectId)
  const { data: topics = [] } = useGetTopicsQuery(subjectId)
  const { data: progress } = useGetTopicProgressQuery(subjectId)

  const updateTopicMutation = useUpdateTopicStatusMutation()
  const writeDirtyMutation = useWriteDirtyTopicsMutation()

  // Sync dirty topics back to Sheets when leaving screen
  useEffect(() => {
    return () => {
      writeDirtyMutation.mutate(subjectId)
    }
  }, [subjectId]) // eslint-disable-line

  const handleTopicToggle = useCallback(
    (topicId: string, currentStatus: 'pending' | 'done') => {
      updateTopicMutation.mutate({
        topicId,
        subjectId,
        status: currentStatus === 'done' ? 'pending' : 'done',
      })
    },
    [subjectId, updateTopicMutation]
  )

  const handleEditalComplete = useCallback(() => {
    if (!subject) return
    if (subject.cycleStatus === 'revision') return

    Alert.alert(
      'Concluiu o Edital?',
      'Esta matéria entrará em modo revisão com 50% das horas. Permanecerá no ciclo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            await SubjectRepository.updateCycleStatus(subject.id, 'revision')
            queryClient.invalidateQueries({ queryKey: ['subject', subjectId] })
            queryClient.invalidateQueries({ queryKey: ['cycle-subjects'] })
          },
        },
      ]
    )
  }, [subject, subjectId, queryClient])

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
