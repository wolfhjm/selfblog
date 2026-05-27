export default defineEventHandler((event) => {
  const user = requireUser(event)
  return getDb().prepare(`
    SELECT * FROM checkins
    WHERE user_id = ?
    ORDER BY date DESC
    LIMIT 30
  `).all(user.id)
})
