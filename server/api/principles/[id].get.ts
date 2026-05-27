export default defineEventHandler((event) => {
  const id = Number(getRouterParam(event, 'id'))
  const user = getCurrentUser(event)
  const row = getDb().prepare('SELECT * FROM principles WHERE id = ?').get(id) as any
  if (!row || (row.visibility !== 'public' && row.user_id !== user?.id)) {
    throw createError({ statusCode: 404, statusMessage: '没有找到这条原则' })
  }
  return row
})
