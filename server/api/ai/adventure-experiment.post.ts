import { z } from 'zod'

const schema = z.object({
  category_id: z.number().int().positive().nullable().optional()
})

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const body = schema.parse(await readBody(event).catch(() => ({})))
  const db = getDb()
  const categories = db.prepare(`
    SELECT id, title, description, prompt_hint
    FROM adventure_categories
    WHERE user_id = ? AND status = 'active'
    ORDER BY sort_order ASC, created_at ASC
  `).all(user.id) as Array<{ id: number, title: string, description: string, prompt_hint: string }>
  const category = selectCategory(categories, body.category_id || null)
  const checkins = db.prepare(`
    SELECT date, done_text, feeling_text, mood
    FROM checkins
    WHERE user_id = ?
    ORDER BY date DESC
    LIMIT 5
  `).all(user.id)
  const latestExperiments = db.prepare(`
    SELECT title, status, reflection, barrier, failure_reason
    FROM experiments
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 5
  `).all(user.id)

  try {
    const raw = await callAi([
      {
        role: 'system',
        content: [
          '你是个人成长 OS 的随机大冒险实验设计助手。请生成一个安全、低成本、有一点新鲜感的 30 分钟内小实验。',
          '这个实验不是宏大目标，而是帮助用户尝试新事物、打破惯性、增加经验样本。',
          '必须遵守：不危险、不违法、不涉及大额消费、不强迫社交、不羞辱用户、不制造高风险冲突。',
          '仍然使用 Fogg Behavior Model：行为 = 动机 Motivation × 能力 Ability × 提示 Prompt。',
          '只输出 JSON 对象，不要 Markdown，不要解释。',
          '字段必须包括：title、description、target_behavior、motivation、ability、prompt、tiny_version、success_criterion、opportunity、health_context。',
          'title 要像一张大冒险卡片，短而具体；target_behavior 必须是一件看得见的一次性行为；tiny_version 必须更小更安全。'
        ].join('\n')
      },
      {
        role: 'user',
        content: JSON.stringify({ category, checkins, latestExperiments }, null, 2)
      }
    ], { temperature: 0.85 })

    return {
      ...normalizeAdventureExperiment(JSON.parse(raw), category),
      category
    }
  } catch {
    return {
      ...fallbackAdventureExperiment(category),
      category
    }
  }
})

function selectCategory(
  categories: Array<{ id: number, title: string, description: string, prompt_hint: string }>,
  categoryId: number | null
) {
  if (!categories.length) {
    return {
      id: null,
      title: '完全随机',
      description: '安全、低成本、有一点新鲜感的小尝试。',
      prompt_hint: '生成一个不危险、不违法、不涉及大额消费、不强迫社交的随机小实验。'
    }
  }
  if (categoryId) {
    const matched = categories.find((item) => item.id === categoryId)
    if (matched) return matched
  }
  return categories[Math.floor(Math.random() * categories.length)]
}

function normalizeAdventureExperiment(parsed: any, category: { title: string, description: string }) {
  return {
    title: String(parsed.title || `${category.title}大冒险`).slice(0, 80),
    description: String(parsed.description || '').slice(0, 600),
    target_behavior: String(parsed.target_behavior || '').slice(0, 240),
    motivation: String(parsed.motivation || '').slice(0, 300),
    ability: String(parsed.ability || '').slice(0, 300),
    prompt: String(parsed.prompt || '').slice(0, 240),
    tiny_version: String(parsed.tiny_version || '').slice(0, 240),
    success_criterion: String(parsed.success_criterion || '').slice(0, 240),
    opportunity: String(parsed.opportunity || category.description || category.title).slice(0, 300),
    health_context: String(parsed.health_context || '如果今天精力低，就只做更小版本。').slice(0, 300)
  }
}

function fallbackAdventureExperiment(category: { title: string, description: string }) {
  return {
    title: `${category.title}大冒险`,
    description: '用一个很小、可逆、低成本的动作给今天增加一点新经验。重点不是做得多好，而是获得一个新的样本。',
    target_behavior: '在今天找一个安全的小场景，做一次和平时不一样的选择，并记录一句观察。',
    motivation: '通过轻量新体验打破自动驾驶，给自己增加可回看的经验材料。',
    ability: '只需要 5-15 分钟，不需要准备，不需要别人配合。',
    prompt: '当你下一次准备按惯性做同一件事时，先停 10 秒。',
    tiny_version: '只观察一个不同选择，不真的行动。',
    success_criterion: '完成一次不同选择，并写下一句话：它让我注意到什么？',
    opportunity: category.description || category.title,
    health_context: '如果疲惫或压力高，只做观察版，不增加额外负担。'
  }
}
