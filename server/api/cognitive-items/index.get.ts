export default defineEventHandler((event) => {
  const user = requireUser(event)
  const query = getQuery(event)
  const type = typeof query.type === 'string' ? query.type : ''
  const db = getDb()
  const pagination = getPagination(event)

  if (type) {
    const total = (db.prepare(`
      SELECT COUNT(*) AS count FROM cognitive_items
      WHERE user_id = ? AND item_type = ?
    `).get(user.id, type) as { count: number }).count
    const items = db.prepare(`
      SELECT
        cognitive_items.*,
        (
          SELECT COUNT(*)
          FROM object_links
          WHERE object_links.user_id = cognitive_items.user_id
            AND object_links.status = 'active'
            AND (
              (object_links.source_type = cognitive_items.item_type AND object_links.source_id = cognitive_items.id)
              OR (object_links.target_type = cognitive_items.item_type AND object_links.target_id = cognitive_items.id)
            )
        ) AS link_count
      FROM cognitive_items
      WHERE user_id = ? AND item_type = ?
      ORDER BY updated_at DESC, created_at DESC
      LIMIT ? OFFSET ?
    `).all(user.id, type, pagination.pageSize, pagination.offset)

    return paginatedResult(items, total, pagination)
  }

  const total = (db.prepare(`
    SELECT COUNT(*) AS count FROM cognitive_items
    WHERE user_id = ?
  `).get(user.id) as { count: number }).count
  const items = db.prepare(`
    SELECT
      cognitive_items.*,
      (
        SELECT COUNT(*)
        FROM object_links
        WHERE object_links.user_id = cognitive_items.user_id
          AND object_links.status = 'active'
          AND (
            (object_links.source_type = cognitive_items.item_type AND object_links.source_id = cognitive_items.id)
            OR (object_links.target_type = cognitive_items.item_type AND object_links.target_id = cognitive_items.id)
          )
      ) AS link_count
    FROM cognitive_items
    WHERE user_id = ?
    ORDER BY updated_at DESC, created_at DESC
    LIMIT ? OFFSET ?
  `).all(user.id, pagination.pageSize, pagination.offset)

  return paginatedResult(items, total, pagination)
})
