<template>
  <div class="flex items-center gap-2">
    <UIcon name="i-lucide-brain-circuit" class="hidden size-4 text-slate-500 sm:block" />
    <USelect
      v-model="selected"
      :items="modelItems"
      size="sm"
      class="w-40 sm:w-52"
      :loading="pending || saving"
      aria-label="选择 AI 模型"
      @update:model-value="save"
    />
  </div>
</template>

<script setup lang="ts">
const toast = useToast()
const saving = ref(false)
const selected = ref('')
const { data, pending, refresh } = await useFetch<any>('/api/ai/preferences', {
  default: () => ({ current: null, items: [] })
})

const modelItems = computed(() => data.value?.items || [])

watch(
  () => data.value?.current,
  (current) => {
    if (!current) return
    selected.value = `${current.provider}:${current.model}`
  },
  { immediate: true }
)

async function save(value: string) {
  const [provider, ...modelParts] = String(value || '').split(':')
  const model = modelParts.join(':')
  if (!provider || !model) return

  saving.value = true
  try {
    await $fetch('/api/ai/preferences', {
      method: 'PUT',
      body: { provider, model }
    })
    await refresh()
    toast.add({ title: `AI 模型已切换为 ${model}`, color: 'success' })
  } catch (error: any) {
    toast.add({
      title: '模型切换失败',
      description: error?.statusMessage || error?.message || '请检查 AI 配置',
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}
</script>
