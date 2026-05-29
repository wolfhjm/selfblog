<template>
  <div class="workspace-page space-y-6">
    <section class="rounded-lg bg-slate-950 px-5 py-8 text-white md:px-8 md:py-10">
      <p class="text-sm text-teal-200">Personal Growth OS</p>
      <h1 class="mt-3 text-3xl font-semibold md:text-5xl">一份正在生长的个人说明书</h1>
      <p class="mt-4 max-w-2xl text-sm leading-6 text-slate-200 md:text-base">这里公开展示我愿意被看见的原则和行动实验。它不是成就墙，而是一条还在校准中的成长轨迹。</p>
      <div class="mt-6 flex flex-wrap gap-3">
        <UButton to="/login" icon="i-lucide-log-in">进入私密系统</UButton>
        <UButton to="/principles" color="neutral" variant="soft" icon="i-lucide-book-open">管理原则</UButton>
      </div>
    </section>

    <section>
      <h2 class="mb-3 text-xl font-semibold text-slate-950">公开原则</h2>
      <div class="grid gap-3 md:grid-cols-3">
        <SectionCard v-for="item in principles" :key="item.id">
          <template #title>
            <h3 class="text-lg font-semibold text-slate-950">{{ item.title }}</h3>
          </template>
          <p class="text-sm leading-6 text-slate-600">{{ item.description }}</p>
        </SectionCard>
      </div>
      <PaginationBar
        v-model:page="principlePage"
        class="mt-3"
        :page-size="principleData?.pageSize || pageSize"
        :total="principleData?.total || 0"
        :page-count="principleData?.pageCount || 1"
      />
    </section>

    <section>
      <h2 class="mb-3 text-xl font-semibold text-slate-950">公开实验</h2>
      <div class="grid gap-3 md:grid-cols-2">
        <SectionCard v-for="item in experiments" :key="item.id">
          <template #title>
            <div class="flex items-start justify-between gap-2">
              <h3 class="text-lg font-semibold text-slate-950">{{ item.title }}</h3>
              <UBadge color="primary" variant="soft">{{ item.status }}</UBadge>
            </div>
          </template>
          <p class="text-sm leading-6 text-slate-600">{{ item.description }}</p>
        </SectionCard>
      </div>
      <PaginationBar
        v-model:page="experimentPage"
        class="mt-3"
        :page-size="experimentData?.pageSize || pageSize"
        :total="experimentData?.total || 0"
        :page-count="experimentData?.pageCount || 1"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { emptyPaginatedResponse, type PaginatedResponse } from '~/types/pagination'

const pageSize = 9
const principlePage = ref(1)
const experimentPage = ref(1)
const { data: principleData } = await useFetch<PaginatedResponse<any>>('/api/principles', {
  query: { visibility: 'public', page: principlePage, pageSize },
  default: () => emptyPaginatedResponse<any>(pageSize)
})
const { data: experimentData } = await useFetch<PaginatedResponse<any>>('/api/experiments', {
  query: { visibility: 'public', page: experimentPage, pageSize },
  default: () => emptyPaginatedResponse<any>(pageSize)
})
const principles = computed(() => principleData.value?.items || [])
const experiments = computed(() => experimentData.value?.items || [])
</script>
