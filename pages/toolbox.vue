<template>
  <div class="workspace-page space-y-4">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-slate-950">暂停工具箱</h1>
        <p class="mt-1 text-sm leading-6 text-slate-500">先让状态降到可观察，再把一次练习沉淀成记录、对话或行动实验。</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <UButton to="/explore" icon="i-lucide-message-circle" color="neutral" variant="soft">自由对话</UButton>
        <UButton to="/experiments" icon="i-lucide-flask-conical" color="neutral" variant="soft">行动实验</UButton>
      </div>
    </div>

    <div class="grid gap-4 xl:grid-cols-[18rem_minmax(0,1fr)_22rem]">
      <ToolboxCategoryList
        :categories="categories"
        :selected-id="selectedCategoryId"
        @select="selectCategory"
      />

      <ToolboxWorkspace
        :category="selectedCategory"
        :tool="selectedTool"
        :selected-tool-id="selectedToolId"
        :draft="practice"
        :timer-label="timerLabel"
        :timer-display="timerDisplay"
        :is-running="isRunning"
        :saving="savingLog"
        :starting-conversation="startingConversation"
        :creating-experiment="creatingExperiment"
        @select-tool="selectTool"
        @toggle-timer="toggleTimer"
        @reset-timer="resetTimer"
        @update:draft="updatePractice"
        @save-log="saveLog"
        @start-conversation="startToolConversation"
        @create-experiment="createExperiment"
      />

      <div class="space-y-4">
        <ToolboxRecentLogs
          v-model:page="logPage"
          :logs="toolboxLogs"
          :page-size="logData?.pageSize || logPageSize"
          :total="logData?.total || 0"
          :page-count="logData?.pageCount || 1"
        />
        <ToolboxObservationGuide />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ToolboxCategoryList from '~/components/toolbox/ToolboxCategoryList.vue'
import ToolboxObservationGuide from '~/components/toolbox/ToolboxObservationGuide.vue'
import ToolboxRecentLogs from '~/components/toolbox/ToolboxRecentLogs.vue'
import ToolboxWorkspace from '~/components/toolbox/ToolboxWorkspace.vue'

const {
  categories,
  logData,
  logPage,
  logPageSize,
  selectedCategory,
  selectedCategoryId,
  selectedTool,
  selectedToolId,
  toolboxLogs,
  practice,
  savingLog,
  startingConversation,
  creatingExperiment,
  isRunning,
  timerLabel,
  timerDisplay,
  selectCategory,
  selectTool,
  updatePractice,
  toggleTimer,
  resetTimer,
  saveLog,
  startToolConversation,
  createExperiment
} = await useToolboxSession()
</script>
