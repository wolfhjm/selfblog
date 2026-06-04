export default defineEventHandler((event) => {
  const user = requireUser(event)
  const pagination = getPagination(event, { defaultPageSize: 5, maxPageSize: 50 })
  const db = getDb()
  const total = (db.prepare(`
    SELECT COUNT(*) AS count
    FROM toolbox_logs
    WHERE user_id = ?
  `).get(user.id) as { count: number }).count
  const items = db.prepare(`
    SELECT *
    FROM toolbox_logs
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(user.id, pagination.pageSize, pagination.offset)

  return paginatedResult(items, total, pagination)
})
