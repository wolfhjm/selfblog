import { z } from 'zod'

const schema = z.object({
  source_type: z.string().min(1),
  source_id: z.number().int().positive(),
  target_type: z.string().min(1),
  target_id: z.number().int().positive(),
  relation_type: z.enum(['related_to', 'supports', 'contradicts', 'derived_from', 'validates', 'inspired_by', 'evidence_for', 'example_of', 'suggests_experiment']).default('related_to'),
  confidence: z.number().min(0).max(1).default(0.7)
})

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const body = schema.parse(await readBody(event))

  if (body.source_type === body.target_type && body.source_id === body.target_id) {
    throw createError({ statusCode: 400, statusMessage: '不能把对象关联到它自己' })
  }

  const result = getDb().prepare(`
    INSERT OR IGNORE INTO object_links (
      user_id,
      source_type,
      source_id,
      target_type,
      target_id,
      relation_type,
      confidence
    )
    VALUES (
      @user_id,
      @source_type,
      @source_id,
      @target_type,
      @target_id,
      @relation_type,
      @confidence
    )
  `).run({ user_id: user.id, ...body })

  return { id: result.lastInsertRowid }
})
