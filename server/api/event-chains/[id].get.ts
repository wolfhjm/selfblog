export default defineEventHandler((event) => {
  const user = requireUser(event)
  const id = Number(getRouterParam(event, 'id'))
  const db = getDb()
  const chain = db.prepare(`
    SELECT * FROM event_chains
    WHERE id = ? AND user_id = ?
  `).get(id, user.id)

  if (!chain) {
    throw createError({ statusCode: 404, statusMessage: '没有找到这条事件链' })
  }

  const events = db.prepare(`
    SELECT * FROM extracted_events
    WHERE event_chain_id = ? AND user_id = ?
    ORDER BY sort_order ASC, id ASC
  `).all(id, user.id)

  const candidates = db.prepare(`
    SELECT * FROM candidates
    WHERE event_chain_id = ? AND user_id = ?
    ORDER BY extracted_event_id ASC, created_at ASC
  `).all(id, user.id)

  return { chain, events, candidates }
})
