export default defineEventHandler((event) => {
  const user = requireUser(event)
  const query = getQuery(event)
  const status = typeof query.status === 'string' ? query.status : 'pending'
  const type = typeof query.type === 'string' ? query.type : ''
  const db = getDb()
  const pagination = getPagination(event)

  if (type) {
    const total = (db.prepare(`
      SELECT COUNT(*) AS count FROM candidates
      WHERE user_id = ? AND status = ? AND candidate_type = ?
    `).get(user.id, status, type) as { count: number }).count
    const items = db.prepare(`
      SELECT * FROM candidates
      WHERE user_id = ? AND status = ? AND candidate_type = ?
      ORDER BY updated_at DESC, created_at DESC
      LIMIT ? OFFSET ?
    `).all(user.id, status, type, pagination.pageSize, pagination.offset)

    return paginatedResult(items, total, pagination)
  }

  const total = (db.prepare(`
    SELECT COUNT(*) AS count FROM candidates
    WHERE user_id = ? AND status = ?
  `).get(user.id, status) as { count: number }).count
  const items = db.prepare(`
    SELECT * FROM candidates
    WHERE user_id = ? AND status = ?
    ORDER BY updated_at DESC, created_at DESC
    LIMIT ? OFFSET ?
  `).all(user.id, status, pagination.pageSize, pagination.offset)

  return paginatedResult(items, total, pagination)
})
