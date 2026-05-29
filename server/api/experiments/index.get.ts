export default defineEventHandler((event) => {
  const user = getCurrentUser(event)
  const visibility = getQuery(event).visibility
  const pagination = getPagination(event)
  const db = getDb()

  if (visibility === 'public' || !user) {
    const total = (db.prepare(`
      SELECT COUNT(*) AS count FROM experiments
      WHERE visibility = 'public'
    `).get() as { count: number }).count
    const items = db.prepare(`
      SELECT * FROM experiments
      WHERE visibility = 'public'
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(pagination.pageSize, pagination.offset)

    return paginatedResult(items, total, pagination)
  }

  const total = (db.prepare(`
    SELECT COUNT(*) AS count FROM experiments
    WHERE user_id = ?
  `).get(user.id) as { count: number }).count
  const items = db.prepare(`
    SELECT * FROM experiments
    WHERE user_id = ?
    ORDER BY status = 'active' DESC, created_at DESC
    LIMIT ? OFFSET ?
  `).all(user.id, pagination.pageSize, pagination.offset)

  return paginatedResult(items, total, pagination)
})
