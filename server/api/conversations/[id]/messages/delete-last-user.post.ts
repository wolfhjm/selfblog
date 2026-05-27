export default defineEventHandler((event) => {
  const user = requireUser(event)
  const id = Number(getRouterParam(event, 'id'))
  const db = getDb()
  const conversation = db.prepare('SELECT * FROM conversations WHERE id = ? AND user_id = ?').get(id, user.id)
  if (!conversation) {
    throw createError({ statusCode: 404, statusMessage: '没有找到这段对话' })
  }

  const lastMessage = db.prepare('SELECT id, role FROM messages WHERE conversation_id = ? ORDER BY id DESC LIMIT 1').get(id) as any
  if (lastMessage?.role === 'user') {
    db.prepare('DELETE FROM messages WHERE id = ?').run(lastMessage.id)
  }

  return { ok: true }
})
