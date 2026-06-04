import { z } from 'zod'

const schema = z.object({
  log_id: z.number().int().positive().nullable().optional()
})

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const id = Number(getRouterParam(event, 'id'))
  const body = schema.parse(await readBody(event).catch(() => ({})))
  const db = getDb()
  const experiment = db.prepare(`
    SELECT * FROM experiments
    WHERE id = ? AND user_id = ?
  `).get(id, user.id) as any

  if (!experiment) {
    throw createError({ statusCode: 404, statusMessage: '没有找到这个实验' })
  }

  const logs = db.prepare(`
    SELECT * FROM experiment_logs
    WHERE user_id = ? AND experiment_id = ?
    ORDER BY log_date ASC, created_at ASC
  `).all(user.id, id)
  const selectedLog = body.log_id
    ? db.prepare('SELECT * FROM experiment_logs WHERE id = ? AND user_id = ? AND experiment_id = ?').get(body.log_id, user.id, id)
    : null
  const message = buildExperimentReviewMessage(experiment, logs, selectedLog)
  const title = `${experiment.title} 实验复盘`
  const mode = 'structured'
  const result = db.prepare('INSERT INTO conversations (user_id, title, mode) VALUES (?, ?, ?)').run(user.id, title, mode)
  const conversationId = Number(result.lastInsertRowid)
  db.prepare('INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)').run(conversationId, 'user', message)

  try {
    const reply = await callAi(withConversationPrompt([{ role: 'user', content: message }], mode), { userId: user.id })
    db.prepare('INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)').run(conversationId, 'assistant', reply)
    return { conversationId, reply }
  } catch (error: any) {
    return {
      conversationId,
      reply: '',
      error: error?.message || error?.statusMessage || 'AI 对话失败'
    }
  }
})

function buildExperimentReviewMessage(experiment: any, logs: any[], selectedLog: any) {
  return [
    '我想基于这个实验做一次复盘和思考。',
    '',
    `实验：${experiment.title}`,
    `描述：${experiment.description || '未写'}`,
    `目标行为：${experiment.target_behavior || '未写'}`,
    `动机：${experiment.motivation || '未写'}`,
    `能力/难度：${experiment.ability || '未写'}`,
    `提示：${experiment.prompt || '未写'}`,
    `更小版本：${experiment.tiny_version || '未写'}`,
    `完成标准：${experiment.success_criterion || '未写'}`,
    `当前完成度：${experiment.completion_score || 0}%`,
    `实际行动：${experiment.actual_behavior || '未写'}`,
    `复盘：${experiment.reflection || '未写'}`,
    `学到：${experiment.learning || '未写'}`,
    `阻碍：${experiment.barrier || '未写'}`,
    '',
    selectedLog ? [
      '我特别想复盘这个阶段记录：',
      `日期：${selectedLog.log_date}`,
      `阶段：${selectedLog.stage_title || '未命名阶段'}`,
      `完成度：${selectedLog.completion_score || 0}%`,
      `实际行动：${selectedLog.actual_behavior || '未写'}`,
      `观察：${selectedLog.observation || '未写'}`,
      `阻碍：${selectedLog.barrier || '未写'}`,
      `学到：${selectedLog.learning || '未写'}`,
      `下一步：${selectedLog.next_step || '未写'}`
    ].join('\n') : '',
    logs.length ? [
      '历史阶段记录：',
      ...logs.map((log) => `- ${log.log_date} ${log.stage_title || '阶段'}：${log.completion_score || 0}%；行动：${log.actual_behavior || '未写'}；学到：${log.learning || '未写'}`)
    ].join('\n') : '还没有阶段记录。',
    '',
    '请用结构追问帮我复盘：先判断这个实验现在处于什么阶段，再围绕实际行为、阻碍、MAP 缺口、隐藏需求或恐惧、下一步最小动作，一次只问一个关键问题。'
  ].filter(Boolean).join('\n')
}
