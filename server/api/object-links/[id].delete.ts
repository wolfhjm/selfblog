export default defineEventHandler((event) => {
  const user = requireUser(event)
  const id = Number(getRouterParam(event, 'id'))
  getDb().prepare('DELETE FROM object_links WHERE id = ? AND user_id = ?').run(id, user.id)
  return { ok: true }
})
