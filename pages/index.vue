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
        <CheckInForm v-if="dashboard" :date="dashboard.today" :initial="dashboard.checkin" @saved="refresh" />
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
const { data: dashboard, refresh } = await useFetch<any>('/api/dashboard')
</script>
