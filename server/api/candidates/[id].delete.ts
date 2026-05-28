export default defineEventHandler((event) => {
  const user = requireUser(event)
  const id = Number(getRouterParam(event, 'id'))
  getDb().prepare(`
    UPDATE candidates SET
      status = 'dismissed',
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ? AND status = 'pending'
  `).run(id, user.id)
  return { ok: true }
})
