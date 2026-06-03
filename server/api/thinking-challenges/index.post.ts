import { z } from 'zod'

const optionSchema = z.object({
  key: z.string().min(1).max(8),
  label: z.string().min(1),
  explanation: z.string().default('')
})

const schema = z.object({
  title: z.string().min(1),
  world_type: z.enum(['reality', 'fantasy']).default('reality'),
  fallacy_type: z.string().default(''),
  difficulty: z.number().int().min(1).max(5).default(1),
  prompt: z.string().min(1),
  question: z.string().min(1),
  options: z.array(optionSchema).min(2).max(6),
  correct_option: z.string().min(1),
  short_explanation: z.string().default(''),
  deep_explanation: z.string().default(''),
  rebuttal: z.string().default(''),
  tags: z.string().default(''),
  status: z.enum(['draft', 'active', 'archived']).default('active'),
  visibility: z.enum(['private', 'public']).default('private')
})

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const body = schema.parse(await readBody(event))
  const optionKeys = new Set(body.options.map((option) => option.key))
  if (!optionKeys.has(body.correct_option)) {
    throw createError({ statusCode: 400, statusMessage: '正确答案必须匹配一个选项 key' })
  }

  const result = getDb().prepare(`
    INSERT INTO thinking_challenges (
      user_id,
      title,
      world_type,
      fallacy_type,
      difficulty,
      prompt,
      question,
      options,
      correct_option,
      short_explanation,
      deep_explanation,
      rebuttal,
      tags,
      status,
      visibility
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    user.id,
    body.title,
    body.world_type,
    body.fallacy_type,
    body.difficulty,
    body.prompt,
    body.question,
    JSON.stringify(body.options),
    body.correct_option,
    body.short_explanation,
    body.deep_explanation,
    body.rebuttal,
    body.tags,
    body.status,
    body.visibility
  )

  return { id: Number(result.lastInsertRowid) }
})
