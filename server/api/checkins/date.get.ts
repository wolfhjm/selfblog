export default defineEventHandler((event) => {
  const user = requireUser(event)
  const query = getQuery(event)
  const date = typeof query.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(query.date)
    ? query.date
    : appDateString()

  const checkin = getDb().prepare(`
    SELECT * FROM checkins
    WHERE user_id = ? AND date = ?
  `).get(user.id, date) || null

  return { checkin }
})
