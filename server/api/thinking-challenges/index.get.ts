export default defineEventHandler((event) => {
  const user = requireUser(event)
  const query = getQuery(event)
  const world = typeof query.world === 'string' ? query.world : ''
  const status = typeof query.status === 'string' ? query.status : 'active'
  const db = getDb()
  const pagination = getPagination(event, { defaultPageSize: 12, maxPageSize: 50 })

  const filters = ['thinking_challenges.user_id = ?']
  const params: Array<string | number> = [user.id]

  if (world && world !== 'all') {
    filters.push('thinking_challenges.world_type = ?')
    params.push(world)
  }

  if (status && status !== 'all') {
    filters.push('thinking_challenges.status = ?')
    params.push(status)
  }

  const where = filters.join(' AND ')
  const total = (db.prepare(`
    SELECT COUNT(*) AS count
    FROM thinking_challenges
    WHERE ${where}
  `).get(...params) as { count: number }).count

  const items = db.prepare(`
    SELECT
      thinking_challenges.*,
      COUNT(thinking_attempts.id) AS attempt_count,
      COALESCE(SUM(thinking_attempts.is_correct), 0) AS correct_count,
      MAX(thinking_attempts.created_at) AS last_attempt_at
    FROM thinking_challenges
    LEFT JOIN thinking_attempts
      ON thinking_attempts.challenge_id = thinking_challenges.id
      AND thinking_attempts.user_id = thinking_challenges.user_id
    WHERE ${where}
    GROUP BY thinking_challenges.id
    ORDER BY thinking_challenges.updated_at DESC, thinking_challenges.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, pagination.pageSize, pagination.offset)

  return paginatedResult(items, total, pagination)
})
