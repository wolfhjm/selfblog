<template>
  <nav class="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/92 px-2 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur-xl min-[1100px]:hidden">
    <div class="mx-auto grid max-w-md grid-cols-6">
      <NuxtLink
        v-for="item in nav"
        :key="item.to"
        :to="item.to"
        class="tap-target flex flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-xs text-slate-500"
        active-class="bg-teal-50 text-teal-800"
      >
        <UIcon :name="item.icon" class="size-5" />
        <span class="truncate">{{ item.label }}</span>
      </NuxtLink>
    </div>
  </nav>
</template>

<script setup lang="ts">
const nav = [
  { label: '今日', to: '/', icon: 'i-lucide-house' },
  { label: '探索', to: '/explore', icon: 'i-lucide-message-circle' },
  { label: '工具', to: '/toolbox', icon: 'i-lucide-heart-pulse' },
  { label: '收件箱', to: '/inbox', icon: 'i-lucide-inbox' },
  { label: '实验', to: '/experiments', icon: 'i-lucide-flask-conical' },
  { label: '原则', to: '/principles', icon: 'i-lucide-book-open' }
]
</script>
