import { formatToolboxDuration } from '~/utils/toolbox'

export function useToolboxTimer(targetSeconds: Ref<number>) {
  const toast = useToast()
  const elapsedSeconds = ref(0)
  const isRunning = ref(false)
  let timer: ReturnType<typeof setInterval> | null = null

  const timerLabel = computed(() => targetSeconds.value ? '剩余时间' : '已用时间')
  const timerDisplay = computed(() => {
    const seconds = targetSeconds.value ? Math.max(targetSeconds.value - elapsedSeconds.value, 0) : elapsedSeconds.value
    return formatToolboxDuration(seconds)
  })

  function toggleTimer() {
    if (isRunning.value) {
      stopTimer()
      return
    }
    isRunning.value = true
    timer = setInterval(() => {
      elapsedSeconds.value += 1
      if (targetSeconds.value && elapsedSeconds.value >= targetSeconds.value) {
        stopTimer()
        toast.add({ title: '练习时间到了', color: 'success' })
      }
    }, 1000)
  }

  function stopTimer() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    isRunning.value = false
  }

  function resetTimer() {
    stopTimer()
    elapsedSeconds.value = 0
  }

  onBeforeUnmount(() => {
    stopTimer()
  })

  return {
    elapsedSeconds,
    isRunning,
    timerLabel,
    timerDisplay,
    toggleTimer,
    resetTimer
  }
}
