<template>
  <div class="workspace-page thinking-page space-y-4">
    <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-slate-950">思维训练</h1>
        <p class="mt-1 text-sm text-slate-500">用现实和幻想题场训练逻辑识别，先选择，再看见自己的判断习惯。</p>
      </div>
      <UButton icon="i-lucide-plus" @click="openCreate">新增挑战</UButton>
    </div>

    <div class="grid gap-4 xl:grid-cols-[22rem_minmax(0,1fr)]">
      <aside class="glass-panel rounded-lg p-4">
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="item in worldFilters"
            :key="item.value"
            class="rounded-lg border px-3 py-2 text-left text-sm transition"
            :class="activeWorld === item.value ? 'border-teal-500 bg-teal-50 text-teal-900' : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300'"
            @click="setWorld(item.value)"
          >
            <span class="block font-medium">{{ item.label }}</span>
            <span class="mt-1 block text-xs opacity-70">{{ item.hint }}</span>
          </button>
        </div>

        <div class="mt-4 space-y-2">
          <button
            v-for="item in challenges"
            :key="item.id"
            class="w-full rounded-lg border bg-white p-3 text-left transition hover:border-teal-300"
            :class="selectedId === item.id ? 'border-teal-500 ring-2 ring-teal-100' : 'border-slate-200'"
            @click="selectChallenge(item.id)"
          >
            <div class="flex flex-wrap items-center gap-2">
              <UBadge :color="item.world_type === 'fantasy' ? 'warning' : 'primary'" variant="soft">{{ worldLabel(item.world_type) }}</UBadge>
              <UBadge color="neutral" variant="soft">{{ item.fallacy_type || '逻辑识别' }}</UBadge>
              <span class="ml-auto text-xs text-slate-400">Lv.{{ item.difficulty }}</span>
            </div>
            <p class="mt-2 line-clamp-2 text-sm font-semibold text-slate-950">{{ item.title }}</p>
            <p class="mt-1 text-xs text-slate-500">{{ item.attempt_count || 0 }} 次作答 · {{ accuracyText(item) }}</p>
          </button>
          <p v-if="!challenges.length" class="rounded-lg bg-white p-3 text-sm text-slate-500">还没有符合条件的挑战。</p>
        </div>

        <PaginationBar
          v-model:page="page"
          class="mt-3"
          :page-size="challengeData?.pageSize || pageSize"
          :total="challengeData?.total || 0"
          :page-count="challengeData?.pageCount || 1"
        />
      </aside>

      <section class="min-w-0 space-y-4">
        <SectionCard v-if="selectedChallenge">
          <template #title>
            <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div class="flex flex-wrap gap-2">
                  <UBadge :color="selectedChallenge.world_type === 'fantasy' ? 'warning' : 'primary'" variant="soft">
                    {{ worldLabel(selectedChallenge.world_type) }}
                  </UBadge>
                  <UBadge color="neutral" variant="soft">{{ selectedChallenge.fallacy_type || '逻辑识别' }}</UBadge>
                  <UBadge color="neutral" variant="soft">难度 {{ selectedChallenge.difficulty }}/5</UBadge>
                </div>
                <h2 class="mt-3 text-xl font-semibold text-slate-950">{{ selectedChallenge.title }}</h2>
              </div>
              <div class="flex gap-2">
                <UButton color="neutral" variant="soft" icon="i-lucide-pencil" @click="openEdit(selectedChallenge)">编辑</UButton>
                <UButton color="error" variant="ghost" icon="i-lucide-trash-2" @click="deleteSelected">删除</UButton>
              </div>
            </div>
          </template>

          <div class="rounded-lg border border-slate-100 bg-slate-50 p-4">
            <p class="whitespace-pre-wrap text-sm leading-7 text-slate-700">{{ selectedChallenge.prompt }}</p>
          </div>
          <h3 class="mt-5 text-base font-semibold text-slate-950">{{ selectedChallenge.question }}</h3>

          <div class="mt-4 grid gap-2">
            <button
              v-for="option in selectedOptions"
              :key="option.key"
              class="rounded-lg border p-3 text-left transition"
              :class="optionClass(option.key)"
              :disabled="submitting"
              @click="selectedOption = option.key"
            >
              <span class="text-sm font-semibold">{{ option.key }}.</span>
              <span class="ml-2 text-sm leading-6">{{ option.label }}</span>
            </button>
          </div>

          <div class="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <UFormField label="可选：为什么这么判断？">
              <UTextarea v-model="reason" autoresize :rows="2" :maxrows="4" class="w-full" placeholder="先选答案也可以，理由可以之后再补。" />
            </UFormField>
            <UButton icon="i-lucide-check-circle-2" :loading="submitting" :disabled="!selectedOption" @click="submitAttempt">
              提交判断
            </UButton>
          </div>
        </SectionCard>

        <SectionCard v-if="feedback" :title="feedback.is_correct ? '判断正确' : '这次被题目带偏了'">
          <div class="flex flex-wrap gap-2">
            <UBadge :color="feedback.is_correct ? 'primary' : 'warning'" variant="soft">
              {{ feedback.is_correct ? '正确' : '未命中' }}
            </UBadge>
            <UBadge color="neutral" variant="soft">正确答案：{{ feedback.correct_option }}</UBadge>
          </div>
          <p class="mt-4 text-sm leading-7 text-slate-700">{{ feedback.short_explanation }}</p>
          <div class="mt-4 grid gap-3 lg:grid-cols-2">
            <div class="rounded-lg bg-slate-50 p-3">
              <p class="text-sm font-semibold text-slate-900">选项反馈</p>
              <p class="mt-2 text-sm leading-6 text-slate-600">{{ feedback.option_explanation }}</p>
            </div>
            <div class="rounded-lg bg-teal-50 p-3">
              <p class="text-sm font-semibold text-teal-950">更好的回应</p>
              <p class="mt-2 text-sm leading-6 text-teal-800">{{ feedback.rebuttal || '这道题还没有补充回应方式。' }}</p>
            </div>
          </div>
          <div class="mt-4 rounded-lg border border-slate-100 bg-white p-3">
            <p class="text-sm font-semibold text-slate-900">深度解析</p>
            <p class="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600">{{ feedback.deep_explanation || '还没有深度解析。' }}</p>
          </div>
        </SectionCard>

        <SectionCard v-if="attempts.length" title="最近作答">
          <div class="space-y-2">
            <div v-for="attempt in attempts" :key="attempt.id" class="flex flex-wrap items-center gap-2 rounded-lg bg-white p-3 text-sm">
              <UBadge :color="attempt.is_correct ? 'primary' : 'warning'" variant="soft">{{ attempt.is_correct ? '正确' : '未命中' }}</UBadge>
              <span class="text-slate-600">选择 {{ attempt.selected_option }}</span>
              <span class="ml-auto text-xs text-slate-400">{{ attempt.created_at }}</span>
              <p v-if="attempt.reason" class="basis-full text-sm leading-6 text-slate-500">理由：{{ attempt.reason }}</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard v-if="!selectedChallenge" title="选择一道挑战">
          <p class="text-sm text-slate-500">从左侧题库选择现实类或幻想类挑战，先用低成本选择开始训练。</p>
        </SectionCard>
      </section>
    </div>

    <UModal v-model:open="modalOpen" :title="editing?.id ? '编辑挑战' : '新增挑战'">
      <template #body>
        <form class="space-y-4" @submit.prevent="saveChallenge">
          <div class="grid gap-3 md:grid-cols-3">
            <UFormField label="类型">
              <USelect v-model="draft.world_type" :items="worldItems" class="w-full" />
            </UFormField>
            <UFormField label="谬误/训练点">
              <UInput v-model="draft.fallacy_type" class="w-full" />
            </UFormField>
            <UFormField label="难度">
              <UInput v-model.number="draft.difficulty" type="number" min="1" max="5" class="w-full" />
            </UFormField>
          </div>
          <UFormField label="标题" required>
            <UInput v-model="draft.title" class="w-full" />
          </UFormField>
          <UFormField label="场景文本" required>
            <UTextarea v-model="draft.prompt" autoresize class="w-full" />
          </UFormField>
          <UFormField label="问题" required>
            <UInput v-model="draft.question" class="w-full" />
          </UFormField>

          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <p class="text-sm font-medium text-slate-700">选项</p>
              <UButton size="xs" color="neutral" variant="soft" icon="i-lucide-plus" @click="addOption">添加选项</UButton>
            </div>
            <div v-for="(option, index) in draft.options" :key="option.key" class="grid gap-2 rounded-lg border border-slate-100 p-3 md:grid-cols-[4rem_minmax(0,1fr)]">
              <UInput v-model="option.key" placeholder="A" />
              <div class="space-y-2">
                <UInput v-model="option.label" placeholder="选项内容" />
                <UInput v-model="option.explanation" placeholder="选项反馈" />
                <UButton v-if="draft.options.length > 2" size="xs" color="neutral" variant="ghost" icon="i-lucide-trash-2" @click="draft.options.splice(index, 1)">删除</UButton>
              </div>
            </div>
          </div>

          <div class="grid gap-3 md:grid-cols-2">
            <UFormField label="正确答案 key">
              <UInput v-model="draft.correct_option" placeholder="A" class="w-full" />
            </UFormField>
            <UFormField label="标签">
              <UInput v-model="draft.tags" placeholder="逻辑识别,幻想类" class="w-full" />
            </UFormField>
          </div>

          <UFormField label="简短解析">
            <UTextarea v-model="draft.short_explanation" autoresize class="w-full" />
          </UFormField>
          <UFormField label="深度解析">
            <UTextarea v-model="draft.deep_explanation" autoresize class="w-full" />
          </UFormField>
          <UFormField label="更好的回应方式">
            <UTextarea v-model="draft.rebuttal" autoresize class="w-full" />
          </UFormField>

          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="modalOpen = false">取消</UButton>
            <UButton type="submit" icon="i-lucide-save">保存</UButton>
          </div>
        </form>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { ThinkingAttempt, ThinkingChallenge, ThinkingChallengeOption, ThinkingChallengeWorld } from '~/types/app'
import { emptyPaginatedResponse, type PaginatedResponse } from '~/types/pagination'

type ChallengeDetail = {
  challenge: ThinkingChallenge
  attempts: ThinkingAttempt[]
}

type Feedback = {
  is_correct: boolean
  selected: ThinkingChallengeOption
  correct_option: string
  correct_label: string
  option_explanation: string
  short_explanation: string
  deep_explanation: string
  rebuttal: string
}

type Draft = {
  title: string
  world_type: ThinkingChallengeWorld
  fallacy_type: string
  difficulty: number
  prompt: string
  question: string
  options: ThinkingChallengeOption[]
  correct_option: string
  short_explanation: string
  deep_explanation: string
  rebuttal: string
  tags: string
  status: 'draft' | 'active' | 'archived'
  visibility: 'private' | 'public'
}

const toast = useToast()
const activeWorld = ref<ThinkingChallengeWorld | 'all'>('all')
const page = ref(1)
const pageSize = 12
const selectedId = ref<number | null>(null)
const selectedOption = ref('')
const reason = ref('')
const feedback = ref<Feedback | null>(null)
const submitting = ref(false)
const modalOpen = ref(false)
const editing = ref<ThinkingChallenge | null>(null)
const draft = reactive<Draft>(emptyDraft())

const worldQuery = computed(() => activeWorld.value === 'all' ? undefined : activeWorld.value)
const { data: challengeData, refresh: refreshChallenges } = await useFetch<PaginatedResponse<ThinkingChallenge>>('/api/thinking-challenges', {
  query: computed(() => ({
    page: page.value,
    pageSize,
    ...(worldQuery.value ? { world: worldQuery.value } : {})
  })),
  default: () => emptyPaginatedResponse<ThinkingChallenge>(pageSize)
})
const challenges = computed(() => challengeData.value?.items || [])
const { data: detailData, refresh: refreshDetail } = await useAsyncData<ChallengeDetail | null>('thinking-challenge-detail', async () => {
  if (!selectedId.value) return null
  return await $fetch<ChallengeDetail>(`/api/thinking-challenges/${selectedId.value}`)
}, {
  default: () => null,
  watch: [selectedId]
})

const selectedChallenge = computed(() => detailData.value?.challenge || challenges.value.find((item) => item.id === selectedId.value) || challenges.value[0] || null)
const attempts = computed(() => detailData.value?.attempts || [])
const selectedOptions = computed(() => parseOptions(selectedChallenge.value?.options || '[]'))

const worldFilters = [
  { label: '全部', value: 'all' as const, hint: '题库' },
  { label: '现实', value: 'reality' as const, hint: '真实场景' },
  { label: '幻想', value: 'fantasy' as const, hint: '故事题场' }
]
const worldItems = [
  { label: '现实类', value: 'reality' },
  { label: '幻想类', value: 'fantasy' }
]

watch(challenges, (items) => {
  if (!selectedId.value && items[0]) selectChallenge(items[0].id)
}, { immediate: true })

watch(selectedId, async () => {
  selectedOption.value = ''
  reason.value = ''
  feedback.value = null
  if (selectedId.value) await refreshDetail()
})

function setWorld(world: ThinkingChallengeWorld | 'all') {
  activeWorld.value = world
  page.value = 1
  selectedId.value = null
  feedback.value = null
}

function selectChallenge(id: number) {
  selectedId.value = id
}

function optionClass(key: string) {
  if (feedback.value) {
    if (key === feedback.value.correct_option) return 'border-teal-500 bg-teal-50 text-teal-950'
    if (key === selectedOption.value && !feedback.value.is_correct) return 'border-amber-400 bg-amber-50 text-amber-950'
  }
  return selectedOption.value === key
    ? 'border-teal-500 bg-white ring-2 ring-teal-100'
    : 'border-slate-200 bg-white text-slate-700 hover:border-teal-300'
}

async function submitAttempt() {
  if (!selectedChallenge.value || !selectedOption.value) return
  submitting.value = true
  try {
    feedback.value = await $fetch<Feedback>(`/api/thinking-challenges/${selectedChallenge.value.id}/attempts`, {
      method: 'POST',
      body: {
        selected_option: selectedOption.value,
        reason: reason.value
      }
    })
    await Promise.all([refreshChallenges(), refreshDetail()])
  } catch (err: any) {
    toast.add({ title: '提交失败', description: err?.statusMessage || err?.message || '请稍后再试', color: 'error' })
  } finally {
    submitting.value = false
  }
}

function openCreate() {
  editing.value = null
  Object.assign(draft, emptyDraft())
  modalOpen.value = true
}

function openEdit(item: ThinkingChallenge) {
  editing.value = item
  Object.assign(draft, {
    title: item.title,
    world_type: item.world_type,
    fallacy_type: item.fallacy_type,
    difficulty: item.difficulty,
    prompt: item.prompt,
    question: item.question,
    options: parseOptions(item.options),
    correct_option: item.correct_option,
    short_explanation: item.short_explanation,
    deep_explanation: item.deep_explanation,
    rebuttal: item.rebuttal,
    tags: item.tags,
    status: item.status,
    visibility: item.visibility
  })
  modalOpen.value = true
}

async function saveChallenge() {
  const body = {
    ...draft,
    difficulty: Number(draft.difficulty)
  }
  try {
    if (editing.value?.id) {
      await $fetch(`/api/thinking-challenges/${editing.value.id}`, { method: 'PUT', body })
      selectedId.value = editing.value.id
    } else {
      const result = await $fetch<{ id: number }>('/api/thinking-challenges', { method: 'POST', body })
      selectedId.value = result.id
    }
    modalOpen.value = false
    await Promise.all([refreshChallenges(), refreshDetail()])
    toast.add({ title: '挑战已保存', color: 'success' })
  } catch (err: any) {
    toast.add({ title: '保存失败', description: err?.statusMessage || err?.message || '请检查选项和正确答案', color: 'error' })
  }
}

async function deleteSelected() {
  if (!selectedChallenge.value) return
  await $fetch(`/api/thinking-challenges/${selectedChallenge.value.id}`, { method: 'DELETE' })
  selectedId.value = null
  feedback.value = null
  await refreshChallenges()
  if (!challenges.value.length && page.value > 1) page.value -= 1
  toast.add({ title: '挑战已删除', color: 'success' })
}

function addOption() {
  const nextKey = String.fromCharCode(65 + draft.options.length)
  draft.options.push({ key: nextKey, label: '', explanation: '' })
}

function emptyDraft(): Draft {
  return {
    title: '',
    world_type: 'reality',
    fallacy_type: '',
    difficulty: 1,
    prompt: '',
    question: '这段论证最主要的问题是什么？',
    options: [
      { key: 'A', label: '', explanation: '' },
      { key: 'B', label: '', explanation: '' },
      { key: 'C', label: '', explanation: '' },
      { key: 'D', label: '', explanation: '' }
    ],
    correct_option: 'A',
    short_explanation: '',
    deep_explanation: '',
    rebuttal: '',
    tags: '',
    status: 'active',
    visibility: 'private'
  }
}

function parseOptions(raw: string): ThinkingChallengeOption[] {
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
  } catch {
    // Invalid option payloads render as empty choices.
  }
  return []
}

function worldLabel(world: string) {
  return world === 'fantasy' ? '幻想类' : '现实类'
}

function accuracyText(item: ThinkingChallenge) {
  const attempts = Number(item.attempt_count || 0)
  if (!attempts) return '未作答'
  return `正确率 ${Math.round((Number(item.correct_count || 0) / attempts) * 100)}%`
}
</script>
