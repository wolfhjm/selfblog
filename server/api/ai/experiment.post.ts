export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const db = getDb()
  const principles = db.prepare('SELECT title, description FROM principles WHERE user_id = ? ORDER BY updated_at DESC LIMIT 8').all(user.id)
  const checkins = db.prepare('SELECT date, done_text, feeling_text, mood FROM checkins WHERE user_id = ? ORDER BY date DESC LIMIT 7').all(user.id)
  const latestExperiment = db.prepare('SELECT title, status, reflection, barrier FROM experiments WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(user.id)

  const raw = await callAi([
    {
      role: 'system',
      content: '你是个人成长 OS 的行动实验设计助手。基于用户原则、近期状态和上次实验，推荐一个 30 分钟内可完成的一次性小实验。输出 JSON，字段为 title 和 description。不要输出 markdown。'
    },
    {
      role: 'user',
      content: JSON.stringify({ principles, checkins, latestExperiment }, null, 2)
    }
  ], { temperature: 0.6 })

  try {
    const parsed = JSON.parse(raw)
    return {
      title: String(parsed.title || '').slice(0, 80),
      description: String(parsed.description || '').slice(0, 600)
    }
  } catch {
    return {
      title: '本周小实验',
      description: raw.trim()
    }
  }
})
