import { readableError } from '~/utils/error'

interface CreateConversationOptions {
  title: string
  message: string
  mode?: 'explore' | 'structured'
}

interface ConversationResult {
  conversationId: number
  reply?: string
  error?: string
}

/**
 * Composable for creating an AI conversation and navigating to /explore.
 *
 * Encapsulates the POST /api/conversations → toast on error → navigateTo pattern
 * that is repeated across index.vue, inbox.vue, and toolbox.vue.
 *
 * Usage:
 *   const { createConversation, creating } = useConversationCreation()
 *   await createConversation({ title: '...', message: '...', mode: 'explore' })
 *
 * For pages with multiple independent items (e.g. inbox), pass a key to track
 * which item is loading:
 *   const { createConversation, creatingKey } = useConversationCreation()
 *   await createConversation({ title: '...', message: '...' }, item.id)
 *   // creatingKey.value === item.id while loading, null otherwise
 */
export function useConversationCreation() {
  const toast = useToast()
  const creating = ref(false)
  const creatingKey = ref<number | string | null>(null)

  async function createConversation(
    opts: CreateConversationOptions,
    key?: number | string
  ): Promise<void> {
    creating.value = true
    if (key !== undefined) creatingKey.value = key

    try {
      const result = await $fetch<ConversationResult>('/api/conversations', {
        method: 'POST',
        body: {
          title: opts.title,
          message: opts.message,
          ...(opts.mode ? { mode: opts.mode } : {})
        }
      })
      if (result.error) {
        toast.add({
          title: '对话已创建，但 AI 暂时没有回复',
          description: readableError(result.error, '进入对话后可重试，或切换模型/线路。'),
          color: 'warning'
        })
      }
      await navigateTo(`/explore?conversation=${result.conversationId}`)
    } catch (err: unknown) {
      toast.add({
        title: '对话创建失败',
        description: readableError(err, '请稍后再试'),
        color: 'error'
      })
    } finally {
      creating.value = false
      creatingKey.value = null
    }
  }

  return { createConversation, creating, creatingKey }
}
