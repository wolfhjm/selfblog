<template>
  <div class="workspace-page space-y-4">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-slate-950">行动实验</h1>
        <p class="mt-1 text-sm text-slate-500">只做一次、30 分钟内完成，用体验替代空想。</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <UButton icon="i-lucide-dices" color="neutral" variant="soft" :loading="adventuring && !selectedAdventureCategoryId" @click="adventure()">
          完全随机
        </UButton>
        <UButton icon="i-lucide-list-filter" color="neutral" variant="soft" @click="categoryOpen = true">
          类别随机
        </UButton>
        <UButton icon="i-lucide-settings-2" color="neutral" variant="ghost" @click="manageCategoryOpen = true">
          管理类别
        </UButton>
        <UButton icon="i-lucide-sparkles" :loading="suggesting" @click="suggest">AI 推荐</UButton>
      </div>
    </div>

    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      icon="i-lucide-circle-alert"
      :title="error"
    />

    <div class="grid gap-3 lg:grid-cols-2">
      <SectionCard v-for="item in experiments" :key="item.id">
        <template #title>
          <div class="flex items-start justify-between gap-2">
            <div>
              <UBadge :color="statusColor(item.status)" variant="soft">{{ statusLabel(item.status) }}</UBadge>
              <h2 class="mt-2 text-lg font-semibold text-slate-950">{{ item.title }}</h2>
            </div>
            <UBadge :color="item.visibility === 'public' ? 'primary' : 'neutral'" variant="soft">{{ item.visibility === 'public' ? '公开' : '私密' }}</UBadge>
          </div>
        </template>
        <p class="text-sm leading-6 text-slate-600">{{ item.description }}</p>
        <div v-if="mapDetails(item).length" class="mt-3 space-y-2 rounded-lg border border-slate-100 bg-white p-3 text-sm">
          <div
            v-for="detail in mapDetails(item)"
            :key="detail.label"
            class="grid gap-1 md:grid-cols-[5.5rem_minmax(0,1fr)]"
          >
            <span class="font-medium text-slate-500">{{ detail.label }}</span>
            <span class="leading-6 text-slate-700">{{ detail.value }}</span>
          </div>
        </div>
        <div v-if="item.reflection || item.barrier || item.actual_behavior || item.learning || item.completion_score" class="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          <p v-if="item.completion_score">完成度：{{ item.completion_score }}%</p>
          <p v-if="item.actual_behavior">实际行动：{{ item.actual_behavior }}</p>
          <p v-if="item.reflection">复盘：{{ item.reflection }}</p>
          <p v-if="item.learning">学到：{{ item.learning }}</p>
          <p v-if="item.barrier">阻碍：{{ item.barrier }}</p>
          <p v-if="item.failure_reason">缺口：{{ failureReasonLabel(item.failure_reason) }}</p>
          <p v-if="item.verification_result">验证：{{ verificationResultLabel(item.verification_result) }}</p>
        </div>
        <div class="mt-4 flex flex-wrap gap-2">
          <UButton color="primary" variant="soft" icon="i-lucide-clipboard-check" @click="openReview(item)">记录情况</UButton>
          <UButton color="neutral" variant="ghost" icon="i-lucide-pencil" @click="editing = { ...item }">编辑</UButton>
        </div>
      </SectionCard>
    </div>
    <PaginationBar
      v-model:page="page"
      :page-size="experimentData?.pageSize || pageSize"
      :total="experimentData?.total || 0"
      :page-count="experimentData?.pageCount || 1"
    />

    <UModal v-model:open="draftOpen" title="确认实验">
      <template #body>
        <form class="space-y-4" @submit.prevent="saveDraft">
          <UAlert
            v-if="draftKind === 'adventure'"
            color="primary"
            variant="soft"
            icon="i-lucide-dices"
            title="随机大冒险实验"
            description="这是一个尝试新事物的低成本实验。可以先改小一点，再保存。"
          />
          <UFormField label="标题" required>
            <UInput v-model="draft.title" class="w-full" />
          </UFormField>
          <UFormField label="描述">
            <UTextarea v-model="draft.description" autoresize class="w-full" />
          </UFormField>
          <div class="rounded-lg border border-slate-100 bg-slate-50 p-3">
            <p class="text-sm font-medium text-slate-700">Fogg 行为设计</p>
            <div class="mt-3 grid gap-3 md:grid-cols-2">
              <UFormField label="目标行为">
                <UInput v-model="draft.target_behavior" placeholder="具体到能看到的一次行为" class="w-full" />
              </UFormField>
              <UFormField label="触发提示">
                <UInput v-model="draft.prompt" placeholder="什么时候、看到什么就做" class="w-full" />
              </UFormField>
              <UFormField label="动机">
                <UTextarea v-model="draft.motivation" autoresize class="w-full" />
              </UFormField>
              <UFormField label="能力/难度">
                <UTextarea v-model="draft.ability" autoresize class="w-full" />
              </UFormField>
              <UFormField label="更小版本">
                <UInput v-model="draft.tiny_version" placeholder="做不到时退一步做什么" class="w-full" />
              </UFormField>
              <UFormField label="完成标准">
                <UInput v-model="draft.success_criterion" placeholder="怎样算完成" class="w-full" />
              </UFormField>
            </div>
          </div>
          <div class="grid gap-3 md:grid-cols-2">
            <UFormField label="机会/环境">
              <UTextarea v-model="draft.opportunity" autoresize class="w-full" />
            </UFormField>
            <UFormField label="健康背景">
              <UTextarea v-model="draft.health_context" autoresize class="w-full" />
            </UFormField>
          </div>
          <div class="grid gap-3 md:grid-cols-2">
            <UFormField label="可见性">
              <USelect v-model="draft.visibility" :items="visibilityItems" class="w-full" />
            </UFormField>
            <UFormField label="状态">
              <USelect v-model="draft.status" :items="statusItems" class="w-full" />
            </UFormField>
          </div>
          <UButton type="submit" icon="i-lucide-save" block>保存实验</UButton>
        </form>
      </template>
    </UModal>

    <UModal v-model:open="categoryOpen" title="选择大冒险类别">
      <template #body>
        <div class="space-y-3">
          <button
            v-for="category in adventureCategories"
            :key="category.id"
            class="w-full rounded-lg border border-slate-100 bg-white p-3 text-left transition hover:border-teal-300"
            @click="adventure(category.id)"
          >
            <p class="font-medium text-slate-950">{{ category.title }}</p>
            <p class="mt-1 text-sm leading-6 text-slate-500">{{ category.description || '没有描述。' }}</p>
          </button>
          <p v-if="!adventureCategories.length" class="text-sm text-slate-500">还没有类别，可以先去管理类别里新增。</p>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="manageCategoryOpen" title="管理随机类别">
      <template #body>
        <div class="mb-3 flex flex-wrap gap-2">
          <UButton icon="i-lucide-sparkles" color="neutral" variant="soft" :loading="suggestingCategory" @click="suggestCategory">
            AI 推荐新类别
          </UButton>
          <UButton icon="i-lucide-wand-sparkles" color="neutral" variant="soft" :loading="writingPrompt" :disabled="!categoryDraft.title.trim()" @click="writeCategoryPrompt">
            根据类别写提示词
          </UButton>
        </div>
        <form class="space-y-3 rounded-lg border border-slate-100 bg-slate-50 p-3" @submit.prevent="saveCategory">
          <UFormField label="类别名" required>
            <UInput v-model="categoryDraft.title" class="w-full" />
          </UFormField>
          <UFormField label="描述">
            <UTextarea v-model="categoryDraft.description" autoresize class="w-full" />
          </UFormField>
          <UFormField label="生成提示">
            <UTextarea v-model="categoryDraft.prompt_hint" autoresize placeholder="告诉 AI 这个类别应该怎么生成" class="w-full" />
          </UFormField>
          <div class="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <UFormField label="排序">
              <UInput v-model.number="categoryDraft.sort_order" type="number" class="w-full" />
            </UFormField>
            <UButton type="submit" icon="i-lucide-save">{{ editingCategoryId ? '更新类别' : '新增类别' }}</UButton>
          </div>
        </form>

        <div class="mt-4 space-y-2">
          <div
            v-for="category in adventureCategories"
            :key="category.id"
            class="rounded-lg border border-slate-100 bg-white p-3"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="font-medium text-slate-950">{{ category.title }}</p>
                <p class="mt-1 text-sm leading-6 text-slate-500">{{ category.description || '没有描述。' }}</p>
              </div>
              <div class="flex gap-1">
                <UButton color="neutral" variant="ghost" icon="i-lucide-pencil" aria-label="编辑类别" @click="editCategory(category)" />
                <UButton color="error" variant="ghost" icon="i-lucide-trash-2" aria-label="删除类别" @click="deleteCategory(category)" />
              </div>
            </div>
          </div>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="reviewOpen" title="记录实验结果">
      <template #body>
        <form class="space-y-4" @submit.prevent="saveReview">
          <UFormField label="完成度">
            <USelect v-model="review.completion_score" :items="completionItems" class="w-full" @update:model-value="syncReviewStatus" />
          </UFormField>
          <UFormField label="实际做了什么">
            <UTextarea v-model="review.actual_behavior" autoresize placeholder="哪怕只做了一部分，也写实际发生的事。" class="w-full" />
          </UFormField>
          <UFormField label="体验复盘">
            <UTextarea v-model="review.reflection" autoresize placeholder="做的时候有什么感受、身体信号或意外发现？" class="w-full" />
          </UFormField>
          <UFormField label="这次学到什么">
            <UTextarea v-model="review.learning" autoresize placeholder="这次结果支持、修正或反驳了什么想法？" class="w-full" />
          </UFormField>
          <UFormField label="阻碍">
            <UTextarea v-model="review.barrier" autoresize placeholder="不是责备，只是把阻力看清楚。" class="w-full" />
          </UFormField>
          <div class="grid gap-3 md:grid-cols-2">
            <UFormField label="主要缺口">
              <USelect v-model="review.failure_reason" :items="failureReasonItems" class="w-full" />
            </UFormField>
            <UFormField label="验证结果">
              <USelect v-model="review.verification_result" :items="verificationResultItems" class="w-full" />
            </UFormField>
          </div>
          <UButton type="submit" icon="i-lucide-save" block>保存</UButton>
        </form>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { emptyPaginatedResponse, type PaginatedResponse } from '~/types/pagination'

const toast = useToast()
const page = ref(1)
const pageSize = 10
const { data: experimentData, refresh } = await useFetch<PaginatedResponse<any>>('/api/experiments', {
  query: { page, pageSize },
  default: () => emptyPaginatedResponse<any>(pageSize)
})
const { data: categoryData, refresh: refreshCategories } = await useFetch<any[]>('/api/adventure-categories', {
  default: () => []
})
const experiments = computed(() => experimentData.value?.items || [])
const adventureCategories = computed(() => categoryData.value || [])
const suggesting = ref(false)
const adventuring = ref(false)
const selectedAdventureCategoryId = ref<number | null>(null)
const error = ref('')
const editing = ref<any | null>(null)
const draftKind = ref<'normal' | 'adventure'>('normal')
const review = ref<any | null>(null)
const categoryOpen = ref(false)
const manageCategoryOpen = ref(false)
const suggestingCategory = ref(false)
const writingPrompt = ref(false)
const editingCategoryId = ref<number | null>(null)
const categoryDraft = reactive({
  title: '',
  description: '',
  prompt_hint: '',
  sort_order: 100
})
const draft = reactive({
  title: '',
  description: '',
  status: 'active',
  visibility: 'private',
  week_number: appDateString(),
  suggested_by_ai: 1,
  target_behavior: '',
  motivation: '',
  ability: '',
  prompt: '',
  tiny_version: '',
  success_criterion: '',
  opportunity: '',
  health_context: '',
  completion_score: 0,
  actual_behavior: '',
  learning: ''
})
const visibilityItems = [{ label: '私密', value: 'private' }, { label: '公开', value: 'public' }]
const statusItems = [
  { label: '进行中', value: 'active' },
  { label: '已完成', value: 'done' },
  { label: '部分完成', value: 'partial' },
  { label: '未执行', value: 'skipped' },
  { label: '草稿', value: 'draft' }
]
const completionItems = [
  { label: '0% 没开始', value: 0 },
  { label: '25% 只做了一点', value: 25 },
  { label: '50% 做了一半', value: 50 },
  { label: '75% 基本做了', value: 75 },
  { label: '100% 完整完成', value: 100 }
]
const failureReasonItems = [
  { label: '未选择', value: '' },
  { label: '动机不足', value: 'motivation' },
  { label: '能力/难度不足', value: 'ability' },
  { label: '缺少提示', value: 'prompt' },
  { label: '机会/环境不足', value: 'opportunity' },
  { label: '健康/精力不足', value: 'health' }
]
const verificationResultItems = [
  { label: '未知', value: 'unknown' },
  { label: '支持原假设', value: 'supports' },
  { label: '部分支持', value: 'partial' },
  { label: '反驳原假设', value: 'contradicts' },
  { label: '需要调整', value: 'needs_revision' }
]
const draftOpen = computed({
  get: () => editing.value !== null,
  set: (value) => { if (!value) editing.value = null }
})
const reviewOpen = computed({
  get: () => review.value !== null,
  set: (value) => { if (!value) review.value = null }
})

watch(editing, (value) => {
  if (!value) return
  Object.assign(draft, {
    title: value.title || '',
    description: value.description || '',
    status: value.status || 'active',
    visibility: value.visibility || 'private',
    week_number: value.week_number || appDateString(),
    suggested_by_ai: value.suggested_by_ai ?? 0,
    target_behavior: value.target_behavior || '',
    motivation: value.motivation || '',
    ability: value.ability || '',
    prompt: value.prompt || '',
    tiny_version: value.tiny_version || '',
    success_criterion: value.success_criterion || '',
    opportunity: value.opportunity || '',
    health_context: value.health_context || '',
    completion_score: value.completion_score || 0,
    actual_behavior: value.actual_behavior || '',
    learning: value.learning || ''
  })
})

function statusLabel(status: string) {
  return ({ active: '进行中', done: '已完成', partial: '部分完成', skipped: '未执行', draft: '草稿' } as Record<string, string>)[status] || status
}

function statusColor(status: string) {
  return status === 'done' ? 'success' : status === 'partial' ? 'primary' : status === 'skipped' ? 'warning' : status === 'active' ? 'primary' : 'neutral'
}

function mapDetails(item: any) {
  return [
    { label: '目标行为', value: item.target_behavior },
    { label: '动机', value: item.motivation },
    { label: '能力', value: item.ability },
    { label: '提示', value: item.prompt },
    { label: '更小版本', value: item.tiny_version },
    { label: '完成标准', value: item.success_criterion },
    { label: '机会', value: item.opportunity },
    { label: '健康背景', value: item.health_context }
  ].filter((detail) => String(detail.value || '').trim())
}

function failureReasonLabel(value: string) {
  return ({ motivation: '动机不足', ability: '能力/难度不足', prompt: '缺少提示', opportunity: '机会/环境不足', health: '健康/精力不足' } as Record<string, string>)[value] || value
}

function verificationResultLabel(value: string) {
  return ({ unknown: '未知', supports: '支持原假设', partial: '部分支持', contradicts: '反驳原假设', needs_revision: '需要调整' } as Record<string, string>)[value] || value
}

async function suggest() {
  suggesting.value = true
  error.value = ''
  draftKind.value = 'normal'
  try {
    const result = await $fetch<any>('/api/ai/experiment', { method: 'POST' })
    editing.value = { ...result, status: 'active', visibility: 'private', suggested_by_ai: 1 }
  } catch (err: any) {
    error.value = err?.statusMessage || 'AI 推荐失败，请检查配置'
  } finally {
    suggesting.value = false
  }
}

async function adventure(categoryId: number | null = null) {
  adventuring.value = true
  selectedAdventureCategoryId.value = categoryId
  error.value = ''
  draftKind.value = 'adventure'
  try {
    const result = await $fetch<any>('/api/ai/adventure-experiment', {
      method: 'POST',
      body: { category_id: categoryId }
    })
    editing.value = {
      ...result,
      status: 'draft',
      visibility: 'private',
      suggested_by_ai: 1,
      week_number: appDateString()
    }
    categoryOpen.value = false
  } catch (err: any) {
    error.value = err?.statusMessage || err?.message || '随机大冒险生成失败，请稍后再试'
  } finally {
    adventuring.value = false
    selectedAdventureCategoryId.value = null
  }
}

async function saveCategory() {
  const body = { ...categoryDraft }
  if (editingCategoryId.value) {
    await $fetch(`/api/adventure-categories/${editingCategoryId.value}`, { method: 'PUT', body })
  } else {
    await $fetch('/api/adventure-categories', { method: 'POST', body })
  }
  resetCategoryDraft()
  await refreshCategories()
  toast.add({ title: '类别已保存', color: 'success' })
}

async function suggestCategory() {
  suggestingCategory.value = true
  try {
    const result = await $fetch<any>('/api/ai/adventure-category', { method: 'POST' })
    editingCategoryId.value = null
    Object.assign(categoryDraft, {
      title: result.title || '',
      description: result.description || '',
      prompt_hint: result.prompt_hint || '',
      sort_order: result.sort_order ?? 100
    })
  } catch (err: any) {
    error.value = err?.statusMessage || err?.message || 'AI 推荐类别失败'
  } finally {
    suggestingCategory.value = false
  }
}

async function writeCategoryPrompt() {
  writingPrompt.value = true
  try {
    const result = await $fetch<any>('/api/ai/adventure-category-prompt', {
      method: 'POST',
      body: {
        title: categoryDraft.title,
        description: categoryDraft.description,
        prompt_hint: categoryDraft.prompt_hint
      }
    })
    categoryDraft.prompt_hint = result.prompt_hint || categoryDraft.prompt_hint
  } catch (err: any) {
    error.value = err?.statusMessage || err?.message || '生成提示词失败'
  } finally {
    writingPrompt.value = false
  }
}

function editCategory(category: any) {
  editingCategoryId.value = category.id
  Object.assign(categoryDraft, {
    title: category.title || '',
    description: category.description || '',
    prompt_hint: category.prompt_hint || '',
    sort_order: category.sort_order ?? 100
  })
}

async function deleteCategory(category: any) {
  await $fetch(`/api/adventure-categories/${category.id}`, { method: 'DELETE' })
  if (editingCategoryId.value === category.id) resetCategoryDraft()
  await refreshCategories()
  toast.add({ title: '类别已删除', color: 'success' })
}

function resetCategoryDraft() {
  editingCategoryId.value = null
  Object.assign(categoryDraft, {
    title: '',
    description: '',
    prompt_hint: '',
    sort_order: 100
  })
}

async function saveDraft() {
  if (editing.value?.id) {
    await $fetch(`/api/experiments/${editing.value.id}`, {
      method: 'PUT',
      body: { ...editing.value, ...draft, reflection: editing.value.reflection || '', barrier: editing.value.barrier || '' }
    })
  } else {
    await $fetch('/api/experiments', { method: 'POST', body: draft })
  }
  editing.value = null
  page.value = 1
  await refresh()
  toast.add({ title: '实验已保存', color: 'success' })
}

function openReview(item: any) {
  const completion = Number(item.completion_score || 0)
  review.value = {
    ...item,
    completion_score: completion,
    status: statusFromCompletion(completion),
    actual_behavior: item.actual_behavior || '',
    learning: item.learning || '',
    failure_reason: item.failure_reason || '',
    verification_result: item.verification_result || (completion >= 75 ? 'supports' : completion > 0 ? 'partial' : 'needs_revision')
  }
}

function syncReviewStatus() {
  if (!review.value) return
  const completion = Number(review.value.completion_score || 0)
  review.value.status = statusFromCompletion(completion)
  if (!review.value.verification_result || review.value.verification_result === 'unknown') {
    review.value.verification_result = completion >= 75 ? 'supports' : completion > 0 ? 'partial' : 'needs_revision'
  }
}

function statusFromCompletion(completion: number) {
  if (completion >= 100) return 'done'
  if (completion > 0) return 'partial'
  return 'skipped'
}

async function saveReview() {
  if (!review.value) return
  await $fetch(`/api/experiments/${review.value.id}`, { method: 'PUT', body: review.value })
  review.value = null
  page.value = 1
  await refresh()
  toast.add({ title: '结果已记录', color: 'success' })
}
</script>
