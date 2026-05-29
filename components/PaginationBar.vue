<template>
  <div v-if="total > pageSize" class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2 text-sm text-slate-500">
    <span>第 {{ page }} / {{ pageCount }} 页，共 {{ total }} 条</span>
    <div class="flex items-center gap-2">
      <UButton
        icon="i-lucide-chevron-left"
        color="neutral"
        variant="soft"
        size="xs"
        :disabled="page <= 1"
        @click="$emit('update:page', page - 1)"
      >
        上一页
      </UButton>
      <UButton
        icon="i-lucide-chevron-right"
        trailing
        color="neutral"
        variant="soft"
        size="xs"
        :disabled="page >= pageCount"
        @click="$emit('update:page', page + 1)"
      >
        下一页
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  page: number
  pageSize: number
  total: number
  pageCount: number
}>()

defineEmits<{
  'update:page': [page: number]
}>()
</script>
