export default defineEventHandler((event) => {
  const user = requireUser(event)
  const query = getQuery(event)
  const sourceType = typeof query.source_type === 'string' ? query.source_type : ''
  const sourceId = typeof query.source_id === 'string' ? Number(query.source_id) : 0
  const db = getDb()

  if (sourceType && sourceId) {
    return db.prepare(`
      SELECT * FROM object_links
      WHERE user_id = ?
        AND status = 'active'
        AND (
          (source_type = ? AND source_id = ?)
          OR (target_type = ? AND target_id = ?)
        )
      ORDER BY created_at DESC
    `).all(user.id, sourceType, sourceId, sourceType, sourceId)
  }

  return db.prepare(`
    SELECT * FROM object_links
    WHERE user_id = ? AND status = 'active'
    ORDER BY created_at DESC
  `).all(user.id)
})
