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

    return paginatedResult(user ? withExperimentLogs(db, items, user.id) : items, total, pagination)
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

  return paginatedResult(withExperimentLogs(db, items, user.id), total, pagination)
})

function withExperimentLogs(db: ReturnType<typeof getDb>, items: any[], userId: number) {
  if (!items.length) return items
  const ids = items.map((item) => item.id)
  const placeholders = ids.map(() => '?').join(',')
  const logs = db.prepare(`
    SELECT *
    FROM experiment_logs
    WHERE user_id = ? AND experiment_id IN (${placeholders})
    ORDER BY log_date DESC, created_at DESC
  `).all(userId, ...ids) as any[]
  const grouped = new Map<number, any[]>()
  for (const log of logs) {
    const current = grouped.get(log.experiment_id) || []
    current.push(log)
    grouped.set(log.experiment_id, current)
  }

  return items.map((item) => {
    const itemLogs = grouped.get(item.id) || []
    return {
      ...item,
      logs: itemLogs.slice(0, 3),
      log_count: itemLogs.length,
      latest_log_date: itemLogs[0]?.log_date || null
    }
  })
}
