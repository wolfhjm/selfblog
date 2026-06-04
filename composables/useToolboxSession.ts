import { toolboxCategories } from '~/constants/toolbox'
import { emptyPaginatedResponse, type PaginatedResponse } from '~/types/pagination'
import type { ToolboxCategory, ToolboxLog, ToolboxPracticeDraft, ToolboxTool } from '~/types/toolbox'
import {
  readableToolboxError,
  toolboxConversationPrompt,
  toolboxExperimentPayload,
  toolboxLogPayload
} from '~/utils/toolbox'

export async function useToolboxSession() {
  const toast = useToast()
  const categories = toolboxCategories
  const logPage = ref(1)
  const logPageSize = 5
  const { data: logData, refresh: refreshLogs } = await useFetch<PaginatedResponse<ToolboxLog>>('/api/toolbox-logs', {
    query: { page: logPage, pageSize: logPageSize },
    default: () => emptyPaginatedResponse<ToolboxLog>(logPageSize)
  })

  const selectedCategoryId = ref(categories[0]?.id || '')
  const selectedToolId = ref(categories[0]?.tools[0]?.id || '')
  const savingLog = ref(false)
  const startingConversation = ref(false)
  const creatingExperiment = ref(false)
  const practice = reactive<ToolboxPracticeDraft>(emptyPractice())

  const selectedCategory = computed<ToolboxCategory | undefined>(() => categories.find((item) => item.id === selectedCategoryId.value) || categories[0])
  const selectedTool = computed<ToolboxTool | undefined>(() => selectedCategory.value?.tools.find((item) => item.id === selectedToolId.value) || selectedCategory.value?.tools[0])
  const targetSeconds = computed(() => (selectedTool.value?.durationMinutes || 0) * 60)
  const toolboxLogs = computed(() => logData.value?.items || [])
  const timer = useToolboxTimer(targetSeconds)

  function selectCategory(categoryId: string) {
    selectedCategoryId.value = categoryId
    const category = categories.find((item) => item.id === categoryId)
    selectedToolId.value = category?.tools[0]?.id || ''
    resetPractice()
  }

  function selectTool(toolId: string) {
    selectedToolId.value = toolId
    resetPractice()
  }

  function updatePractice(value: ToolboxPracticeDraft) {
    Object.assign(practice, value)
  }

  function resetPractice() {
    timer.resetTimer()
    Object.assign(practice, emptyPractice())
  }

  async function saveLog() {
    if (!selectedCategory.value || !selectedTool.value) return
    savingLog.value = true
    try {
      await $fetch('/api/toolbox-logs', {
        method: 'POST',
        body: toolboxLogPayload(selectedCategory.value, selectedTool.value, practice, timer.elapsedSeconds.value)
      })
      logPage.value = 1
      await refreshLogs()
      toast.add({ title: '工具箱记录已保存', color: 'success' })
    } catch (err: any) {
      toast.add({ title: '保存失败', description: readableToolboxError(err, '请稍后再试'), color: 'error' })
    } finally {
      savingLog.value = false
    }
  }

  async function startToolConversation() {
    if (!selectedCategory.value || !selectedTool.value) return
    startingConversation.value = true
    try {
      const result = await $fetch<any>('/api/conversations', {
        method: 'POST',
        body: {
          title: `${selectedTool.value.title} 复盘`,
          mode: 'structured',
          message: toolboxConversationPrompt(selectedCategory.value, selectedTool.value, practice, timer.elapsedSeconds.value)
        }
      })
      if (result.error) {
        toast.add({ title: '对话已创建，AI 暂时没有回复', description: result.error, color: 'warning' })
      }
      await navigateTo(`/explore?conversation=${result.conversationId}`)
    } catch (err: any) {
      toast.add({ title: '创建对话失败', description: readableToolboxError(err, '请稍后再试'), color: 'error' })
    } finally {
      startingConversation.value = false
    }
  }

  async function createExperiment() {
    if (!selectedTool.value) return
    creatingExperiment.value = true
    try {
      await $fetch('/api/experiments', {
        method: 'POST',
        body: toolboxExperimentPayload(selectedTool.value, practice, timer.elapsedSeconds.value)
      })
      toast.add({ title: '已转成实验草稿', color: 'success' })
      await navigateTo('/experiments')
    } catch (err: any) {
      toast.add({ title: '创建实验失败', description: readableToolboxError(err, '请稍后再试'), color: 'error' })
    } finally {
      creatingExperiment.value = false
    }
  }

  return {
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
    isRunning: timer.isRunning,
    timerLabel: timer.timerLabel,
    timerDisplay: timer.timerDisplay,
    selectCategory,
    selectTool,
    updatePractice,
    toggleTimer: timer.toggleTimer,
    resetTimer: timer.resetTimer,
    saveLog,
    startToolConversation,
    createExperiment
  }
}

function emptyPractice(): ToolboxPracticeDraft {
  return {
    intensityBefore: 5,
    intensityAfter: 3,
    context: '',
    reflection: '',
    nextStep: ''
  }
}
