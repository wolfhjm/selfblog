<template>
  <SectionCard title="当前状态">
    <div class="space-y-2">
      <button
        v-for="category in categories"
        :key="category.id"
        class="w-full rounded-lg border p-3 text-left transition"
        :class="category.id === selectedId ? 'border-teal-300 bg-teal-50' : 'border-slate-100 bg-white hover:border-slate-300'"
        @click="$emit('select', category.id)"
      >
        <div class="flex items-start gap-3">
          <span class="flex size-9 shrink-0 items-center justify-center rounded-lg border" :class="category.accentClass">
            <UIcon :name="category.icon" class="size-5" />
          </span>
          <span class="min-w-0">
            <span class="block font-medium text-slate-950">{{ category.title }}</span>
            <span class="mt-1 block text-xs leading-5 text-slate-500">{{ category.subtitle }}</span>
          </span>
        </div>
      </button>
    </div>
  </SectionCard>
</template>

<script setup lang="ts">
import type { ToolboxCategory } from '~/types/toolbox'

defineProps<{
  categories: ToolboxCategory[]
  selectedId: string
}>()

defineEmits<{
  select: [categoryId: string]
}>()
</script>
