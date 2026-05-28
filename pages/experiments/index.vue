<template>
  <div class="workspace-page space-y-4">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold text-slate-950">行动实验</h1>
        <p class="mt-1 text-sm text-slate-500">只做一次、30 分钟内完成，用体验替代空想。</p>
      </div>
      <UButton icon="i-lucide-sparkles" :loading="suggesting" @click="suggest">AI 推荐</UButton>
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
        <div v-if="item.reflection || item.barrier" class="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          <p v-if="item.reflection">复盘：{{ item.reflection }}</p>
          <p v-if="item.barrier">阻碍：{{ item.barrier }}</p>
        </div>
        <div class="mt-4 flex flex-wrap gap-2">
          <UButton color="primary" variant="soft" icon="i-lucide-check" @click="openReview(item, 'done')">完成</UButton>
          <UButton color="neutral" variant="soft" icon="i-lucide-circle-help" @click="openReview(item, 'skipped')">没做</UButton>
          <UButton color="neutral" variant="ghost" icon="i-lucide-pencil" @click="editing = { ...item }">编辑</UButton>
        </div>
      </SectionCard>
    </div>

    <UModal v-model:open="draftOpen" title="确认实验">
      <template #body>
        <form class="space-y-4" @submit.prevent="saveDraft">
          <UFormField label="标题" required>
            <UInput v-model="draft.title" class="w-full" />
          </UFormField>
          <UFormField label="描述">
            <UTextarea v-model="draft.description" autoresize class="w-full" />
          </UFormField>
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

    <UModal v-model:open="reviewOpen" title="记录实验结果">
      <template #body>
        <form class="space-y-4" @submit.prevent="saveReview">
          <UFormField v-if="review.status === 'done'" label="做完后的复盘">
            <UTextarea v-model="review.reflection" autoresize placeholder="这次体验让我学到了什么？" class="w-full" />
          </UFormField>
          <UFormField v-else label="是什么挡住了你">
            <UTextarea v-model="review.barrier" autoresize placeholder="不是责备，只是把阻力看清楚。" class="w-full" />
          </UFormField>
          <UButton type="submit" icon="i-lucide-save" block>保存</UButton>
        </form>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const toast = useToast()
const { data: experiments, refresh } = await useFetch<any[]>('/api/experiments', { default: () => [] })
const suggesting = ref(false)
const error = ref('')
const editing = ref<any | null>(null)
const review = ref<any | null>(null)
const draft = reactive({
  title: '',
  description: '',
  status: 'active',
  visibility: 'private',
  week_number: appDateString(),
  suggested_by_ai: 1
})
const visibilityItems = [{ label: '私密', value: 'private' }, { label: '公开', value: 'public' }]
const statusItems = [{ label: '进行中', value: 'active' }, { label: '草稿', value: 'draft' }]
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
    suggested_by_ai: value.suggested_by_ai ?? 0
  })
})

function statusLabel(status: string) {
  return ({ active: '进行中', done: '已完成', skipped: '未完成', draft: '草稿' } as Record<string, string>)[status] || status
}

function statusColor(status: string) {
  return status === 'done' ? 'success' : status === 'skipped' ? 'warning' : status === 'active' ? 'primary' : 'neutral'
}

async function suggest() {
  suggesting.value = true
  error.value = ''
  try {
    const result = await $fetch<any>('/api/ai/experiment', { method: 'POST' })
    editing.value = { ...result, status: 'active', visibility: 'private', suggested_by_ai: 1 }
  } catch (err: any) {
    error.value = err?.statusMessage || 'AI 推荐失败，请检查配置'
  } finally {
    suggesting.value = false
  }
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
  await refresh()
  toast.add({ title: '实验已保存', color: 'success' })
}

function openReview(item: any, status: 'done' | 'skipped') {
  review.value = { ...item, status }
}

async function saveReview() {
  if (!review.value) return
  await $fetch(`/api/experiments/${review.value.id}`, { method: 'PUT', body: review.value })
  review.value = null
  await refresh()
  toast.add({ title: '结果已记录', color: 'success' })
}
</script>
