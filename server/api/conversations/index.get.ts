export default defineEventHandler((event) => {
  const user = requireUser(event)
  return getDb().prepare(`
    SELECT * FROM conversations
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 30
  `).all(user.id)
})
