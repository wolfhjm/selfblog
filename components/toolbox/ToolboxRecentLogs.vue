<template>
  <SectionCard title="最近使用">
    <div v-if="logs.length" class="space-y-2">
      <article v-for="log in logs" :key="log.id" class="rounded-lg border border-slate-100 bg-white p-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <p class="font-medium text-slate-950">{{ log.tool_title }}</p>
          <UBadge color="neutral" variant="soft">{{ log.category_title }}</UBadge>
        </div>
        <p class="mt-2 line-clamp-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
          {{ log.reflection || log.context || '没有记录文字。' }}
        </p>
        <div class="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
          <span>{{ formatCreatedAt(log.created_at) }}</span>
          <span>强度 {{ log.intensity_before }} -> {{ log.intensity_after }}</span>
        </div>
      </article>
    </div>
    <p v-else class="text-sm leading-6 text-slate-500">还没有使用记录。完成一次练习后，可以把当时状态留在这里。</p>
    <PaginationBar
      :page="page"
      class="mt-3"
      :page-size="pageSize"
      :total="total"
      :page-count="pageCount"
      @update:page="$emit('update:page', $event)"
    />
  </SectionCard>
</template>

<script setup lang="ts">
import type { ToolboxLog } from '~/types/toolbox'

defineProps<{
  logs: ToolboxLog[]
  page: number
  pageSize: number
  total: number
  pageCount: number
}>()

defineEmits<{
  'update:page': [page: number]
}>()

function formatCreatedAt(value: string) {
  if (!value) return ''
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}
</script>
