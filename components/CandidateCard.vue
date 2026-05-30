<template>
  <article>
    <div class="flex items-start justify-between gap-3">
      <div>
        <UBadge color="primary" variant="soft">{{ typeLabel(item.candidate_type) }}</UBadge>
        <h3 class="mt-2 text-base font-semibold text-slate-950">{{ item.title }}</h3>
      </div>
      <UBadge color="neutral" variant="soft">{{ sourceLabel(item) }}</UBadge>
    </div>

    <p class="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{{ item.content || '没有补充内容。' }}</p>

    <div v-if="payloadDetails.length" class="mt-3 space-y-2 rounded-lg bg-white p-3">
      <div
        v-for="detail in payloadDetails"
        :key="detail.label"
        class="grid gap-1 text-sm md:grid-cols-[5.5rem_minmax(0,1fr)]"
      >
        <span class="font-medium text-slate-500">{{ detail.label }}</span>
        <span class="whitespace-pre-wrap leading-6 text-slate-700">{{ detail.value }}</span>
      </div>
    </div>

    <div v-if="followUpQuestions.length" class="mt-3 rounded-lg border border-teal-100 bg-teal-50 p-3">
      <p class="text-sm font-medium text-teal-900">可继续追问</p>
      <ul class="mt-2 space-y-1 text-sm leading-6 text-teal-800">
        <li v-for="question in followUpQuestions" :key="question">- {{ question }}</li>
      </ul>
    </div>

    <div class="mt-4 flex flex-wrap gap-2">
      <UButton color="primary" variant="soft" icon="i-lucide-check" :loading="acting" @click="$emit('accept', item)">确认入库</UButton>
      <UButton color="neutral" variant="soft" icon="i-lucide-message-circle" :loading="acting" @click="$emit('analyze', item)">继续分析</UButton>
      <UButton color="neutral" variant="soft" icon="i-lucide-pencil" @click="$emit('edit', item)">编辑</UButton>
      <UButton color="neutral" variant="ghost" icon="i-lucide-trash-2" :loading="acting" @click="$emit('dismiss', item)">丢弃</UButton>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { Candidate } from '~/types/app'

const props = defineProps<{
  item: Candidate
  acting?: boolean
}>()

defineEmits<{
  accept: [item: Candidate]
  analyze: [item: Candidate]
  edit: [item: Candidate]
  dismiss: [item: Candidate]
}>()

const payload = computed(() => parsePayload(props.item.payload))
const payloadDetails = computed(() => [
  { label: '客观环境', value: payload.value.objective_context },
  { label: 'ABC 事件', value: payload.value.activating_event || payload.value.event_detail },
  { label: '事件细节', value: payload.value.event_detail },
  { label: '身体信号', value: payload.value.body_signal },
  { label: '感受', value: payload.value.emotion },
  { label: 'ABC 信念', value: payload.value.belief_or_interpretation || payload.value.interpretation },
  { label: '解释', value: payload.value.interpretation },
  { label: 'ABC 后果', value: payload.value.consequence },
  { label: '支持证据', value: payload.value.evidence_for },
  { label: '反例', value: payload.value.evidence_against },
  { label: '新解释', value: payload.value.reframe },
  { label: '隐藏需求', value: payload.value.hidden_need },
  { label: '隐藏恐惧', value: payload.value.hidden_fear },
  { label: '目标行为', value: payload.value.target_behavior },
  { label: '动机', value: payload.value.motivation },
  { label: '能力', value: payload.value.ability },
  { label: '提示', value: payload.value.prompt },
  { label: '更小版本', value: payload.value.tiny_version },
  { label: '完成标准', value: payload.value.success_criterion },
  { label: '机会', value: payload.value.opportunity },
  { label: '健康背景', value: payload.value.health_context },
  { label: '原文证据', value: payload.value.raw_evidence }
].filter((detail) => String(detail.value || '').trim()))

const followUpQuestions = computed(() => Array.isArray(payload.value.follow_up_questions)
  ? payload.value.follow_up_questions.filter((question: unknown) => String(question || '').trim()).slice(0, 3)
  : [])

function parsePayload(value: string) {
  try {
    return JSON.parse(value || '{}')
  } catch {
    return {}
  }
}

function typeLabel(type: string) {
  return ({ pattern: '规律', case: '小事件', reaction: '感受/反应', lesson: '经验教训', insight: '洞察', experiment: '实验建议' } as Record<string, string>)[type] || type
}

function sourceLabel(item: Candidate) {
  return item.source_type ? `${item.source_type} #${item.source_id || '-'}` : '手动'
}
</script>
