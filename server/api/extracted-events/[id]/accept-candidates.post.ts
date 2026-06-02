export default defineEventHandler((event) => {
  const user = requireUser(event)
  const id = Number(getRouterParam(event, 'id'))
  const db = getDb()
  const eventRow = db.prepare(`
    SELECT * FROM extracted_events
    WHERE id = ? AND user_id = ?
  `).get(id, user.id)

  if (!eventRow) {
    throw createError({ statusCode: 404, statusMessage: '没有找到这个事件' })
  }

  const ids = db.prepare(`
    SELECT id FROM candidates
    WHERE extracted_event_id = ? AND user_id = ? AND status = 'pending'
    ORDER BY created_at ASC
  `).all(id, user.id) as Array<{ id: number }>

  const transaction = db.transaction(() => ids.map((item) => acceptCandidateById(db, user.id, item.id)))
  const accepted = transaction()

  return { count: accepted.length, accepted }
})
