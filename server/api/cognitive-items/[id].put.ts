import { z } from 'zod'

const schema = z.object({
  item_type: z.enum(['pattern', 'case', 'reaction', 'lesson', 'insight']),
  title: z.string().min(1),
  content: z.string().default(''),
  source_type: z.string().nullable().optional(),
  source_id: z.number().int().positive().nullable().optional(),
  verification_status: z.enum(['unverified', 'has_example', 'testing', 'partial', 'strong', 'needs_revision', 'discarded']),
  visibility: z.enum(['private', 'public'])
})

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const id = Number(getRouterParam(event, 'id'))
  const body = schema.parse(await readBody(event))

  getDb().prepare(`
    UPDATE cognitive_items SET
      item_type = @item_type,
      title = @title,
      content = @content,
      source_type = @source_type,
      source_id = @source_id,
      verification_status = @verification_status,
      visibility = @visibility,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = @id AND user_id = @user_id
  `).run({
    id,
    user_id: user.id,
    ...body,
    source_type: body.source_type || null,
    source_id: body.source_id || null
  })

  return { ok: true }
})
