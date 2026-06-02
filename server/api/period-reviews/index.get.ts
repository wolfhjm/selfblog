export default defineEventHandler((event) => {
  const user = requireUser(event)
  const pagination = getPagination(event)
  const db = getDb()
  const total = (db.prepare(`
    SELECT COUNT(*) AS count FROM period_reviews
    WHERE user_id = ?
  `).get(user.id) as { count: number }).count
  const items = db.prepare(`
    SELECT * FROM period_reviews
    WHERE user_id = ?
    ORDER BY end_date DESC, created_at DESC
    LIMIT ? OFFSET ?
  `).all(user.id, pagination.pageSize, pagination.offset)

  return paginatedResult(items, total, pagination)
})
