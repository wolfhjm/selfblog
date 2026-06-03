export default defineEventHandler((event) => {
  const user = requireUser(event)
  const id = Number(getRouterParam(event, 'id'))
  const db = getDb()
  const challenge = db.prepare(`
    SELECT
      thinking_challenges.*,
      COUNT(thinking_attempts.id) AS attempt_count,
      COALESCE(SUM(thinking_attempts.is_correct), 0) AS correct_count,
      MAX(thinking_attempts.created_at) AS last_attempt_at
    FROM thinking_challenges
    LEFT JOIN thinking_attempts
      ON thinking_attempts.challenge_id = thinking_challenges.id
      AND thinking_attempts.user_id = thinking_challenges.user_id
    WHERE thinking_challenges.id = ? AND thinking_challenges.user_id = ?
    GROUP BY thinking_challenges.id
  `).get(id, user.id)

  if (!challenge) {
    throw createError({ statusCode: 404, statusMessage: '没有找到这道思维挑战' })
  }

  const attempts = db.prepare(`
    SELECT *
    FROM thinking_attempts
    WHERE challenge_id = ? AND user_id = ?
    ORDER BY created_at DESC
    LIMIT 5
  `).all(id, user.id)

  return { challenge, attempts }
})
