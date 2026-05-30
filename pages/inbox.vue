<template>
  <div class="workspace-page space-y-4">
    <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-slate-950">候选收件箱</h1>
        <p class="mt-1 text-sm text-slate-500">AI 提取的内容先放在这里，确认后再进入认知地图或实验库。</p>
      </div>
      <UButton icon="i-lucide-plus" color="neutral" variant="soft" @click="openCreate">手动添加</UButton>
    </div>

    <div class="glass-panel rounded-lg p-3">
      <div class="flex flex-wrap gap-2">
        <button
          v-for="type in typeFilters"
          :key="type.value"
          class="rounded-lg border px-3 py-2 text-sm transition"
          :class="activeType === type.value ? 'border-teal-500 bg-teal-50 text-teal-900' : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300'"
          @click="activeType = type.value"
        >
          {{ type.label }}
        </button>
      </div>
    </div>

    <div v-if="candidates.length" class="space-y-4">
      <SectionCard v-for="chain in groupedChains" :key="chain.key">
        <template #title>
          <div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <UBadge color="primary" variant="soft">事件链</UBadge>
                <UBadge color="neutral" variant="soft">{{ chain.items.length }} 条候选</UBadge>
              </div>
              <h2 class="mt-2 text-lg font-semibold text-slate-950">{{ chain.title }}</h2>
              <p v-if="chain.summary" class="mt-1 text-sm leading-6 text-slate-500">{{ chain.summary }}</p>
            </div>
            <UButton
              v-if="chain.id"
              color="neutral"
              variant="soft"
              icon="i-lucide-list-tree"
              :loading="loadingChainId === chain.id"
              @click="openChain(chain.id)"
            >
              查看事件
            </UButton>
          </div>
        </template>

        <div class="space-y-3">
          <div
            v-for="eventGroup in chain.events"
            :key="eventGroup.key"
            class="rounded-lg border border-slate-100 bg-white p-3"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p class="text-sm font-semibold text-slate-950">{{ eventGroup.title }}</p>
                <p v-if="eventGroup.order" class="mt-1 text-xs text-slate-400">事件 {{ eventGroup.order }}</p>
              </div>
              <UBadge color="neutral" variant="soft">{{ eventGroup.items.length }} 条</UBadge>
            </div>
            <div class="mt-3 grid gap-3 lg:grid-cols-2">
              <div
                v-for="item in eventGroup.items"
                :key="item.id"
                class="rounded-lg border border-slate-100 bg-slate-50 p-3"
              >
                <CandidateCard
                  :item="item"
                  :acting="actingId === item.id"
                  @accept="acceptCandidate"
                  @analyze="analyzeCandidate"
                  @edit="openEdit"
                  @dismiss="dismissCandidate"
                />
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard v-if="ungroupedCandidates.length" title="未分组候选">
        <div class="grid gap-3 lg:grid-cols-2">
          <div
            v-for="item in ungroupedCandidates"
            :key="item.id"
            class="rounded-lg border border-slate-100 bg-slate-50 p-3"
          >
            <CandidateCard
              :item="item"
              :acting="actingId === item.id"
              @accept="acceptCandidate"
              @analyze="analyzeCandidate"
              @edit="openEdit"
              @dismiss="dismissCandidate"
            />
          </div>
        </div>
      </SectionCard>
    </div>
    <SectionCard v-else title="没有待处理候选">
      <p class="text-sm text-slate-500">可以从探索页的一段对话里提取候选，或手动添加一条。</p>
    </SectionCard>
    <PaginationBar
      v-model:page="page"
      :page-size="candidateData?.pageSize || pageSize"
      :total="candidateData?.total || 0"
      :page-count="candidateData?.pageCount || 1"
    />

    <UModal v-model:open="modalOpen" :title="editing?.id ? '编辑候选' : '新增候选'">
      <template #body>
        <form class="space-y-4" @submit.prevent="saveCandidate">
          <UFormField label="类型" required>
            <USelect v-model="draft.candidate_type" :items="typeItems" class="w-full" />
          </UFormField>
          <UFormField label="标题" required>
            <UInput v-model="draft.title" class="w-full" />
          </UFormField>
          <UFormField label="内容">
            <UTextarea v-model="draft.content" autoresize class="w-full" />
          </UFormField>
          <div class="grid gap-3 md:grid-cols-2">
            <UFormField label="来源类型">
              <UInput v-model="draft.source_type" placeholder="conversation / checkin / experiment" class="w-full" />
            </UFormField>
            <UFormField label="来源 ID">
              <UInput v-model.number="draft.source_id" type="number" class="w-full" />
            </UFormField>
          </div>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="modalOpen = false">取消</UButton>
            <UButton type="submit" icon="i-lucide-save">保存</UButton>
          </div>
        </form>
      </template>
    </UModal>

    <UModal v-model:open="chainOpen" title="事件链详情">
      <template #body>
        <div v-if="chainDetail" class="space-y-4">
          <div>
            <h2 class="text-base font-semibold text-slate-950">{{ chainDetail.chain.title }}</h2>
            <p v-if="chainDetail.chain.summary" class="mt-1 text-sm leading-6 text-slate-500">{{ chainDetail.chain.summary }}</p>
          </div>
          <div class="space-y-3">
            <div
              v-for="event in chainDetail.events"
              :key="event.id"
              class="rounded-lg border border-slate-100 bg-white p-3"
            >
              <div class="flex items-center justify-between gap-2">
                <h3 class="text-sm font-semibold text-slate-950">{{ event.sort_order }}. {{ event.title || event.activating_event || '未命名事件' }}</h3>
                <UBadge color="neutral" variant="soft">{{ eventCandidateCount(event.id) }} 条候选</UBadge>
              </div>
              <div class="mt-3 space-y-2 text-sm">
                <div
                  v-for="detail in eventDetails(event)"
                  :key="detail.label"
                  class="grid gap-1 md:grid-cols-[5.5rem_minmax(0,1fr)]"
                >
                  <span class="font-medium text-slate-500">{{ detail.label }}</span>
                  <span class="whitespace-pre-wrap leading-6 text-slate-700">{{ detail.value }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Candidate, CandidateType, EventChain, ExtractedEvent } from '~/types/app'
import { emptyPaginatedResponse, type PaginatedResponse } from '~/types/pagination'

type EventChainDetail = { chain: EventChain, events: ExtractedEvent[], candidates: Candidate[] }

type Draft = {
  candidate_type: CandidateType
  title: string
  content: string
  source_type: string
  source_id: number | null
  event_chain_id: number | null
  extracted_event_id: number | null
  payload: Record<string, unknown>
}

const toast = useToast()
const activeType = ref<CandidateType | 'all'>('all')
const page = ref(1)
const pageSize = 12
const typeQuery = computed(() => activeType.value === 'all' ? undefined : activeType.value)
const { data: candidateData, refresh } = await useFetch<PaginatedResponse<Candidate>>('/api/candidates', {
  query: computed(() => ({
    page: page.value,
    pageSize,
    ...(typeQuery.value ? { type: typeQuery.value } : {})
  })),
  default: () => emptyPaginatedResponse<Candidate>(pageSize)
})
const candidates = computed(() => candidateData.value?.items || [])
const modalOpen = ref(false)
const editing = ref<Candidate | null>(null)
const actingId = ref<number | null>(null)
const chainOpen = ref(false)
const loadingChainId = ref<number | null>(null)
const chainDetail = ref<EventChainDetail | null>(null)
const draft = reactive<Draft>({
  candidate_type: 'insight',
  title: '',
  content: '',
  source_type: '',
  source_id: null,
  event_chain_id: null,
  extracted_event_id: null,
  payload: {}
})

const typeItems: Array<{ label: string, value: CandidateType }> = [
  { label: '规律', value: 'pattern' },
  { label: '小事件', value: 'case' },
  { label: '感受/反应', value: 'reaction' },
  { label: '经验教训', value: 'lesson' },
  { label: '洞察', value: 'insight' },
  { label: '实验建议', value: 'experiment' }
]
const typeFilters: Array<{ label: string, value: CandidateType | 'all' }> = [{ label: '全部', value: 'all' }, ...typeItems]
const groupedChains = computed(() => {
  const chains = new Map<string, {
    key: string
    id: number | null
    title: string
    summary: string
    items: Candidate[]
    events: Array<{ key: string, id: number | null, order: number | null, title: string, items: Candidate[] }>
  }>()

  for (const item of candidates.value.filter((candidate) => candidate.event_chain_id)) {
    const key = String(item.event_chain_id)
    if (!chains.has(key)) {
      chains.set(key, {
        key,
        id: item.event_chain_id,
        title: item.event_chain_title || `事件链 #${item.event_chain_id}`,
        summary: item.event_chain_summary || '',
        items: [],
        events: []
      })
    }
    const chain = chains.get(key)!
    chain.items.push(item)
    const eventKey = String(item.extracted_event_id || `unassigned-${key}`)
    let eventGroup = chain.events.find((event) => event.key === eventKey)
    if (!eventGroup) {
      eventGroup = {
        key: eventKey,
        id: item.extracted_event_id,
        order: item.event_sort_order || null,
        title: item.event_title || '未归属事件',
        items: []
      }
      chain.events.push(eventGroup)
    }
    eventGroup.items.push(item)
  }

  return Array.from(chains.values()).map((chain) => ({
    ...chain,
    events: chain.events.sort((left, right) => (left.order || 999) - (right.order || 999))
  }))
})
const ungroupedCandidates = computed(() => candidates.value.filter((candidate) => !candidate.event_chain_id))

watch(activeType, () => {
  page.value = 1
})

function openCreate() {
  editing.value = null
  Object.assign(draft, {
    candidate_type: activeType.value === 'all' ? 'insight' : activeType.value,
    title: '',
    content: '',
    source_type: '',
    source_id: null,
    event_chain_id: null,
    extracted_event_id: null,
    payload: {}
  })
  modalOpen.value = true
}

function openEdit(item: Candidate) {
  editing.value = item
  Object.assign(draft, {
    candidate_type: item.candidate_type,
    title: item.title,
    content: item.content,
    source_type: item.source_type || '',
    source_id: item.source_id,
    event_chain_id: item.event_chain_id,
    extracted_event_id: item.extracted_event_id,
    payload: parsePayload(item.payload)
  })
  modalOpen.value = true
}

async function saveCandidate() {
  const body = {
    ...draft,
    source_type: draft.source_type.trim() || null,
    source_id: draft.source_id || null
  }
  if (editing.value?.id) {
    await $fetch(`/api/candidates/${editing.value.id}`, { method: 'PUT', body })
  } else {
    await $fetch('/api/candidates', { method: 'POST', body })
  }
  modalOpen.value = false
  await refresh()
  page.value = 1
  toast.add({ title: '候选已保存', color: 'success' })
}

async function acceptCandidate(item: Candidate) {
  actingId.value = item.id
  try {
    await $fetch(`/api/candidates/${item.id}/accept`, { method: 'POST' })
    await refresh()
    if (!candidates.value.length && page.value > 1) page.value -= 1
    toast.add({ title: '已确认入库', color: 'success' })
  } catch (err: any) {
    toast.add({ title: '确认失败', description: err?.statusMessage || err?.message || '请稍后再试', color: 'error' })
  } finally {
    actingId.value = null
  }
}

async function dismissCandidate(item: Candidate) {
  actingId.value = item.id
  try {
    await $fetch(`/api/candidates/${item.id}`, { method: 'DELETE' })
    await refresh()
    if (!candidates.value.length && page.value > 1) page.value -= 1
    toast.add({ title: '已丢弃', color: 'success' })
  } finally {
    actingId.value = null
  }
}

async function openChain(id: number) {
  loadingChainId.value = id
  try {
    chainDetail.value = await $fetch<EventChainDetail>(`/api/event-chains/${id}` as '/api/event-chains/[id]')
    chainOpen.value = true
  } catch (err: any) {
    toast.add({ title: '事件链读取失败', description: err?.statusMessage || err?.message || '请稍后再试', color: 'error' })
  } finally {
    loadingChainId.value = null
  }
}

async function analyzeCandidate(item: Candidate) {
  actingId.value = item.id
  try {
    const payload = parsePayload(item.payload)
    const questions = followUpQuestions(item)
    const message = [
      '我想继续分析这条候选，不急着下结论，请你围绕具体事件、感受和隐藏动机追问我。',
      `候选类型：${typeLabel(item.candidate_type)}`,
      `标题：${item.title}`,
      `内容：${item.content || '无'}`,
      item.event_chain_title ? `事件链：${item.event_chain_title}` : '',
      item.event_chain_summary ? `事件链摘要：${item.event_chain_summary}` : '',
      item.event_title ? `所属事件：${item.event_title}` : '',
      payload.objective_context ? `客观环境：${payload.objective_context}` : '',
      payload.event_detail || payload.activating_event ? `事件：${payload.event_detail || payload.activating_event}` : '',
      payload.emotion ? `感受：${payload.emotion}` : '',
      payload.interpretation || payload.belief_or_interpretation ? `当时解释：${payload.interpretation || payload.belief_or_interpretation}` : '',
      payload.consequence ? `后果：${payload.consequence}` : '',
      payload.evidence_for ? `支持证据：${payload.evidence_for}` : '',
      payload.evidence_against ? `反例：${payload.evidence_against}` : '',
      payload.reframe ? `新解释：${payload.reframe}` : '',
      payload.hidden_need ? `可能需求：${payload.hidden_need}` : '',
      payload.hidden_fear ? `可能恐惧：${payload.hidden_fear}` : '',
      payload.target_behavior ? `目标行为：${payload.target_behavior}` : '',
      payload.motivation ? `动机：${payload.motivation}` : '',
      payload.ability ? `能力/难度：${payload.ability}` : '',
      payload.prompt ? `提示：${payload.prompt}` : '',
      payload.tiny_version ? `更小版本：${payload.tiny_version}` : '',
      payload.success_criterion ? `完成标准：${payload.success_criterion}` : '',
      payload.opportunity ? `机会/环境：${payload.opportunity}` : '',
      payload.health_context ? `健康背景：${payload.health_context}` : '',
      payload.raw_evidence ? `原文证据：${payload.raw_evidence}` : '',
      questions.length ? `建议追问：\n${questions.map((question: string) => `- ${question}`).join('\n')}` : '',
      '',
      '请先帮我指出这条候选里证据最强和最模糊的部分，然后只问一个最值得继续回答的问题。'
    ].filter(Boolean).join('\n')

    const result = await $fetch<any>('/api/conversations', {
      method: 'POST',
      body: {
        title: `继续分析：${item.title}`.slice(0, 32),
        message,
        mode: 'structured'
      }
    })
    await navigateTo(`/explore?conversation=${result.conversationId}`)
  } catch (err: any) {
    toast.add({ title: '创建分析对话失败', description: err?.statusMessage || err?.message || '请稍后再试', color: 'error' })
  } finally {
    actingId.value = null
  }
}

function typeLabel(type: string) {
  return ({ pattern: '规律', case: '小事件', reaction: '感受/反应', lesson: '经验教训', insight: '洞察', experiment: '实验建议' } as Record<string, string>)[type] || type
}

function eventDetails(event: ExtractedEvent) {
  return [
    { label: '客观环境', value: event.objective_context },
    { label: '触发事件', value: event.activating_event || event.event_detail },
    { label: '事件细节', value: event.event_detail },
    { label: '解释/信念', value: event.belief_or_interpretation },
    { label: '后果', value: event.consequence },
    { label: '身体信号', value: event.body_signal },
    { label: '情绪', value: event.emotion },
    { label: '隐藏需求', value: event.hidden_need },
    { label: '隐藏恐惧', value: event.hidden_fear },
    { label: '原文证据', value: event.raw_evidence }
  ].filter((detail) => String(detail.value || '').trim())
}

function eventCandidateCount(eventId: number) {
  return chainDetail.value?.candidates.filter((candidate) => candidate.extracted_event_id === eventId).length || 0
}

function parsePayload(payload: string) {
  try {
    return JSON.parse(payload || '{}')
  } catch {
    return {}
  }
}

function followUpQuestions(item: Candidate) {
  const payload = parsePayload(item.payload)
  return Array.isArray(payload.follow_up_questions)
    ? payload.follow_up_questions.filter((question: unknown) => String(question || '').trim()).slice(0, 3)
    : []
}
</script>
