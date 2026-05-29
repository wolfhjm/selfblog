<template>
  <div class="workspace-page space-y-4">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold text-slate-950">原则库</h1>
        <p class="mt-1 text-sm text-slate-500">把反思沉淀成可复用的判断框架。</p>
      </div>
      <UButton icon="i-lucide-plus" @click="editing = {}">新增</UButton>
    </div>

    <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      <SectionCard v-for="item in principles" :key="item.id">
        <template #title>
          <div class="flex items-start justify-between gap-2">
            <div>
              <UBadge color="neutral" variant="soft">{{ labelCategory(item.category) }}</UBadge>
              <h2 class="mt-2 text-lg font-semibold text-slate-950">{{ item.title }}</h2>
            </div>
            <UBadge :color="item.visibility === 'public' ? 'primary' : 'neutral'" variant="soft">{{ item.visibility === 'public' ? '公开' : '私密' }}</UBadge>
          </div>
        </template>
        <p class="line-clamp-4 text-sm leading-6 text-slate-600">{{ item.description }}</p>
        <div class="mt-4 flex gap-2">
          <UButton color="neutral" variant="soft" icon="i-lucide-pencil" @click="editing = item">编辑</UButton>
        </div>
      </SectionCard>
    </div>
    <PaginationBar
      v-model:page="page"
      :page-size="principleData?.pageSize || pageSize"
      :total="principleData?.total || 0"
      :page-count="principleData?.pageCount || 1"
    />

    <UModal v-model:open="modalOpen" title="编辑原则">
      <template #body>
        <PrincipleForm :initial="editing" @saved="onSaved" />
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { emptyPaginatedResponse, type PaginatedResponse } from '~/types/pagination'

const page = ref(1)
const pageSize = 12
const { data: principleData, refresh } = await useFetch<PaginatedResponse<any>>('/api/principles', {
  query: { page, pageSize },
  default: () => emptyPaginatedResponse<any>(pageSize)
})
const principles = computed(() => principleData.value?.items || [])
const editing = ref<any | null>(null)
const modalOpen = computed({
  get: () => editing.value !== null,
  set: (value) => { if (!value) editing.value = null }
})

function labelCategory(category: string) {
  return ({ life: '生活', action: '行动', decision: '决策', work: '工作' } as Record<string, string>)[category] || category
}

async function onSaved() {
  editing.value = null
  page.value = 1
  await refresh()
}
</script>
