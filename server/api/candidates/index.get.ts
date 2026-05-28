export default defineEventHandler((event) => {
  const user = requireUser(event)
  const query = getQuery(event)
  const status = typeof query.status === 'string' ? query.status : 'pending'
  const type = typeof query.type === 'string' ? query.type : ''
  const db = getDb()

  if (type) {
    return db.prepare(`
      SELECT * FROM candidates
      WHERE user_id = ? AND status = ? AND candidate_type = ?
      ORDER BY updated_at DESC, created_at DESC
    `).all(user.id, status, type)
  }

  return db.prepare(`
    SELECT * FROM candidates
    WHERE user_id = ? AND status = ?
    ORDER BY updated_at DESC, created_at DESC
  `).all(user.id, status)
})
