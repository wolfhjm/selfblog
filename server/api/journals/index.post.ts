import { z } from 'zod'

const schema = z.object({
  date: z.string().min(8),
  title: z.string().min(1),
  content: z.string().min(1),
  source_conversation_id: z.number().nullable().optional(),
  checkin_id: z.number().nullable().optional(),
  visibility: z.enum(['private', 'public']).default('private')
})

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const body = schema.parse(await readBody(event))
  const result = getDb().prepare(`
    INSERT INTO journal_summaries (
      user_id,
      date,
      title,
      content,
      source_conversation_id,
      checkin_id,
      visibility
    )
    VALUES (
      @user_id,
      @date,
      @title,
      @content,
      @source_conversation_id,
      @checkin_id,
      @visibility
    )
  `).run({
    user_id: user.id,
    source_conversation_id: null,
    checkin_id: null,
    ...body
  })

  return { id: result.lastInsertRowid }
})
