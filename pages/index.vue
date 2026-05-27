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
      <SectionCard title="今日打卡" description="轻一点也没关系，关键是留下真实状态。">
        <CheckInForm v-if="dashboard" :date="dashboard.today" :initial="dashboard.checkin" @saved="refreshCheckinData" />
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

    <SectionCard title="打卡记录" description="最近 30 次状态会留在这里，方便回看自己的节奏。">
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
  </div>
</template>

<script setup lang="ts">
const toast = useToast()
const { data: dashboard, refresh } = await useFetch<any>('/api/dashboard')
const { data: checkins, refresh: refreshCheckins } = await useFetch<any[]>('/api/checkins')
const { data: journals } = await useFetch<any[]>('/api/journals')
const startingConversationId = ref<number | null>(null)

async function refreshCheckinData() {
  await Promise.all([refresh(), refreshCheckins()])
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
</script>
