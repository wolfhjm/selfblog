<template>
  <form class="mt-4 space-y-4" @submit.prevent="$emit('save')">
    <div class="grid gap-3 md:grid-cols-2">
      <UFormField label="当时情境">
        <UTextarea
          :model-value="draft.context"
          autoresize
          placeholder="在哪里、刚发生了什么、身体有什么信号？"
          class="w-full"
          @update:model-value="updateDraft('context', String($event || ''))"
        />
      </UFormField>
      <UFormField label="完成后感受">
        <UTextarea
          :model-value="draft.reflection"
          autoresize
          placeholder="状态有什么变化？发现了什么隐藏需求或解释？"
          class="w-full"
          @update:model-value="updateDraft('reflection', String($event || ''))"
        />
      </UFormField>
    </div>
    <UFormField label="下一步">
      <UInput
        :model-value="draft.nextStep"
        placeholder="继续做、缩小一点、换个提示，或带去对话里分析"
        class="w-full"
        @update:model-value="updateDraft('nextStep', String($event || ''))"
      />
    </UFormField>
    <div class="flex flex-wrap gap-2">
      <UButton type="submit" icon="i-lucide-save" :loading="saving">保存本次感受</UButton>
      <UButton type="button" color="neutral" variant="soft" icon="i-lucide-message-circle" :loading="startingConversation" @click="$emit('startConversation')">
        带去探索
      </UButton>
      <UButton type="button" color="neutral" variant="soft" icon="i-lucide-flask-conical" :loading="creatingExperiment" @click="$emit('createExperiment')">
        转成实验
      </UButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { ToolboxPracticeDraft } from '~/types/toolbox'

type TextPracticeKey = 'context' | 'reflection' | 'nextStep'

const props = defineProps<{
  draft: ToolboxPracticeDraft
  saving: boolean
  startingConversation: boolean
  creatingExperiment: boolean
}>()

const emit = defineEmits<{
  'update:draft': [draft: ToolboxPracticeDraft]
  save: []
  startConversation: []
  createExperiment: []
}>()

function updateDraft(key: TextPracticeKey, value: string) {
  emit('update:draft', { ...props.draft, [key]: value })
}
</script>
