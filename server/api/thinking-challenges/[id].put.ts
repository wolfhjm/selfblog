import { z } from 'zod'

const optionSchema = z.object({
  key: z.string().min(1).max(8),
  label: z.string().min(1),
  explanation: z.string().default('')
})

const schema = z.object({
  title: z.string().min(1),
  world_type: z.enum(['reality', 'fantasy']),
  fallacy_type: z.string().default(''),
  difficulty: z.number().int().min(1).max(5),
  prompt: z.string().min(1),
  question: z.string().min(1),
  options: z.array(optionSchema).min(2).max(6),
  correct_option: z.string().min(1),
  short_explanation: z.string().default(''),
  deep_explanation: z.string().default(''),
  rebuttal: z.string().default(''),
  tags: z.string().default(''),
  status: z.enum(['draft', 'active', 'archived']),
  visibility: z.enum(['private', 'public'])
})

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const id = Number(getRouterParam(event, 'id'))
  const body = schema.parse(await readBody(event))
  const optionKeys = new Set(body.options.map((option) => option.key))
  if (!optionKeys.has(body.correct_option)) {
    throw createError({ statusCode: 400, statusMessage: '正确答案必须匹配一个选项 key' })
  }

  const result = getDb().prepare(`
    UPDATE thinking_challenges
    SET
      title = @title,
      world_type = @world_type,
      fallacy_type = @fallacy_type,
      difficulty = @difficulty,
      prompt = @prompt,
      question = @question,
      options = @options,
      correct_option = @correct_option,
      short_explanation = @short_explanation,
      deep_explanation = @deep_explanation,
      rebuttal = @rebuttal,
      tags = @tags,
      status = @status,
      visibility = @visibility,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = @id AND user_id = @user_id
  `).run({
    id,
    user_id: user.id,
    ...body,
    options: JSON.stringify(body.options)
  })

  if (!result.changes) {
    throw createError({ statusCode: 404, statusMessage: '没有找到这道思维挑战' })
  }

  return { ok: true }
})
