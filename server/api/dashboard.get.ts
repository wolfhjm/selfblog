export default defineEventHandler((event) => {
  const user = requireUser(event)
  const db = getDb()
  const today = new Date().toISOString().slice(0, 10)

  const checkin = db.prepare('SELECT * FROM checkins WHERE user_id = ? AND date = ?').get(user.id, today)
  const currentExperiment = db.prepare(`
    SELECT * FROM experiments
    WHERE user_id = ? AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1
  `).get(user.id)
  const insights = db.prepare(`
    SELECT * FROM insights
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 5
  `).all(user.id)
  const principles = db.prepare('SELECT COUNT(*) as count FROM principles WHERE user_id = ?').get(user.id)
  const experiments = db.prepare('SELECT COUNT(*) as count FROM experiments WHERE user_id = ?').get(user.id)

  return { today, checkin, currentExperiment, insights, stats: { principles, experiments } }
})
