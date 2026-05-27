import { z } from 'zod'

const schema = z.object({
  content: z.string().min(1),
  source_conversation_id: z.number().nullable().optional(),
  visibility: z.enum(['private', 'public']).default('private')
})

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const body = schema.parse(await readBody(event))
  const result = getDb().prepare(`
    INSERT INTO insights (user_id, content, source_conversation_id, visibility)
    VALUES (@user_id, @content, @source_conversation_id, @visibility)
  `).run({ user_id: user.id, source_conversation_id: null, ...body })
  return { id: result.lastInsertRowid }
})
