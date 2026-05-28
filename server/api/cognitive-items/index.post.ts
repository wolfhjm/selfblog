import { z } from 'zod'

const schema = z.object({
  item_type: z.enum(['pattern', 'case', 'reaction', 'lesson', 'insight']),
  title: z.string().min(1),
  content: z.string().default(''),
  source_type: z.string().nullable().optional(),
  source_id: z.number().int().positive().nullable().optional(),
  verification_status: z.enum(['unverified', 'has_example', 'testing', 'partial', 'strong', 'needs_revision', 'discarded']).default('unverified'),
  visibility: z.enum(['private', 'public']).default('private')
})

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const body = schema.parse(await readBody(event))
  const result = getDb().prepare(`
    INSERT INTO cognitive_items (
      user_id,
      item_type,
      title,
      content,
      source_type,
      source_id,
      verification_status,
      visibility
    )
    VALUES (
      @user_id,
      @item_type,
      @title,
      @content,
      @source_type,
      @source_id,
      @verification_status,
      @visibility
    )
  `).run({
    user_id: user.id,
    ...body,
    source_type: body.source_type || null,
    source_id: body.source_id || null
  })

  return { id: result.lastInsertRowid }
})
