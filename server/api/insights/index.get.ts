export default defineEventHandler((event) => {
  const user = requireUser(event)
  const pagination = getPagination(event, { defaultPageSize: 50 })
  const db = getDb()
  const total = (db.prepare(`
    SELECT COUNT(*) AS count FROM insights
    WHERE user_id = ?
  `).get(user.id) as { count: number }).count
  const items = db.prepare(`
    SELECT * FROM insights
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(user.id, pagination.pageSize, pagination.offset)

  return paginatedResult(items, total, pagination)
})
