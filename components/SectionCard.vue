<template>
  <section class="glass-panel rounded-lg p-4 md:p-5">
    <div v-if="$slots.title || title" class="mb-4 flex items-start justify-between gap-3">
      <div>
        <slot name="title">
          <h2 class="text-base font-semibold text-slate-950 md:text-lg">{{ title }}</h2>
        </slot>
        <p v-if="description" class="mt-1 text-sm text-slate-500">{{ description }}</p>
      </div>
      <slot name="actions" />
    </div>
    <slot />
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
}>()
</script>
