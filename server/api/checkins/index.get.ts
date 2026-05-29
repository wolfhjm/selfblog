export default defineEventHandler((event) => {
  const user = requireUser(event)
  const pagination = getPagination(event)
  const db = getDb()
  const total = (db.prepare(`
    SELECT COUNT(*) AS count FROM checkins
    WHERE user_id = ?
  `).get(user.id) as { count: number }).count
  const items = db.prepare(`
    SELECT * FROM checkins
    WHERE user_id = ?
    ORDER BY date DESC
    LIMIT ? OFFSET ?
  `).all(user.id, pagination.pageSize, pagination.offset)

  return paginatedResult(items, total, pagination)
})
