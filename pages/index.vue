<template>
  <div class="dashboard-page space-y-4 md:space-y-6">
    <section class="rounded-lg bg-teal-800 px-5 py-6 text-white md:px-8 md:py-8">
      <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p class="text-sm text-teal-100">{{ dashboard?.today }}</p>
          <h1 class="mt-2 text-2xl font-semibold md:text-4xl">今天从一个小动作开始</h1>
          <p class="mt-3 max-w-2xl text-sm leading-6 text-teal-50 md:text-base">记录状态、看见模式、把洞察变成原则，再把原则变成行动。</p>
        </div>
        <UButton to="/explore" icon="i-lucide-message-circle" color="neutral" variant="solid">开始探索</UButton>
      </div>
    </section>

    <div class="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
      <SectionCard title="打卡" description="轻一点也没关系，关键是留下真实状态；也可以补之前某一天。">
        <div class="mb-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <UFormField label="记录日期">
            <UInput v-model="checkinDate" type="date" class="w-full" />
          </UFormField>
          <UButton
            color="neutral"
            variant="soft"
            icon="i-lucide-rotate-ccw"
            :disabled="checkinDate === dashboard?.today"
            @click="checkinDate = dashboard?.today || checkinDate"
          >
            回到今天
          </UButton>
        </div>
        <CheckInForm
          v-if="dashboard"
          :date="checkinDate"
          :initial="selectedCheckin"
          :label="checkinDate === dashboard.today ? '今日打卡' : '历史打卡'"
          @saved="refreshCheckinData"
        />
      </SectionCard>

      <SectionCard title="当前实验" description="本周只做一个 30 分钟内的小尝试。">
        <div v-if="dashboard?.currentExperiment" class="space-y-3">
          <UBadge color="primary" variant="soft">{{ dashboard.currentExperiment.status }}</UBadge>
          <h2 class="text-xl font-semibold text-slate-950">{{ dashboard.currentExperiment.title }}</h2>
          <p class="text-sm leading-6 text-slate-600">{{ dashboard.currentExperiment.description }}</p>
          <UButton to="/experiments" icon="i-lucide-flask-conical" color="neutral" variant="soft">处理实验</UButton>
        </div>
        <div v-else class="space-y-3">
          <p class="text-sm text-slate-500">还没有当前实验。</p>
          <UButton to="/experiments" icon="i-lucide-sparkles">生成一个</UButton>
        </div>
      </SectionCard>
    </div>

    <SectionCard title="打卡记录" description="按时间回看自己的节奏，记录多了也可以继续翻页。">
      <div v-if="checkins?.length" class="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-100 bg-white">
        <div
          v-for="item in checkins"
          :key="item.id"
          class="grid gap-3 p-4 md:grid-cols-[8rem_1fr_auto] md:items-center"
        >
          <div class="space-y-2">
            <p class="font-semibold text-slate-950">{{ item.date }}</p>
            <UBadge color="neutral" variant="soft">情绪 {{ item.mood }}/5</UBadge>
          </div>
          <div class="min-w-0 space-y-1">
            <p class="line-clamp-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {{ item.done_text || '没有记录具体事项。' }}
            </p>
            <p class="truncate text-sm text-slate-500">{{ item.feeling_text || '没有记录一句话感受。' }}</p>
          </div>
          <UButton
            icon="i-lucide-message-circle"
            color="neutral"
            variant="soft"
            :loading="startingConversationId === item.id"
            @click="startCheckinConversation(item)"
          >
            找 AI 聊聊
          </UButton>
        </div>
      </div>
      <p v-else class="text-sm text-slate-500">还没有历史打卡。保存一次今日打卡后会出现在这里。</p>
      <PaginationBar
        v-model:page="checkinPage"
        class="mt-3"
        :page-size="checkinData?.pageSize || listPageSize"
        :total="checkinData?.total || 0"
        :page-count="checkinData?.pageCount || 1"
      />
    </SectionCard>

    <SectionCard title="日记小结" description="AI 会把打卡和对话整理成更完整的回看材料。">
      <div v-if="journals?.length" class="space-y-3">
        <article
          v-for="item in journals"
          :key="item.id"
          class="rounded-lg border border-slate-100 bg-white p-4"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p class="font-semibold text-slate-950">{{ item.title }}</p>
              <p class="mt-1 text-xs text-slate-500">{{ item.date }}</p>
            </div>
            <UBadge color="neutral" variant="soft">私密</UBadge>
          </div>
          <p class="mt-3 line-clamp-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">{{ item.content }}</p>
        </article>
      </div>
      <p v-else class="text-sm text-slate-500">还没有日记小结。可以从探索页的一段对话里生成。</p>
      <PaginationBar
        v-model:page="journalPage"
        class="mt-3"
        :page-size="journalData?.pageSize || listPageSize"
        :total="journalData?.total || 0"
        :page-count="journalData?.pageCount || 1"
      />
    </SectionCard>

    <SectionCard title="周期回顾" description="把一周、一个月或自定义时间段的记录整理成可入库的复盘。">
      <form class="grid gap-3 md:grid-cols-[9rem_1fr_1fr_auto]" @submit.prevent="generatePeriodReview">
        <USelect v-model="periodDraft.period_type" :items="periodTypeItems" class="w-full" />
        <UFormField label="开始">
          <UInput v-model="periodDraft.start_date" type="date" class="w-full" />
        </UFormField>
        <UFormField label="结束">
          <UInput v-model="periodDraft.end_date" type="date" class="w-full" />
        </UFormField>
        <UButton type="submit" icon="i-lucide-calendar-clock" :loading="generatingPeriodReview">生成回顾</UButton>
      </form>

      <div v-if="periodReviews?.length" class="mt-4 space-y-3">
        <article
          v-for="item in periodReviews"
          :key="item.id"
          class="rounded-lg border border-slate-100 bg-white p-4"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p class="font-semibold text-slate-950">{{ item.title }}</p>
              <p class="mt-1 text-xs text-slate-500">{{ item.start_date }} 至 {{ item.end_date }}</p>
            </div>
            <UBadge color="neutral" variant="soft">{{ periodTypeLabel(item.period_type) }}</UBadge>
          </div>
          <p class="mt-3 line-clamp-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">{{ item.content }}</p>
        </article>
      </div>
      <p v-else class="mt-4 text-sm text-slate-500">还没有周期回顾。可以先生成本周复盘。</p>
      <PaginationBar
        v-model:page="periodReviewPage"
        class="mt-3"
        :page-size="periodReviewData?.pageSize || listPageSize"
        :total="periodReviewData?.total || 0"
        :page-count="periodReviewData?.pageCount || 1"
      />
    </SectionCard>

    <div class="grid gap-4 md:grid-cols-3">
      <SectionCard title="原则数量">
        <p class="text-3xl font-semibold text-slate-950">{{ dashboard?.stats?.principles?.count ?? 0 }}</p>
      </SectionCard>
      <SectionCard title="实验数量">
        <p class="text-3xl font-semibold text-slate-950">{{ dashboard?.stats?.experiments?.count ?? 0 }}</p>
      </SectionCard>
      <SectionCard title="最近洞察">
        <div class="space-y-2">
          <p v-if="!dashboard?.insights?.length" class="text-sm text-slate-500">还没有洞察。去探索页聊一段试试。</p>
          <p v-for="item in dashboard?.insights" :key="item.id" class="rounded-lg bg-white p-3 text-sm text-slate-700">{{ item.content }}</p>
        </div>
      </SectionCard>
    </div>

    <UModal v-model:open="periodReviewOpen" title="确认保存周期回顾">
      <template #body>
        <div class="space-y-4">
          <UAlert
            v-if="periodReviewGeneratedFallback"
            color="warning"
            variant="soft"
            icon="i-lucide-circle-alert"
            title="AI 生成失败，已用本地记录生成可编辑草稿"
          />
          <UFormField label="标题">
            <UInput v-model="periodReviewDraft.title" class="w-full" />
          </UFormField>
          <UFormField label="回顾草稿">
            <UTextarea v-model="periodReviewDraft.content" autoresize class="w-full" />
          </UFormField>
          <UButton icon="i-lucide-save" block @click="savePeriodReview">保存周期回顾</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Checkin, PeriodReview } from '~/types/app'
import { emptyPaginatedResponse, type PaginatedResponse } from '~/types/pagination'

const toast = useToast()
const { data: dashboard, refresh } = await useFetch<any>('/api/dashboard')
const listPageSize = 10
const checkinPage = ref(1)
const journalPage = ref(1)
const periodReviewPage = ref(1)
const checkinDate = ref('')
const { data: checkinData, refresh: refreshCheckins } = await useFetch<PaginatedResponse<any>>('/api/checkins', {
  query: { page: checkinPage, pageSize: listPageSize },
  default: () => emptyPaginatedResponse<any>(listPageSize)
})
const { data: journalData } = await useFetch<PaginatedResponse<any>>('/api/journals', {
  query: { page: journalPage, pageSize: listPageSize },
  default: () => emptyPaginatedResponse<any>(listPageSize)
})
const { data: periodReviewData, refresh: refreshPeriodReviews } = await useFetch<PaginatedResponse<PeriodReview>>('/api/period-reviews', {
  query: { page: periodReviewPage, pageSize: listPageSize },
  default: () => emptyPaginatedResponse<PeriodReview>(listPageSize)
})
const { data: selectedCheckinData, refresh: refreshSelectedCheckin } = await useFetch<{ checkin: Checkin | null }>('/api/checkins/date', {
  query: computed(() => ({ date: checkinDate.value || dashboard.value?.today })),
  default: () => ({ checkin: null }),
  watch: [checkinDate]
})
const checkins = computed(() => checkinData.value?.items || [])
const journals = computed(() => journalData.value?.items || [])
const periodReviews = computed(() => periodReviewData.value?.items || [])
const startingConversationId = ref<number | null>(null)
const selectedCheckin = computed(() => selectedCheckinData.value?.checkin || null)
const periodDraft = reactive({
  period_type: 'week',
  start_date: '',
  end_date: ''
})
const periodReviewDraft = reactive({
  period_type: 'week',
  start_date: '',
  end_date: '',
  title: '',
  content: '',
  source_summary: {} as Record<string, unknown>,
  visibility: 'private'
})
const periodReviewOpen = ref(false)
const periodReviewGeneratedFallback = ref(false)
const generatingPeriodReview = ref(false)
const periodTypeItems = [
  { label: '周记', value: 'week' },
  { label: '月记', value: 'month' },
  { label: '自定义', value: 'custom' }
]

watchEffect(() => {
  if (!dashboard.value?.today || checkinDate.value) return
  checkinDate.value = dashboard.value.today
  setDefaultPeriodRange(dashboard.value.today)
})

async function refreshCheckinData() {
  await Promise.all([refresh(), refreshCheckins(), refreshSelectedCheckin()])
}

async function generatePeriodReview() {
  generatingPeriodReview.value = true
  try {
    const result = await $fetch<any>('/api/ai/period-review', {
      method: 'POST',
      body: {
        period_type: periodDraft.period_type,
        start_date: periodDraft.start_date,
        end_date: periodDraft.end_date
      }
    })
    Object.assign(periodReviewDraft, {
      period_type: result.period_type,
      start_date: result.start_date,
      end_date: result.end_date,
      title: result.title,
      content: result.content,
      source_summary: result.source_summary || {},
      visibility: 'private'
    })
    periodReviewGeneratedFallback.value = Boolean(result.fallback)
    periodReviewOpen.value = true
  } catch (error: any) {
    toast.add({ title: '生成周期回顾失败', description: readableError(error, '请稍后再试'), color: 'error' })
  } finally {
    generatingPeriodReview.value = false
  }
}

async function savePeriodReview() {
  await $fetch('/api/period-reviews', {
    method: 'POST',
    body: periodReviewDraft
  })
  periodReviewOpen.value = false
  await refreshPeriodReviews()
  toast.add({ title: '周期回顾已入库', color: 'success' })
}

async function startCheckinConversation(item: any) {
  startingConversationId.value = item.id
  try {
    const message = [
      '我想基于这次打卡聊一聊。',
      `日期：${item.date}`,
      `今天做了什么：${item.done_text || '没有写'}`,
      `一句话感受：${item.feeling_text || '没有写'}`,
      `情绪分数：${item.mood}/5`,
      '',
      '请你像一个温暖但诚实的朋友陪我聊，也可以像咨询师一样帮我梳理，但不要诊断。先回应我此刻的状态，再问一个能让我更了解自己的问题。'
    ].join('\n')
    const result = await $fetch<any>('/api/conversations', {
      method: 'POST',
      body: {
        title: `${item.date} 打卡陪伴`,
        message
      }
    })
    await navigateTo(`/explore?conversation=${result.conversationId}`)
  } catch (error: any) {
    toast.add({
      title: '对话创建失败',
      description: error?.statusMessage || error?.message || '请稍后再试',
      color: 'error'
    })
  } finally {
    startingConversationId.value = null
  }
}

function setDefaultPeriodRange(today: string) {
  const end = new Date(`${today}T00:00:00`)
  const start = new Date(end)
  start.setDate(end.getDate() - 6)
  periodDraft.start_date = formatDate(start)
  periodDraft.end_date = today
}

function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function periodTypeLabel(type: string) {
  return ({ week: '周记', month: '月记', custom: '自定义' } as Record<string, string>)[type] || type
}

function readableError(err: any, fallback: string) {
  return String(err?.message || err?.statusMessage || fallback).replace(/\s+/g, ' ').slice(0, 180)
}
</script>
