export default defineEventHandler((event) => {
  const user = requireUser(event)
  const id = Number(getRouterParam(event, 'id'))
  const db = getDb()
  const result = db.prepare('DELETE FROM conversations WHERE id = ? AND user_id = ?').run(id, user.id)

  if (result.changes === 0) {
    throw createError({ statusCode: 404, statusMessage: '没有找到这段对话' })
  }

  return { ok: true }
})
