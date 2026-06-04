import { z } from 'zod'

const schema = z.object({
  conversation_id: z.number()
})

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const body = schema.parse(await readBody(event))
  const db = getDb()
  const conversation = db.prepare('SELECT * FROM conversations WHERE id = ? AND user_id = ?').get(body.conversation_id, user.id)
  if (!conversation) {
    throw createError({ statusCode: 404, statusMessage: '没有找到这段对话' })
  }

  const messages = db.prepare('SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY id ASC').all(body.conversation_id) as any[]
  const transcript = messages.map((message) => `${message.role}: ${message.content}`).join('\n')
  try {
    const content = await callAi([
      {
        role: 'system',
        content: '你是个人成长 OS 的洞察提炼助手。请从对话中提炼 1 条可行动、可保存的中文洞察。只输出洞察本身，不要编号，不要解释。'
      },
      { role: 'user', content: transcript }
    ], { temperature: 0.3, userId: user.id })

    return { content: content.trim(), source_conversation_id: body.conversation_id, fallback: false }
  } catch (error: any) {
    return {
      content: fallbackInsight(messages),
      source_conversation_id: body.conversation_id,
      fallback: true,
      error: String(error?.message || error?.statusMessage || 'AI 提炼失败').replace(/\s+/g, ' ').slice(0, 180)
    }
  }
})

function fallbackInsight(messages: any[]) {
  const userMessages = messages.filter((message) => message.role === 'user').map((message) => message.content)
  const latest = userMessages.at(-1) || userMessages.join('\n').slice(0, 180) || '这段对话'
  return [
    '这条洞察由本地兜底生成，请先编辑再保存：',
    `我可能需要从「${latest.slice(0, 80)}」里继续确认：具体事件是什么、我当时怎么解释、情绪和身体反应是什么，以及这个反应背后真正想保护的需求是什么。`
  ].join('\n')
}
