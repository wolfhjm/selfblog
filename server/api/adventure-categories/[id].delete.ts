export default defineEventHandler((event) => {
  const user = requireUser(event)
  const id = Number(getRouterParam(event, 'id'))
  getDb().prepare(`
    UPDATE adventure_categories SET
      status = 'archived',
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `).run(id, user.id)
  return { ok: true }
})
