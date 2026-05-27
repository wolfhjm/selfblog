export default defineEventHandler(async () => {
  const summary = getAiRuntimeSummary()
  const reply = await callAi([
    {
      role: 'user',
      content: '请只回复 OK，用于测试 API 连通性。'
    }
  ], { temperature: 0 })

  return {
    ok: true,
    config: summary,
    reply
  }
})
