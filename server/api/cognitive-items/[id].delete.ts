export default defineEventHandler((event) => {
  const user = requireUser(event)
  const id = Number(getRouterParam(event, 'id'))
  const db = getDb()

  const item = db.prepare('SELECT item_type FROM cognitive_items WHERE id = ? AND user_id = ?').get(id, user.id) as { item_type: string } | undefined
  if (!item) {
    throw createError({ statusCode: 404, statusMessage: '没有找到这个认知对象' })
  }

  const transaction = db.transaction(() => {
    db.prepare(`
      DELETE FROM object_links
      WHERE user_id = ?
        AND (
          (source_type = ? AND source_id = ?)
          OR (target_type = ? AND target_id = ?)
        )
    `).run(user.id, item.item_type, id, item.item_type, id)
    db.prepare('DELETE FROM cognitive_items WHERE id = ? AND user_id = ?').run(id, user.id)
  })

  transaction()
  return { ok: true }
})
