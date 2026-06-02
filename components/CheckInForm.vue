<template>
  <form class="space-y-4" @submit.prevent="submit">
    <p
      v-if="hasSavedCheckin"
      class="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
    >
      {{ savedHint }}
    </p>
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
    <UButton
      type="submit"
      :icon="buttonIcon"
      block
      :disabled="hasSavedCheckin && !isDirty"
      :loading="loading"
    >
      {{ buttonLabel }}
    </UButton>
  </form>
</template>

<script setup lang="ts">
const props = defineProps<{ initial?: any, date: string, label?: string }>()
const emit = defineEmits<{ saved: [] }>()
const toast = useToast()
const loading = ref(false)
const form = reactive({
  date: props.date,
  done_text: props.initial?.done_text || '',
  feeling_text: props.initial?.feeling_text || '',
  mood: props.initial?.mood || 3
})
const hasSavedCheckin = ref(Boolean(props.initial))
const savedSnapshot = ref(snapshotForm(form))

const isDirty = computed(() => snapshotForm(form) !== savedSnapshot.value)
const buttonLabel = computed(() => {
  const label = props.label || '打卡'
  if (!hasSavedCheckin.value) return `保存${label}`
  return isDirty.value ? `更新${label}` : `${label}已记录`
})
const buttonIcon = computed(() => {
  if (!hasSavedCheckin.value || isDirty.value) return 'i-lucide-check'
  return 'i-lucide-check-check'
})
const savedHint = computed(() => `${props.label || '打卡'}已记录。修改内容后可以再次更新，不会重复新增。`)

watch(() => props.date, (date) => {
  form.date = date
  syncInitial(props.initial)
})

watch(() => props.initial, (initial) => {
  syncInitial(initial)
})

function syncInitial(initial?: any) {
  if (initial) {
    form.done_text = initial.done_text || ''
    form.feeling_text = initial.feeling_text || ''
    form.mood = initial.mood || 3
    hasSavedCheckin.value = true
  } else {
    form.done_text = ''
    form.feeling_text = ''
    form.mood = 3
    hasSavedCheckin.value = false
  }
  savedSnapshot.value = snapshotForm(form)
}

function snapshotForm(value: typeof form) {
  return JSON.stringify({
    date: value.date,
    done_text: value.done_text,
    feeling_text: value.feeling_text,
    mood: value.mood
  })
}

async function submit() {
  loading.value = true
  try {
    await $fetch('/api/checkins', { method: 'POST', body: form })
    toast.add({ title: '已保存', description: '今天的状态被记录下来了。', color: 'success' })
    hasSavedCheckin.value = true
    savedSnapshot.value = snapshotForm(form)
    emit('saved')
  } catch (error: any) {
    toast.add({ title: '保存失败', description: error?.statusMessage || '请稍后再试', color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>
