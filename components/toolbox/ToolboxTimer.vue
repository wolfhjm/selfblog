<template>
  <div class="rounded-lg border border-slate-100 bg-slate-50 p-4">
    <p class="text-sm font-medium text-slate-700">{{ label }}</p>
    <p class="mt-2 tabular-nums text-4xl font-semibold text-slate-950">{{ display }}</p>
    <div class="mt-4 flex flex-wrap gap-2">
      <UButton :icon="isRunning ? 'i-lucide-pause' : 'i-lucide-play'" size="sm" @click="$emit('toggle')">
        {{ isRunning ? '暂停' : '开始' }}
      </UButton>
      <UButton icon="i-lucide-rotate-ccw" color="neutral" variant="soft" size="sm" @click="$emit('reset')">重置</UButton>
    </div>
    <div class="mt-4 space-y-3 text-sm text-slate-600">
      <div>
        <div class="mb-1 flex items-center justify-between gap-2">
          <span>开始强度</span>
          <span class="font-medium text-slate-900">{{ intensityBefore }}/10</span>
        </div>
        <input :value="intensityBefore" type="range" min="0" max="10" class="w-full accent-teal-700" @input="updateIntensityBefore">
      </div>
      <div>
        <div class="mb-1 flex items-center justify-between gap-2">
          <span>结束强度</span>
          <span class="font-medium text-slate-900">{{ intensityAfter }}/10</span>
        </div>
        <input :value="intensityAfter" type="range" min="0" max="10" class="w-full accent-teal-700" @input="updateIntensityAfter">
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  display: string
  isRunning: boolean
  intensityBefore: number
  intensityAfter: number
}>()

const emit = defineEmits<{
  toggle: []
  reset: []
  'update:intensityBefore': [value: number]
  'update:intensityAfter': [value: number]
}>()

function updateIntensityBefore(event: Event) {
  emit('update:intensityBefore', Number((event.target as HTMLInputElement).value))
}

function updateIntensityAfter(event: Event) {
  emit('update:intensityAfter', Number((event.target as HTMLInputElement).value))
}
</script>
