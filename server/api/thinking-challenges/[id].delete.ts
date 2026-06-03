export default defineEventHandler((event) => {
  const user = requireUser(event)
  const id = Number(getRouterParam(event, 'id'))
  const result = getDb().prepare('DELETE FROM thinking_challenges WHERE id = ? AND user_id = ?').run(id, user.id)
  if (!result.changes) {
    throw createError({ statusCode: 404, statusMessage: '没有找到这道思维挑战' })
  }
  return { ok: true }
})
