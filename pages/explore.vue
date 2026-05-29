<template>
  <div class="workspace-page explore-page">
    <aside class="glass-panel explore-sidebar rounded-lg p-4">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h1 class="text-lg font-semibold text-slate-950">自我探索</h1>
          <p class="mt-1 text-sm leading-6 text-slate-500">AI 会追问，而不是只安慰。</p>
        </div>
        <UButton icon="i-lucide-plus" color="neutral" variant="soft" aria-label="新对话" @click="newConversation" />
      </div>

      <UButton
        class="mt-4"
        icon="i-lucide-lightbulb"
        color="neutral"
        variant="soft"
        block
        :disabled="!activeConversationId"
        :loading="extracting"
        @click="extractInsight"
      >
        提炼洞察
      </UButton>
      <UButton
        class="mt-2"
        icon="i-lucide-inbox"
        color="neutral"
        variant="soft"
        block
        :disabled="!activeConversationId"
        :loading="extractingCandidates"
        @click="extractCandidates"
      >
        提取候选
      </UButton>
      <UButton
        class="mt-2"
        icon="i-lucide-book-open"
        color="neutral"
        variant="soft"
        block
        :disabled="!activeConversationId"
        :loading="summarizing"
        @click="generateJournal"
      >
        生成日记小结
      </UButton>

      <div class="mt-5">
        <h2 class="mb-2 text-sm font-semibold text-slate-700">历史对话</h2>
        <div class="explore-history space-y-2">
          <p v-if="!conversations.length" class="rounded-lg bg-white/70 p-3 text-sm text-slate-500">还没有历史对话。</p>
          <div
            v-for="item in conversations"
            :key="item.id"
            class="flex items-start gap-2 rounded-lg border bg-white p-2 text-sm transition hover:border-teal-300"
            :class="activeConversationId === item.id ? 'border-teal-500 text-teal-900' : 'border-slate-200 text-slate-700'"
          >
            <button class="min-w-0 flex-1 p-1 text-left" @click="loadConversation(item.id)">
              <span class="line-clamp-2">{{ item.title }}</span>
            </button>
            <UButton
              icon="i-lucide-trash-2"
              color="error"
              variant="ghost"
              size="xs"
              :aria-label="`删除 ${item.title}`"
              @click.stop="askDeleteConversation(item)"
            />
          </div>
        </div>
        <PaginationBar
          v-model:page="conversationPage"
          class="mt-3"
          :page-size="conversationData?.pageSize || conversationPageSize"
          :total="conversationData?.total || 0"
          :page-count="conversationData?.pageCount || 1"
        />
      </div>
    </aside>

    <section class="glass-panel explore-chat rounded-lg">
      <header class="flex items-center justify-between gap-3 border-b border-slate-200/80 px-4 py-3">
        <div>
          <h2 class="text-base font-semibold text-slate-950">对话现场</h2>
          <p class="text-xs text-slate-500">{{ activeConversationId ? '这段对话会被保存，方便后续提炼洞察。' : '先写下一个真实问题，系统会从这里开始记住你。' }}</p>
        </div>
        <UBadge color="primary" variant="soft">{{ messages.length }} 条</UBadge>
      </header>

      <div ref="messageList" class="explore-messages">
        <div v-if="!messages.length" class="mx-auto flex h-full max-w-md flex-col items-center justify-center px-6 text-center">
          <div class="mb-4 flex size-12 items-center justify-center rounded-full bg-teal-50 text-teal-800">
            <UIcon name="i-lucide-message-circle" class="size-6" />
          </div>
          <h3 class="text-base font-semibold text-slate-950">从一个真实问题开始</h3>
          <p class="mt-2 text-sm leading-6 text-slate-500">比如：我最近为什么总是拖延？或者：我明明想改变，为什么每次开始都很难？</p>
        </div>

        <div
          v-for="message in messages"
          :key="message.id || message.clientId || message.content"
          class="message-row"
          :class="message.role === 'user' ? 'message-row--user' : 'message-row--assistant'"
        >
          <div>
            <div class="message-bubble" :class="message.failed ? 'message-bubble--failed' : ''">
              {{ message.content }}
            </div>
            <div v-if="message.failed" class="mt-2 flex flex-wrap items-center justify-end gap-2">
              <span class="text-xs text-red-600">发送失败，已保留草稿。</span>
              <UButton size="xs" color="neutral" variant="soft" icon="i-lucide-rotate-ccw" :loading="sending" @click="retryMessage(message)">
                重发
              </UButton>
              <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-undo-2" :disabled="sending" @click="withdrawFailedMessage(message)">
                撤回
              </UButton>
            </div>
          </div>
        </div>

        <div v-if="sending" class="message-row message-row--assistant">
          <div class="message-bubble text-slate-500">正在想一个更好的追问...</div>
        </div>
      </div>

      <form class="explore-composer" @submit.prevent="send">
        <UAlert
          v-if="error"
          color="error"
          variant="soft"
          icon="i-lucide-circle-alert"
          :title="error"
          class="mb-3"
        />
        <div class="flex items-end gap-2 rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
          <UTextarea
            v-model="draft"
            autoresize
            :rows="1"
            :maxrows="5"
            placeholder="输入你此刻真正想聊的问题..."
            class="min-w-0 flex-1"
            @keydown.enter.exact.prevent="send"
          />
          <UButton type="submit" icon="i-lucide-send" :loading="sending" :disabled="!draft.trim()" aria-label="发送" />
        </div>
        <p class="mt-2 text-xs text-slate-400">Enter 发送，Shift + Enter 换行。</p>
      </form>
    </section>

    <UModal v-model:open="insightOpen" title="确认保存洞察">
      <template #body>
        <div class="space-y-4">
          <UFormField label="洞察草稿">
            <UTextarea v-model="insightDraft" autoresize class="w-full" />
          </UFormField>
          <UButton icon="i-lucide-save" block @click="saveInsight">保存洞察</UButton>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="journalOpen" title="确认保存日记小结">
      <template #body>
        <div class="space-y-4">
          <UFormField label="标题">
            <UInput v-model="journalDraft.title" class="w-full" />
          </UFormField>
          <UFormField label="小结草稿">
            <UTextarea v-model="journalDraft.content" autoresize class="w-full" />
          </UFormField>
          <UButton icon="i-lucide-save" block @click="saveJournal">保存日记小结</UButton>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="deleteOpen" title="删除这段对话？">
      <template #body>
        <div class="space-y-4">
          <p class="text-sm leading-6 text-slate-600">
            将删除「{{ deletingConversation?.title }}」以及其中的聊天消息。已经保存的洞察和日记小结不会被删除，但会失去来源对话引用。
          </p>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="deleteOpen = false">取消</UButton>
            <UButton color="error" icon="i-lucide-trash-2" :loading="deleting" @click="deleteConversation">确认删除</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { emptyPaginatedResponse, type PaginatedResponse } from '~/types/pagination'

const toast = useToast()
const route = useRoute()
const conversationPage = ref(1)
const conversationPageSize = 20
const { data: conversationData, refresh } = await useFetch<PaginatedResponse<any>>('/api/conversations', {
  query: { page: conversationPage, pageSize: conversationPageSize },
  default: () => emptyPaginatedResponse<any>(conversationPageSize)
})
const conversations = computed(() => conversationData.value?.items || [])
const draft = ref('')
const messages = ref<any[]>([])
const activeConversationId = ref<number | null>(null)
const sending = ref(false)
const extracting = ref(false)
const extractingCandidates = ref(false)
const summarizing = ref(false)
const error = ref('')
const insightDraft = ref('')
const insightOpen = ref(false)
const journalDraft = reactive({
  date: '',
  title: '',
  content: '',
  source_conversation_id: null as number | null,
  checkin_id: null as number | null
})
const journalOpen = ref(false)
const messageList = ref<HTMLElement | null>(null)
const deleteOpen = ref(false)
const deleting = ref(false)
const deletingConversation = ref<any | null>(null)

onMounted(async () => {
  const conversationId = Number(route.query.conversation)
  if (!conversationId) return
  await loadConversation(conversationId)
})

function scrollToBottom() {
  nextTick(() => {
    if (!messageList.value) return
    messageList.value.scrollTop = messageList.value.scrollHeight
  })
}

function newConversation() {
  activeConversationId.value = null
  messages.value = []
  draft.value = ''
  error.value = ''
  scrollToBottom()
}

async function send() {
  if (!draft.value.trim()) return
  if (messages.value.some((message) => message.failed)) {
    error.value = '上一条消息还没有成功发送，请先重发或撤回。'
    return
  }
  sending.value = true
  error.value = ''
  const text = draft.value
  draft.value = ''
  messages.value.push({ role: 'user', content: text, clientId: `local-${Date.now()}` })
  scrollToBottom()
  try {
    if (!activeConversationId.value) {
      const result = await $fetch<any>('/api/conversations', { method: 'POST', body: { message: text } })
      activeConversationId.value = result.conversationId
      if (result.error) {
        markLastLocalUserFailed(text)
        error.value = readableError(result.error, 'AI 对话失败，请检查配置或稍后再试')
        await refresh()
        return
      }
      await loadConversation(result.conversationId)
      await refresh()
    } else {
      const result = await $fetch<any>(`/api/conversations/${activeConversationId.value}/messages`, { method: 'POST', body: { message: text } })
      if (result.error) {
        markLastLocalUserFailed(text)
        error.value = readableError(result.error, 'AI 对话失败，请检查配置或稍后再试')
        return
      }
      await loadConversation(activeConversationId.value)
    }
  } catch (err: any) {
    error.value = readableError(err, 'AI 对话失败，请检查配置或稍后再试')
    markLastLocalUserFailed(text)
  } finally {
    sending.value = false
    scrollToBottom()
  }
}

function markLastLocalUserFailed(text: string) {
  for (let index = messages.value.length - 1; index >= 0; index -= 1) {
    const message = messages.value[index]
    if (message.role === 'user' && message.content === text) {
      messages.value[index] = { ...message, failed: true }
      return
    }
  }
}

async function retryMessage(message: any) {
  if (sending.value || !message?.content) return
  sending.value = true
  error.value = ''
  message.failed = false
  scrollToBottom()
  try {
    if (!activeConversationId.value) {
      const result = await $fetch<any>('/api/conversations', { method: 'POST', body: { message: message.content } })
      activeConversationId.value = result.conversationId
      if (result.error) {
        message.failed = true
        error.value = readableError(result.error, '重发失败，请稍后再试')
        await refresh()
        return
      }
      await loadConversation(result.conversationId)
      await refresh()
    } else {
      const result = await $fetch<any>(`/api/conversations/${activeConversationId.value}/messages`, {
        method: 'POST',
        body: { message: message.content, retry_last: true }
      })
      if (result.error) {
        message.failed = true
        error.value = readableError(result.error, '重发失败，请稍后再试')
        return
      }
      await loadConversation(activeConversationId.value)
    }
  } catch (err: any) {
    message.failed = true
    error.value = readableError(err, '重发失败，请稍后再试')
  } finally {
    sending.value = false
    scrollToBottom()
  }
}

async function withdrawFailedMessage(message: any) {
  const index = messages.value.findIndex((item) => item === message || item.clientId === message.clientId)
  if (index >= 0) messages.value.splice(index, 1)
  error.value = ''

  if (activeConversationId.value) {
    await $fetch(`/api/conversations/${activeConversationId.value}/messages/delete-last-user`, {
      method: 'POST'
    }).catch(() => null)
  }
  scrollToBottom()
}

async function loadConversation(id: number) {
  const result = await $fetch<any>(`/api/conversations/${id}`)
  activeConversationId.value = id
  messages.value = markRecoverableLastUserMessage(result.messages || [])
  scrollToBottom()
}

function askDeleteConversation(item: any) {
  deletingConversation.value = item
  deleteOpen.value = true
}

async function deleteConversation() {
  if (!deletingConversation.value) return
  deleting.value = true
  try {
    const id = deletingConversation.value.id
    await $fetch(`/api/conversations/${id}`, { method: 'DELETE' })
    if (activeConversationId.value === id) {
      activeConversationId.value = null
      messages.value = []
      draft.value = ''
      error.value = ''
      await navigateTo('/explore', { replace: true })
    }
    await refresh()
    if (!conversations.value.length && conversationPage.value > 1) {
      conversationPage.value -= 1
      await refresh()
    }
    deleteOpen.value = false
    deletingConversation.value = null
    toast.add({ title: '对话已删除', color: 'success' })
  } catch (err: any) {
    toast.add({ title: '删除失败', description: readableError(err, '请稍后再试'), color: 'error' })
  } finally {
    deleting.value = false
  }
}

function markRecoverableLastUserMessage(items: any[]) {
  if (!items.length) return items
  const lastIndex = items.length - 1
  const lastMessage = items[lastIndex]
  if (lastMessage?.role !== 'user') return items
  return items.map((item, index) => (index === lastIndex ? { ...item, failed: true } : item))
}

async function extractInsight() {
  if (!activeConversationId.value) return
  extracting.value = true
  try {
    const result = await $fetch<any>('/api/ai/insight', { method: 'POST', body: { conversation_id: activeConversationId.value } })
    insightDraft.value = result.content
    insightOpen.value = true
  } catch (err: any) {
    toast.add({ title: '提炼失败', description: readableError(err, '请检查 AI 配置或稍后再试'), color: 'error' })
  } finally {
    extracting.value = false
  }
}

async function saveInsight() {
  await $fetch('/api/insights', {
    method: 'POST',
    body: { content: insightDraft.value, source_conversation_id: activeConversationId.value }
  })
  insightOpen.value = false
  toast.add({ title: '洞察已保存', color: 'success' })
}

async function extractCandidates() {
  if (!activeConversationId.value) return
  extractingCandidates.value = true
  try {
    const result = await $fetch<any>('/api/ai/candidates', {
      method: 'POST',
      body: { conversation_id: activeConversationId.value }
    })
    toast.add({ title: `已提取 ${result.count || 0} 条候选`, color: 'success' })
    await navigateTo('/inbox')
  } catch (err: any) {
    toast.add({ title: '提取失败', description: readableError(err, '请检查 AI 配置或稍后再试'), color: 'error' })
  } finally {
    extractingCandidates.value = false
  }
}

async function generateJournal() {
  if (!activeConversationId.value) return
  summarizing.value = true
  try {
    const result = await $fetch<any>('/api/ai/journal', {
      method: 'POST',
      body: { conversation_id: activeConversationId.value }
    })
    journalDraft.date = result.date
    journalDraft.title = result.title
    journalDraft.content = result.content
    journalDraft.source_conversation_id = result.source_conversation_id
    journalDraft.checkin_id = result.checkin_id
    journalOpen.value = true
  } catch (err: any) {
    toast.add({ title: '生成失败', description: readableError(err, '请检查 AI 配置或稍后再试'), color: 'error' })
  } finally {
    summarizing.value = false
  }
}

async function saveJournal() {
  await $fetch('/api/journals', {
    method: 'POST',
    body: journalDraft
  })
  journalOpen.value = false
  toast.add({ title: '日记小结已保存', color: 'success' })
}

function readableError(err: any, fallback: string) {
  const message = String(err?.statusMessage || err?.message || fallback)
  if (/<\/?[a-z][\s\S]*>/i.test(message)) {
    return 'AI 上游返回了网关错误页面，请稍后再试或切换模型/线路。'
  }
  return message.replace(/\s+/g, ' ').slice(0, 180)
}
</script>
