export default defineEventHandler((event) => {
  const user = requireUser(event)
  return getDb().prepare(`
    SELECT * FROM insights
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 50
  `).all(user.id)
})
