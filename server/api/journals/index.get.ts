export default defineEventHandler((event) => {
  const user = requireUser(event)
  const pagination = getPagination(event)
  const db = getDb()
  const total = (db.prepare(`
    SELECT COUNT(*) AS count FROM journal_summaries
    WHERE user_id = ?
  `).get(user.id) as { count: number }).count
  const items = db.prepare(`
    SELECT * FROM journal_summaries
    WHERE user_id = ?
    ORDER BY date DESC, created_at DESC
    LIMIT ? OFFSET ?
  `).all(user.id, pagination.pageSize, pagination.offset)

  return paginatedResult(items, total, pagination)
})
