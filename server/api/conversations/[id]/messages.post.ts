import { z } from 'zod'

const schema = z.object({
  message: z.string().min(1),
  retry_last: z.boolean().optional()
})

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const id = Number(getRouterParam(event, 'id'))
  const body = schema.parse(await readBody(event))
  const db = getDb()
  const conversation = db.prepare('SELECT * FROM conversations WHERE id = ? AND user_id = ?').get(id, user.id) as { mode?: string } | undefined
  if (!conversation) {
    throw createError({ statusCode: 404, statusMessage: '没有找到这段对话' })
  }

  if (body.retry_last) {
    const recentMessages = db.prepare('SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY id DESC LIMIT 2').all(id) as any[]
    const lastMessage = recentMessages[0]
    const previousMessage = recentMessages[1]

    if (lastMessage?.role === 'assistant' && previousMessage?.role === 'user' && previousMessage.content === body.message) {
      return { reply: lastMessage.content, replayed: true }
    }

    if (!lastMessage || lastMessage.role !== 'user' || lastMessage.content !== body.message) {
      db.prepare('INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)').run(id, 'user', body.message)
    }
  } else {
    db.prepare('INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)').run(id, 'user', body.message)
  }

  const storedMessages = db.prepare('SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY id ASC').all(id) as any[]
  try {
    const reply = await callAi(withConversationPrompt(
      storedMessages.map((item) => ({ role: item.role, content: item.content })),
      conversation.mode
    ))
    db.prepare('INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)').run(id, 'assistant', reply)
    return { reply }
  } catch (error: any) {
    return {
      reply: '',
      error: error?.message || error?.statusMessage || 'AI 对话失败'
    }
  }
})
