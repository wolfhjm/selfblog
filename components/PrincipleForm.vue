<template>
  <form class="space-y-4" @submit.prevent="submit">
    <UFormField label="标题" required>
      <UInput v-model="form.title" placeholder="例如：从最小可行动作开始" class="w-full" />
    </UFormField>
    <div class="grid gap-3 md:grid-cols-2">
      <UFormField label="分类">
        <USelect v-model="form.category" :items="categories" class="w-full" />
      </UFormField>
      <UFormField label="可见性">
        <USelect v-model="form.visibility" :items="visibilityItems" class="w-full" />
      </UFormField>
    </div>
    <UFormField label="描述">
      <UTextarea v-model="form.description" autoresize class="w-full" />
    </UFormField>
    <UFormField label="来源">
      <UTextarea v-model="form.source" autoresize class="w-full" />
    </UFormField>
    <UFormField label="应用场景">
      <UTextarea v-model="form.application" autoresize class="w-full" />
    </UFormField>
    <UFormField label="真实案例">
      <UTextarea v-model="form.example" autoresize class="w-full" />
    </UFormField>
    <UButton type="submit" icon="i-lucide-save" :loading="loading" block>保存原则</UButton>
  </form>
</template>

<script setup lang="ts">
const props = defineProps<{ initial?: any }>()
const emit = defineEmits<{ saved: [] }>()
const loading = ref(false)
const toast = useToast()
const categories = [
  { label: '生活原则', value: 'life' },
  { label: '行动原则', value: 'action' },
  { label: '决策框架', value: 'decision' },
  { label: '工作原则', value: 'work' }
]
const visibilityItems = [
  { label: '私密', value: 'private' },
  { label: '公开', value: 'public' }
]
const form = reactive({
  title: props.initial?.title || '',
  category: props.initial?.category || 'life',
  visibility: props.initial?.visibility || 'private',
  description: props.initial?.description || '',
  source: props.initial?.source || '',
  application: props.initial?.application || '',
  example: props.initial?.example || ''
})

async function submit() {
  loading.value = true
  try {
    if (props.initial?.id) {
      await $fetch(`/api/principles/${props.initial.id}`, { method: 'PUT', body: form })
    } else {
      await $fetch('/api/principles', { method: 'POST', body: form })
    }
    toast.add({ title: '原则已保存', color: 'success' })
    emit('saved')
  } catch (error: any) {
    toast.add({ title: '保存失败', description: error?.statusMessage || '请检查内容', color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>
