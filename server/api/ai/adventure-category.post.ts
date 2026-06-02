export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const db = getDb()
  const existing = db.prepare(`
    SELECT title, description, prompt_hint
    FROM adventure_categories
    WHERE user_id = ? AND status = 'active'
    ORDER BY sort_order ASC
  `).all(user.id)
  const checkins = db.prepare(`
    SELECT date, done_text, feeling_text, mood
    FROM checkins
    WHERE user_id = ?
    ORDER BY date DESC
    LIMIT 7
  `).all(user.id)

  try {
    const raw = await callAi([
      {
        role: 'system',
        content: [
          '你是个人成长 OS 的随机实验类别设计助手。请推荐一个新的随机实验类别。',
          '类别要安全、低成本、可在 30 分钟内生成具体实验，并能帮助用户尝试新事物或训练能力。',
          '不要重复已有类别。只输出 JSON 对象，不要 Markdown。',
          '字段：title、description、prompt_hint、sort_order。title 不超过 12 个中文字，description 不超过 80 字，prompt_hint 是给 AI 生成实验时用的提示词。'
        ].join('\n')
      },
      { role: 'user', content: JSON.stringify({ existing, recentCheckins: checkins }, null, 2) }
    ], { temperature: 0.8 })
    const parsed = JSON.parse(raw)
    return normalizeCategoryDraft(parsed)
  } catch {
    return {
      title: '注意力换挡',
      description: '用一个小动作切换注意力，观察自己从惯性中醒来的过程。',
      prompt_hint: '生成一个注意力换挡实验，动作要轻、安全、可在 5-20 分钟内完成，重点是观察注意力从自动驾驶切换到主动选择。',
      sort_order: 100
    }
  }
})

function normalizeCategoryDraft(value: any) {
  return {
    title: String(value.title || '新类别').slice(0, 40),
    description: String(value.description || '').slice(0, 240),
    prompt_hint: String(value.prompt_hint || '').slice(0, 500),
    sort_order: Number.isFinite(Number(value.sort_order)) ? Number(value.sort_order) : 100
  }
}
