import { z } from 'zod'

const schema = z.object({
  title: z.string().optional(),
  message: z.string().min(1),
  mode: z.enum(['explore', 'structured']).default('explore')
})

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const body = schema.parse(await readBody(event))
  const db = getDb()
  const title = body.title || body.message.slice(0, 24)
  const mode = normalizeConversationMode(body.mode)
  const result = db.prepare('INSERT INTO conversations (user_id, title, mode) VALUES (?, ?, ?)').run(user.id, title, mode)
  const conversationId = Number(result.lastInsertRowid)
  db.prepare('INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)').run(conversationId, 'user', body.message)

  let reply = ''
  try {
    reply = await callAi(withConversationPrompt([{ role: 'user', content: body.message }], mode), { userId: user.id })
    db.prepare('INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)').run(conversationId, 'assistant', reply)
  } catch (error: any) {
    return {
      conversationId,
      reply: '',
      error: error?.message || error?.statusMessage || 'AI 对话失败'
    }
  }

  return { conversationId, reply }
})
