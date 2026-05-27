export default defineEventHandler((event) => {
  const user = getCurrentUser(event)
  const visibility = getQuery(event).visibility
  const db = getDb()

  if (visibility === 'public' || !user) {
    return db.prepare(`
      SELECT * FROM principles
      WHERE visibility = 'public'
      ORDER BY category, created_at DESC
    `).all()
  }

  return db.prepare(`
    SELECT * FROM principles
    WHERE user_id = ?
    ORDER BY category, updated_at DESC
  `).all(user.id)
})
