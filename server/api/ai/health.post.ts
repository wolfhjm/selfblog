export default defineEventHandler(async (event) => {
  const user = getCurrentUser(event)
  const summary = getAiRuntimeSummary(user?.id)
  try {
    const reply = await callAi([
      {
        role: 'user',
        content: '请只回复 OK，用于测试 API 连通性。'
      }
    ], { temperature: 0, userId: user?.id })

    return {
      ok: true,
      config: summary,
      reply
    }
  } catch (error: any) {
    return {
      ok: false,
      config: summary,
      error: error?.message || error?.statusMessage || 'AI 连通性检查失败'
    }
  }
})
