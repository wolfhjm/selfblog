export default defineEventHandler((event) => {
  const user = requireUser(event)
  return getDb().prepare(`
    SELECT * FROM journal_summaries
    WHERE user_id = ?
    ORDER BY date DESC, created_at DESC
    LIMIT 30
  `).all(user.id)
})
