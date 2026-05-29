export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const db = getDb()
  const principles = db.prepare('SELECT title, description FROM principles WHERE user_id = ? ORDER BY updated_at DESC LIMIT 8').all(user.id)
  const checkins = db.prepare('SELECT date, done_text, feeling_text, mood FROM checkins WHERE user_id = ? ORDER BY date DESC LIMIT 7').all(user.id)
  const latestExperiment = db.prepare(`
    SELECT
      title,
      status,
      target_behavior,
      motivation,
      ability,
      prompt,
      tiny_version,
      success_criterion,
      reflection,
      barrier,
      failure_reason,
      opportunity,
      health_context
    FROM experiments
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 1
  `).get(user.id)

  const raw = await callAi([
    {
      role: 'system',
      content: [
        '你是个人成长 OS 的行动实验设计助手。请基于用户原则、近期状态和上次实验，推荐一个 30 分钟内可完成的一次性小实验。',
        '实验必须使用 Fogg Behavior Model：行为 = 动机 Motivation × 能力 Ability × 提示 Prompt。',
        '也要检查 COM-B 中的 Opportunity 和健康状态：如果用户近期精力/压力明显影响行动，要降低难度。',
        '只输出 JSON 对象，不要 Markdown，不要解释。',
        '字段必须包括：title、description、target_behavior、motivation、ability、prompt、tiny_version、success_criterion、opportunity、health_context。',
        'title 要短；description 说明为什么这个实验值得做；target_behavior 写具体行为；motivation 写动机；ability 写为什么足够容易或主要能力阻碍；prompt 写何时何地由什么触发；tiny_version 写做不到时的更小版本；success_criterion 写怎样算完成；opportunity 写环境/社会机会；health_context 写睡眠、精力、压力等相关背景。'
      ].join('\n')
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
      description: String(parsed.description || '').slice(0, 600),
      target_behavior: String(parsed.target_behavior || '').slice(0, 240),
      motivation: String(parsed.motivation || '').slice(0, 300),
      ability: String(parsed.ability || '').slice(0, 300),
      prompt: String(parsed.prompt || '').slice(0, 240),
      tiny_version: String(parsed.tiny_version || '').slice(0, 240),
      success_criterion: String(parsed.success_criterion || '').slice(0, 240),
      opportunity: String(parsed.opportunity || '').slice(0, 300),
      health_context: String(parsed.health_context || '').slice(0, 300)
    }
  } catch {
    return {
      title: '本周小实验',
      description: raw.trim(),
      target_behavior: '',
      motivation: '',
      ability: '',
      prompt: '',
      tiny_version: '',
      success_criterion: '',
      opportunity: '',
      health_context: ''
    }
  }
})
