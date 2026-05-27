<template>
  <form class="space-y-4" @submit.prevent="submit">
    <UFormField label="今天做了什么">
      <UTextarea v-model="form.done_text" autoresize placeholder="哪怕只是一点点，也算数。" class="w-full" />
    </UFormField>
    <UFormField label="一句话感受">
      <UTextarea v-model="form.feeling_text" autoresize placeholder="今天的你更像什么状态？" class="w-full" />
    </UFormField>
    <div>
      <label class="mb-2 block text-sm font-medium text-slate-700">情绪分数</label>
      <div class="grid grid-cols-5 gap-2">
        <button
          v-for="score in 5"
          :key="score"
          type="button"
          class="tap-target rounded-lg border text-sm font-semibold transition"
          :class="form.mood === score ? 'border-teal-700 bg-teal-700 text-white' : 'border-slate-200 bg-white text-slate-600'"
          @click="form.mood = score"
        >
          {{ score }}
        </button>
      </div>
    </div>
    <UButton type="submit" icon="i-lucide-check" block :loading="loading">保存今日打卡</UButton>
  </form>
</template>

<script setup lang="ts">
const props = defineProps<{ initial?: any, date: string }>()
const emit = defineEmits<{ saved: [] }>()
const toast = useToast()
const loading = ref(false)
const form = reactive({
  date: props.date,
  done_text: props.initial?.done_text || '',
  feeling_text: props.initial?.feeling_text || '',
  mood: props.initial?.mood || 3
})

async function submit() {
  loading.value = true
  try {
    await $fetch('/api/checkins', { method: 'POST', body: form })
    toast.add({ title: '已保存', description: '今天的状态被记录下来了。', color: 'success' })
    emit('saved')
  } catch (error: any) {
    toast.add({ title: '保存失败', description: error?.statusMessage || '请稍后再试', color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>
