export default defineEventHandler((event) => {
  const user = requireUser(event)
  const id = Number(getRouterParam(event, 'id'))
  const db = getDb()
  const conversation = db.prepare('SELECT * FROM conversations WHERE id = ? AND user_id = ?').get(id, user.id)
  if (!conversation) {
    throw createError({ statusCode: 404, statusMessage: '没有找到这段对话' })
  }
  const messages = db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC, id ASC').all(id)
  return { conversation, messages }
})
