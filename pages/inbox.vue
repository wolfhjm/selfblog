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

    <div v-if="filteredCandidates.length" class="grid gap-3 lg:grid-cols-2">
      <SectionCard v-for="item in filteredCandidates" :key="item.id">
        <template #title>
          <div class="flex items-start justify-between gap-3">
            <div>
              <UBadge color="primary" variant="soft">{{ typeLabel(item.candidate_type) }}</UBadge>
              <h2 class="mt-2 text-lg font-semibold text-slate-950">{{ item.title }}</h2>
            </div>
            <UBadge color="neutral" variant="soft">{{ sourceLabel(item) }}</UBadge>
          </div>
        </template>
        <p class="whitespace-pre-wrap text-sm leading-6 text-slate-600">{{ item.content || '没有补充内容。' }}</p>
        <div class="mt-4 flex flex-wrap gap-2">
          <UButton color="primary" variant="soft" icon="i-lucide-check" :loading="actingId === item.id" @click="acceptCandidate(item)">确认入库</UButton>
          <UButton color="neutral" variant="soft" icon="i-lucide-pencil" @click="openEdit(item)">编辑</UButton>
          <UButton color="neutral" variant="ghost" icon="i-lucide-trash-2" :loading="actingId === item.id" @click="dismissCandidate(item)">丢弃</UButton>
        </div>
      </SectionCard>
    </div>
    <SectionCard v-else title="没有待处理候选">
      <p class="text-sm text-slate-500">可以从探索页的一段对话里提取候选，或手动添加一条。</p>
    </SectionCard>

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
  </div>
</template>

<script setup lang="ts">
import type { Candidate, CandidateType } from '~/types/app'

type Draft = {
  candidate_type: CandidateType
  title: string
  content: string
  source_type: string
  source_id: number | null
  payload: Record<string, unknown>
}

const toast = useToast()
const { data: candidates, refresh } = await useFetch<Candidate[]>('/api/candidates', { default: () => [] })
const activeType = ref<CandidateType | 'all'>('all')
const modalOpen = ref(false)
const editing = ref<Candidate | null>(null)
const actingId = ref<number | null>(null)
const draft = reactive<Draft>({
  candidate_type: 'insight',
  title: '',
  content: '',
  source_type: '',
  source_id: null,
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

const filteredCandidates = computed(() => {
  if (activeType.value === 'all') return candidates.value
  return candidates.value.filter((item) => item.candidate_type === activeType.value)
})

function openCreate() {
  editing.value = null
  Object.assign(draft, {
    candidate_type: activeType.value === 'all' ? 'insight' : activeType.value,
    title: '',
    content: '',
    source_type: '',
    source_id: null,
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
  toast.add({ title: '候选已保存', color: 'success' })
}

async function acceptCandidate(item: Candidate) {
  actingId.value = item.id
  try {
    await $fetch(`/api/candidates/${item.id}/accept`, { method: 'POST' })
    await refresh()
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
    toast.add({ title: '已丢弃', color: 'success' })
  } finally {
    actingId.value = null
  }
}

function typeLabel(type: string) {
  return ({ pattern: '规律', case: '小事件', reaction: '感受/反应', lesson: '经验教训', insight: '洞察', experiment: '实验建议' } as Record<string, string>)[type] || type
}

function sourceLabel(item: Candidate) {
  return item.source_type ? `${item.source_type} #${item.source_id || '-'}` : '手动'
}

function parsePayload(payload: string) {
  try {
    return JSON.parse(payload || '{}')
  } catch {
    return {}
  }
}
</script>
