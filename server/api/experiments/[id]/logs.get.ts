export default defineEventHandler((event) => {
  const user = requireUser(event)
  const id = Number(getRouterParam(event, 'id'))
  const db = getDb()
  const experiment = db.prepare('SELECT id FROM experiments WHERE id = ? AND user_id = ?').get(id, user.id)
  if (!experiment) {
    throw createError({ statusCode: 404, statusMessage: '没有找到这个实验' })
  }

  return db.prepare(`
    SELECT * FROM experiment_logs
    WHERE user_id = ? AND experiment_id = ?
    ORDER BY log_date DESC, created_at DESC
  `).all(user.id, id)
})
