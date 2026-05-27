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
  const content = await callAi([
    {
      role: 'system',
      content: '你是个人成长 OS 的洞察提炼助手。请从对话中提炼 1 条可行动、可保存的中文洞察。只输出洞察本身，不要编号，不要解释。'
    },
    { role: 'user', content: transcript }
  ], { temperature: 0.3 })

  return { content: content.trim(), source_conversation_id: body.conversation_id }
})
