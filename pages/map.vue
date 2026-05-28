<template>
  <div class="workspace-page space-y-4">
    <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-slate-950">认知地图</h1>
        <p class="mt-1 text-sm text-slate-500">把事件、反应、洞察、经验和规律连成一张可验证的网。</p>
      </div>
      <UButton icon="i-lucide-plus" @click="openCreate">新增对象</UButton>
    </div>

    <div class="grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
      <aside class="glass-panel rounded-lg p-4">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="搜索标题或内容"
          class="mb-3"
        />

        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="type in itemTypeFilters"
            :key="type.value"
            class="rounded-lg border px-3 py-2 text-left text-sm transition"
            :class="activeType === type.value ? 'border-teal-500 bg-teal-50 text-teal-900' : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300'"
            @click="setActiveType(type.value)"
          >
            <span class="block font-medium">{{ type.label }}</span>
            <span class="mt-1 block text-xs opacity-70">{{ countByType(type.value) }}</span>
          </button>
        </div>

        <div class="mt-4 space-y-2">
          <button
            v-for="item in filteredItems"
            :key="item.id"
            class="w-full rounded-lg border bg-white p-3 text-left transition hover:border-teal-300"
            :class="selected?.id === item.id ? 'border-teal-500 ring-2 ring-teal-100' : 'border-slate-200'"
            @click="selectedId = item.id"
          >
            <div class="flex items-center justify-between gap-2">
              <UBadge color="neutral" variant="soft">{{ itemTypeLabel(item.item_type) }}</UBadge>
              <span class="text-xs text-slate-400">{{ item.link_count || 0 }} 关联</span>
            </div>
            <p class="mt-2 line-clamp-2 text-sm font-semibold text-slate-950">{{ item.title }}</p>
            <p class="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{{ item.content || '还没有补充内容。' }}</p>
          </button>
          <p v-if="!filteredItems.length" class="rounded-lg bg-white p-3 text-sm text-slate-500">还没有符合条件的对象。</p>
        </div>
      </aside>

      <section class="min-w-0 space-y-4">
        <SectionCard v-if="selected">
          <template #title>
            <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div class="flex flex-wrap gap-2">
                  <UBadge color="primary" variant="soft">{{ itemTypeLabel(selected.item_type) }}</UBadge>
                  <UBadge color="neutral" variant="soft">{{ verificationLabel(selected.verification_status) }}</UBadge>
                  <UBadge :color="selected.visibility === 'public' ? 'primary' : 'neutral'" variant="soft">
                    {{ selected.visibility === 'public' ? '公开' : '私密' }}
                  </UBadge>
                </div>
                <h2 class="mt-3 text-xl font-semibold text-slate-950">{{ selected.title }}</h2>
              </div>
              <div class="flex gap-2">
                <UButton color="neutral" variant="soft" icon="i-lucide-pencil" @click="openEdit(selected)">编辑</UButton>
                <UButton color="error" variant="ghost" icon="i-lucide-trash-2" @click="deleteSelected">删除</UButton>
              </div>
            </div>
          </template>

          <p class="whitespace-pre-wrap text-sm leading-7 text-slate-700">{{ selected.content || '还没有补充内容。' }}</p>
          <div v-if="selected.source_type" class="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
            来源：{{ selected.source_type }} #{{ selected.source_id }}
          </div>
        </SectionCard>

        <SectionCard v-if="selected" title="关联对象" description="先用手动关联跑通结构，后续再接 AI 候选收件箱。">
          <form class="grid gap-3 md:grid-cols-[1fr_1fr_auto]" @submit.prevent="createLink">
            <USelectMenu
              v-model="linkTargetId"
              :items="linkTargetOptions"
              value-key="value"
              placeholder="选择目标对象"
              class="min-w-0"
            />
            <USelect v-model="linkRelationType" :items="relationItems" class="min-w-0" />
            <UButton type="submit" icon="i-lucide-link" :disabled="!linkTargetId">关联</UButton>
          </form>

          <div class="mt-4 space-y-2">
            <div
              v-for="link in selectedLinks"
              :key="link.id"
              class="flex flex-col gap-2 rounded-lg border border-slate-100 bg-white p-3 md:flex-row md:items-center md:justify-between"
            >
              <div class="min-w-0">
                <p class="text-sm font-medium text-slate-950">{{ relationLabel(link.relation_type) }}</p>
                <p class="mt-1 truncate text-sm text-slate-500">{{ linkPeerLabel(link) }}</p>
              </div>
              <UButton color="neutral" variant="ghost" icon="i-lucide-unlink" aria-label="取消关联" @click="deleteLink(link)" />
            </div>
            <p v-if="!selectedLinks.length" class="text-sm text-slate-500">还没有关联。可以先把小事件连到洞察，或把经验教训连到规律。</p>
          </div>
        </SectionCard>

        <SectionCard v-else title="选择一个对象">
          <p class="text-sm text-slate-500">从左侧列表选择一条，查看内容和关联。</p>
        </SectionCard>
      </section>
    </div>

    <UModal v-model:open="itemModalOpen" :title="editing?.id ? '编辑认知对象' : '新增认知对象'">
      <template #body>
        <form class="space-y-4" @submit.prevent="saveItem">
          <div class="grid gap-3 md:grid-cols-2">
            <UFormField label="类型" required>
              <USelect v-model="draft.item_type" :items="itemTypeItems" class="w-full" />
            </UFormField>
            <UFormField label="验证状态">
              <USelect v-model="draft.verification_status" :items="verificationItems" class="w-full" />
            </UFormField>
          </div>
          <UFormField label="标题" required>
            <UInput v-model="draft.title" class="w-full" />
          </UFormField>
          <UFormField label="内容">
            <UTextarea v-model="draft.content" autoresize class="w-full" />
          </UFormField>
          <div class="grid gap-3 md:grid-cols-2">
            <UFormField label="来源类型">
              <UInput v-model="draft.source_type" placeholder="checkin / conversation / experiment" class="w-full" />
            </UFormField>
            <UFormField label="来源 ID">
              <UInput v-model.number="draft.source_id" type="number" class="w-full" />
            </UFormField>
          </div>
          <UFormField label="可见性">
            <USelect v-model="draft.visibility" :items="visibilityItems" class="w-full" />
          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="itemModalOpen = false">取消</UButton>
            <UButton type="submit" icon="i-lucide-save">保存</UButton>
          </div>
        </form>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { CognitiveItem, CognitiveItemType, ObjectLink, VerificationStatus, Visibility } from '~/types/app'

type Draft = {
  item_type: CognitiveItemType
  title: string
  content: string
  source_type: string
  source_id: number | null
  verification_status: VerificationStatus
  visibility: Visibility
}

const toast = useToast()
const { data: items, refresh: refreshItems } = await useFetch<CognitiveItem[]>('/api/cognitive-items', { default: () => [] })
const { data: links, refresh: refreshLinks } = await useFetch<ObjectLink[]>('/api/object-links', { default: () => [] })
const search = ref('')
const activeType = ref<CognitiveItemType | 'all'>('all')
const selectedId = ref<number | null>(null)
const editing = ref<CognitiveItem | null>(null)
const itemModalOpen = ref(false)
const linkTargetId = ref<number | undefined>(undefined)
const linkRelationType = ref('supports')
const draft = reactive<Draft>({
  item_type: 'case',
  title: '',
  content: '',
  source_type: '',
  source_id: null,
  verification_status: 'unverified',
  visibility: 'private'
})

const itemTypeItems: Array<{ label: string, value: CognitiveItemType }> = [
  { label: '规律', value: 'pattern' },
  { label: '小事件', value: 'case' },
  { label: '感受/反应', value: 'reaction' },
  { label: '经验教训', value: 'lesson' },
  { label: '洞察', value: 'insight' }
]
const itemTypeFilters: Array<{ label: string, value: CognitiveItemType | 'all' }> = [{ label: '全部', value: 'all' }, ...itemTypeItems]
const verificationItems = [
  { label: '未验证', value: 'unverified' },
  { label: '有例子', value: 'has_example' },
  { label: '实验中', value: 'testing' },
  { label: '部分支持', value: 'partial' },
  { label: '强支持', value: 'strong' },
  { label: '待修订', value: 'needs_revision' },
  { label: '废弃', value: 'discarded' }
]
const visibilityItems = [{ label: '私密', value: 'private' }, { label: '公开', value: 'public' }]
const relationItems = [
  { label: '相关', value: 'related_to' },
  { label: '支持', value: 'supports' },
  { label: '矛盾', value: 'contradicts' },
  { label: '来自', value: 'derived_from' },
  { label: '验证', value: 'validates' },
  { label: '启发', value: 'inspired_by' },
  { label: '作为证据', value: 'evidence_for' },
  { label: '作为例子', value: 'example_of' },
  { label: '建议实验', value: 'suggests_experiment' }
]

const filteredItems = computed(() => {
  const keyword = search.value.trim().toLowerCase()
  return items.value.filter((item) => {
    const matchesType = activeType.value === 'all' || item.item_type === activeType.value
    const matchesSearch = !keyword || `${item.title} ${item.content}`.toLowerCase().includes(keyword)
    return matchesType && matchesSearch
  })
})

const selected = computed(() => items.value.find((item) => item.id === selectedId.value) || filteredItems.value[0] || null)
const selectedLinks = computed(() => {
  if (!selected.value) return []
  return links.value.filter((link) => (
    (link.source_type === selected.value?.item_type && link.source_id === selected.value?.id)
    || (link.target_type === selected.value?.item_type && link.target_id === selected.value?.id)
  ))
})
const linkTargetOptions = computed(() => items.value
  .filter((item) => !selected.value || item.id !== selected.value.id || item.item_type !== selected.value.item_type)
  .map((item) => ({ label: `${itemTypeLabel(item.item_type)} / ${item.title}`, value: item.id })))

watch(selected, () => {
  linkTargetId.value = undefined
})

function setActiveType(type: CognitiveItemType | 'all') {
  activeType.value = type
}

function openCreate() {
  editing.value = null
  Object.assign(draft, {
    item_type: activeType.value === 'all' ? 'case' : activeType.value,
    title: '',
    content: '',
    source_type: '',
    source_id: null,
    verification_status: 'unverified',
    visibility: 'private'
  })
  itemModalOpen.value = true
}

function openEdit(item: CognitiveItem) {
  editing.value = item
  Object.assign(draft, {
    item_type: item.item_type,
    title: item.title,
    content: item.content,
    source_type: item.source_type || '',
    source_id: item.source_id,
    verification_status: item.verification_status,
    visibility: item.visibility
  })
  itemModalOpen.value = true
}

async function saveItem() {
  const body = {
    ...draft,
    source_type: draft.source_type.trim() || null,
    source_id: draft.source_id || null
  }
  if (editing.value?.id) {
    await $fetch(`/api/cognitive-items/${editing.value.id}`, { method: 'PUT', body })
    selectedId.value = editing.value.id
  } else {
    const result = await $fetch<{ id: number }>('/api/cognitive-items', { method: 'POST', body })
    selectedId.value = Number(result.id)
  }
  itemModalOpen.value = false
  await refreshItems()
  toast.add({ title: '认知对象已保存', color: 'success' })
}

async function deleteSelected() {
  if (!selected.value) return
  await $fetch(`/api/cognitive-items/${selected.value.id}`, { method: 'DELETE' })
  selectedId.value = null
  await Promise.all([refreshItems(), refreshLinks()])
  toast.add({ title: '已删除', color: 'success' })
}

async function createLink() {
  if (!selected.value || !linkTargetId.value) return
  const target = items.value.find((item) => item.id === linkTargetId.value)
  if (!target) return
  await $fetch('/api/object-links', {
    method: 'POST',
    body: {
      source_type: selected.value.item_type,
      source_id: selected.value.id,
      target_type: target.item_type,
      target_id: target.id,
      relation_type: linkRelationType.value,
      confidence: 0.7
    }
  })
  linkTargetId.value = undefined
  await Promise.all([refreshItems(), refreshLinks()])
  toast.add({ title: '关联已创建', color: 'success' })
}

async function deleteLink(link: ObjectLink) {
  await $fetch(`/api/object-links/${link.id}`, { method: 'DELETE' })
  await Promise.all([refreshItems(), refreshLinks()])
  toast.add({ title: '关联已取消', color: 'success' })
}

function itemTypeLabel(type: string) {
  return ({ pattern: '规律', case: '小事件', reaction: '感受/反应', lesson: '经验教训', insight: '洞察' } as Record<string, string>)[type] || type
}

function verificationLabel(status: string) {
  return ({ unverified: '未验证', has_example: '有例子', testing: '实验中', partial: '部分支持', strong: '强支持', needs_revision: '待修订', discarded: '废弃' } as Record<string, string>)[status] || status
}

function relationLabel(type: string) {
  return ({ related_to: '相关', supports: '支持', contradicts: '矛盾', derived_from: '来自', validates: '验证', inspired_by: '启发', evidence_for: '作为证据', example_of: '作为例子', suggests_experiment: '建议实验' } as Record<string, string>)[type] || type
}

function countByType(type: string) {
  if (type === 'all') return `${items.value.length} 条`
  return `${items.value.filter((item) => item.item_type === type).length} 条`
}

function linkPeerLabel(link: ObjectLink) {
  if (!selected.value) return ''
  const isSource = link.source_type === selected.value.item_type && link.source_id === selected.value.id
  const peerType = isSource ? link.target_type : link.source_type
  const peerId = isSource ? link.target_id : link.source_id
  const peer = items.value.find((item) => item.item_type === peerType && item.id === peerId)
  return peer ? `${itemTypeLabel(peer.item_type)} / ${peer.title}` : `${peerType} #${peerId}`
}
</script>
