export default defineEventHandler((event) => {
  const user = requireUser(event)
  const query = getQuery(event)
  const status = typeof query.status === 'string' ? query.status : 'pending'
  const type = typeof query.type === 'string' ? query.type : ''
  const db = getDb()
  const pagination = getPagination(event)

  if (type) {
    const total = (db.prepare(`
      SELECT COUNT(*) AS count FROM candidates
      WHERE user_id = ? AND status = ? AND candidate_type = ?
    `).get(user.id, status, type) as { count: number }).count
    const items = db.prepare(`
      SELECT
        candidates.*,
        event_chains.title AS event_chain_title,
        event_chains.summary AS event_chain_summary,
        extracted_events.title AS event_title,
        extracted_events.sort_order AS event_sort_order
      FROM candidates
      LEFT JOIN event_chains ON event_chains.id = candidates.event_chain_id
      LEFT JOIN extracted_events ON extracted_events.id = candidates.extracted_event_id
      WHERE candidates.user_id = ? AND candidates.status = ? AND candidates.candidate_type = ?
      ORDER BY candidates.updated_at DESC, candidates.created_at DESC
      LIMIT ? OFFSET ?
    `).all(user.id, status, type, pagination.pageSize, pagination.offset)

    return paginatedResult(items, total, pagination)
  }

  const total = (db.prepare(`
    SELECT COUNT(*) AS count FROM candidates
    WHERE user_id = ? AND status = ?
  `).get(user.id, status) as { count: number }).count
  const items = db.prepare(`
    SELECT
      candidates.*,
      event_chains.title AS event_chain_title,
      event_chains.summary AS event_chain_summary,
      extracted_events.title AS event_title,
      extracted_events.sort_order AS event_sort_order
    FROM candidates
    LEFT JOIN event_chains ON event_chains.id = candidates.event_chain_id
    LEFT JOIN extracted_events ON extracted_events.id = candidates.extracted_event_id
    WHERE candidates.user_id = ? AND candidates.status = ?
    ORDER BY candidates.updated_at DESC, candidates.created_at DESC
    LIMIT ? OFFSET ?
  `).all(user.id, status, pagination.pageSize, pagination.offset)

  return paginatedResult(items, total, pagination)
})
