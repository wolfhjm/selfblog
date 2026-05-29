export default defineEventHandler((event) => {
  const user = getCurrentUser(event)
  const visibility = getQuery(event).visibility
  const pagination = getPagination(event)
  const db = getDb()

  if (visibility === 'public' || !user) {
    const total = (db.prepare(`
      SELECT COUNT(*) AS count FROM principles
      WHERE visibility = 'public'
    `).get() as { count: number }).count
    const items = db.prepare(`
      SELECT * FROM principles
      WHERE visibility = 'public'
      ORDER BY category, created_at DESC
      LIMIT ? OFFSET ?
    `).all(pagination.pageSize, pagination.offset)

    return paginatedResult(items, total, pagination)
  }

  const total = (db.prepare(`
    SELECT COUNT(*) AS count FROM principles
    WHERE user_id = ?
  `).get(user.id) as { count: number }).count
  const items = db.prepare(`
    SELECT * FROM principles
    WHERE user_id = ?
    ORDER BY category, updated_at DESC
    LIMIT ? OFFSET ?
  `).all(user.id, pagination.pageSize, pagination.offset)

  return paginatedResult(items, total, pagination)
})
