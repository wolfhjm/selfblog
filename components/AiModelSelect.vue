<template>
  <div class="relative">
    <UButton
      color="neutral"
      variant="ghost"
      icon="i-lucide-brain-circuit"
      class="tap-target"
      :aria-label="currentLabel ? `AI 模型：${currentLabel}` : '选择 AI 模型'"
      :title="currentLabel ? `AI 模型：${currentLabel}` : '选择 AI 模型'"
      @click="open = !open"
    />
    <div
      v-if="open"
      class="absolute right-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-slate-200 bg-white p-3 shadow-xl"
    >
      <div class="mb-3 flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-sm font-semibold text-slate-950">AI 模型</p>
          <p class="mt-1 truncate text-xs text-slate-500">{{ currentLabel || '未选择' }}</p>
        </div>
        <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="xs" aria-label="关闭模型选择" @click="open = false" />
      </div>
      <USelect
        v-model="selected"
        :items="modelItems"
        size="sm"
        class="w-full"
        :loading="pending || saving"
        aria-label="选择 AI 模型"
        @update:model-value="save"
      />
      <div class="mt-3 flex items-center justify-between gap-2 text-xs text-slate-500">
        <span class="truncate">{{ configLabel }}</span>
        <UButton icon="i-lucide-refresh-cw" color="neutral" variant="ghost" size="xs" aria-label="刷新模型配置" @click="refresh" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const toast = useToast()
const saving = ref(false)
const selected = ref('')
const open = ref(false)
const { data, pending, refresh } = await useFetch<any>('/api/ai/preferences', {
  default: () => ({ current: null, items: [], config: null })
})

const modelItems = computed(() => data.value?.items || [])
const currentLabel = computed(() => {
  const current = data.value?.current
  if (!current?.provider || !current?.model) return ''
  return `${providerLabel(current.provider)} · ${current.model}`
})
const configLabel = computed(() => {
  const config = data.value?.config
  if (!config) return '配置未读取'
  return `${providerLabel(config.provider)} · ${config.wireApi || 'chat_completions'} · ${config.hasApiKey ? '已配置 Key' : '未配置 Key'}`
})

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
    open.value = false
    toast.add({ title: `AI 模型已切换为 ${providerLabel(provider)} · ${model}`, color: 'success' })
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

function providerLabel(provider: string) {
  return ({ glm: 'GLM 官方', newapi: 'New API', sub2: 'sub2' } as Record<string, string>)[provider] || provider
}
</script>
