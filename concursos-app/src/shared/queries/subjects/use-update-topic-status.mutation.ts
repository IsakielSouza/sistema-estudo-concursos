import { useMutation, useQueryClient } from '@tanstack/react-query'
import { TopicRepository } from '@/shared/database/repositories/topic.repository'
import { SyncService } from '@/shared/services/sync.service'
import { useAuthStore } from '@/shared/stores/auth.store'

interface UpdateTopicInput {
  topicId: string
  subjectId: string
  status: 'pending' | 'done'
}

export function useUpdateTopicStatusMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ topicId, status }: UpdateTopicInput) => {
      await TopicRepository.setTopicStatus(topicId, status)
    },
    onSuccess: (_, { subjectId }) => {
      queryClient.invalidateQueries({ queryKey: ['topics', subjectId] })
      queryClient.invalidateQueries({ queryKey: ['topic-progress', subjectId] })
    },
  })
}

export function useWriteDirtyTopicsMutation() {
  const spreadsheetId = useAuthStore((s) => s.spreadsheetId)

  return useMutation({
    mutationFn: async (subjectId: string) => {
      if (!spreadsheetId) return
      await SyncService.writeDirtyTopics(spreadsheetId, subjectId)
    },
  })
}
