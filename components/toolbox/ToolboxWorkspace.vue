<template>
  <SectionCard v-if="category && tool">
    <template #title>
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <UBadge color="primary" variant="soft">{{ category.title }}</UBadge>
          <UBadge color="neutral" variant="soft">{{ tool.typeLabel }}</UBadge>
          <UBadge v-if="tool.durationMinutes" color="neutral" variant="outline">约 {{ tool.durationMinutes }} 分钟</UBadge>
          <UBadge v-else color="neutral" variant="outline">用时不限</UBadge>
        </div>
        <h2 class="mt-2 text-xl font-semibold text-slate-950">{{ tool.title }}</h2>
        <p class="mt-1 text-sm leading-6 text-slate-500">{{ tool.subtitle }}</p>
      </div>
    </template>

    <div class="mb-4 grid gap-2 md:grid-cols-2">
      <button
        v-for="item in category.tools"
        :key="item.id"
        class="rounded-lg border p-3 text-left transition"
        :class="item.id === selectedToolId ? 'border-teal-300 bg-teal-50' : 'border-slate-100 bg-white hover:border-slate-300'"
        @click="$emit('selectTool', item.id)"
      >
        <div class="flex items-start justify-between gap-2">
          <span class="font-medium text-slate-950">{{ item.title }}</span>
          <UBadge color="neutral" variant="soft">{{ item.typeLabel }}</UBadge>
        </div>
        <p class="mt-1 text-xs leading-5 text-slate-500">{{ item.subtitle }}</p>
      </button>
    </div>

    <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
      <div class="rounded-lg border border-slate-100 bg-white p-4">
        <div class="flex flex-wrap gap-2">
          <UBadge v-for="tag in tool.tags" :key="tag" color="neutral" variant="soft">{{ tag }}</UBadge>
        </div>
        <p v-if="tool.preparation" class="mt-3 rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-600">
          准备：{{ tool.preparation }}
        </p>
        <ol class="mt-4 space-y-3">
          <li v-for="(step, index) in tool.steps" :key="step" class="grid grid-cols-[2rem_minmax(0,1fr)] gap-3">
            <span class="flex size-8 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">{{ index + 1 }}</span>
            <p class="pt-1 text-sm leading-6 text-slate-700">{{ step }}</p>
          </li>
        </ol>
        <UAlert
          v-if="tool.caution"
          class="mt-4"
          color="warning"
          variant="soft"
          icon="i-lucide-circle-alert"
          :title="tool.caution"
        />
      </div>

      <ToolboxTimer
        :label="timerLabel"
        :display="timerDisplay"
        :is-running="isRunning"
        :intensity-before="draft.intensityBefore"
        :intensity-after="draft.intensityAfter"
        @toggle="$emit('toggleTimer')"
        @reset="$emit('resetTimer')"
        @update:intensity-before="updateDraft('intensityBefore', $event)"
        @update:intensity-after="updateDraft('intensityAfter', $event)"
      />
    </div>

    <ToolboxPracticeForm
      :draft="draft"
      :saving="saving"
      :starting-conversation="startingConversation"
      :creating-experiment="creatingExperiment"
      @update:draft="$emit('update:draft', $event)"
      @save="$emit('saveLog')"
      @start-conversation="$emit('startConversation')"
      @create-experiment="$emit('createExperiment')"
    />
  </SectionCard>
</template>

<script setup lang="ts">
import type { ToolboxCategory, ToolboxPracticeDraft, ToolboxTool } from '~/types/toolbox'
import ToolboxPracticeForm from './ToolboxPracticeForm.vue'
import ToolboxTimer from './ToolboxTimer.vue'

type IntensityPracticeKey = 'intensityBefore' | 'intensityAfter'

const props = defineProps<{
  category: ToolboxCategory | undefined
  tool: ToolboxTool | undefined
  selectedToolId: string
  draft: ToolboxPracticeDraft
  timerLabel: string
  timerDisplay: string
  isRunning: boolean
  saving: boolean
  startingConversation: boolean
  creatingExperiment: boolean
}>()

const emit = defineEmits<{
  selectTool: [toolId: string]
  toggleTimer: []
  resetTimer: []
  'update:draft': [draft: ToolboxPracticeDraft]
  saveLog: []
  startConversation: []
  createExperiment: []
}>()

function updateDraft(key: IntensityPracticeKey, value: number) {
  emit('update:draft', { ...props.draft, [key]: value })
}
</script>
