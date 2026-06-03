import { z } from 'zod'

const schema = z.object({
  selected_option: z.string().min(1),
  reason: z.string().default('')
})

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const id = Number(getRouterParam(event, 'id'))
  const body = schema.parse(await readBody(event))
  const db = getDb()
  const challenge = db.prepare('SELECT * FROM thinking_challenges WHERE id = ? AND user_id = ?').get(id, user.id) as any

  if (!challenge) {
    throw createError({ statusCode: 404, statusMessage: '没有找到这道思维挑战' })
  }

  const options = parseOptions(challenge.options)
  const selected = options.find((option) => option.key === body.selected_option)
  if (!selected) {
    throw createError({ statusCode: 400, statusMessage: '请选择有效选项' })
  }

  const isCorrect = body.selected_option === challenge.correct_option ? 1 : 0
  const result = db.prepare(`
    INSERT INTO thinking_attempts (
      user_id,
      challenge_id,
      selected_option,
      is_correct,
      reason
    )
    VALUES (?, ?, ?, ?, ?)
  `).run(user.id, id, body.selected_option, isCorrect, body.reason)

  const correctOption = options.find((option) => option.key === challenge.correct_option)
  return {
    attemptId: Number(result.lastInsertRowid),
    is_correct: Boolean(isCorrect),
    selected,
    correct_option: challenge.correct_option,
    correct_label: correctOption?.label || challenge.correct_option,
    option_explanation: selected.explanation || '',
    short_explanation: challenge.short_explanation,
    deep_explanation: challenge.deep_explanation,
    rebuttal: challenge.rebuttal
  }
})

function parseOptions(raw: string) {
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed as Array<{ key: string, label: string, explanation: string }>
  } catch {
    // Fall through.
  }
  return []
}
