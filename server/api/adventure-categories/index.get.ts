export default defineEventHandler((event) => {
  const user = requireUser(event)
  return getDb().prepare(`
    SELECT * FROM adventure_categories
    WHERE user_id = ? AND status = 'active'
    ORDER BY sort_order ASC, created_at ASC
  `).all(user.id)
})
