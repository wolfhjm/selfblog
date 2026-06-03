<template>
  <header class="sticky top-0 z-30 border-b border-slate-200/70 bg-slate-50/80 backdrop-blur-xl">
    <div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
      <NuxtLink to="/" class="flex items-center gap-3">
        <div class="flex size-10 items-center justify-center rounded-xl bg-teal-700 text-sm font-bold text-white">OS</div>
        <div>
          <p class="text-sm font-semibold text-slate-950">个人成长 OS</p>
          <p class="hidden text-xs text-slate-500 sm:block">认识自己，把想法变成行动</p>
        </div>
      </NuxtLink>

      <nav v-if="user" class="hidden items-center gap-1 md:flex">
        <UButton v-for="item in nav" :key="item.to" :to="item.to" :icon="item.icon" color="neutral" variant="ghost">
          {{ item.label }}
        </UButton>
      </nav>

      <div class="flex items-center gap-2">
        <UButton v-if="!user" to="/public" color="neutral" variant="ghost">公开说明书</UButton>
        <UButton v-if="user" icon="i-lucide-log-out" color="neutral" variant="ghost" aria-label="退出登录" @click="logout" />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
const { user, logout } = useAuth()
const nav = [
  { label: '仪表盘', to: '/', icon: 'i-lucide-layout-dashboard' },
  { label: '探索', to: '/explore', icon: 'i-lucide-message-circle' },
  { label: '思维', to: '/thinking', icon: 'i-lucide-brain' },
  { label: '地图', to: '/map', icon: 'i-lucide-network' },
  { label: '收件箱', to: '/inbox', icon: 'i-lucide-inbox' },
  { label: '实验', to: '/experiments', icon: 'i-lucide-flask-conical' },
  { label: '原则', to: '/principles', icon: 'i-lucide-book-open' },
  { label: '公开', to: '/public', icon: 'i-lucide-globe-2' }
]
</script>
