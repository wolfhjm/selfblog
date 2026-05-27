export default defineEventHandler((event) => {
  const user = getCurrentUser(event)
  const visibility = getQuery(event).visibility
  const db = getDb()

  if (visibility === 'public' || !user) {
    return db.prepare(`
      SELECT * FROM experiments
      WHERE visibility = 'public'
      ORDER BY created_at DESC
    `).all()
  }

  return db.prepare(`
    SELECT * FROM experiments
    WHERE user_id = ?
    ORDER BY status = 'active' DESC, created_at DESC
  `).all(user.id)
})
