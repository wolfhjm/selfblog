import { z } from 'zod'

const schema = z.object({
  period_type: z.enum(['week', 'month', 'custom']).default('week'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().min(1),
  content: z.string().min(1),
  source_summary: z.record(z.unknown()).default({}),
  visibility: z.enum(['private', 'public']).default('private')
})

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const body = schema.parse(await readBody(event))
  const result = getDb().prepare(`
    INSERT INTO period_reviews (
      user_id,
      period_type,
      start_date,
      end_date,
      title,
      content,
      source_summary,
      visibility
    )
    VALUES (
      @user_id,
      @period_type,
      @start_date,
      @end_date,
      @title,
      @content,
      @source_summary,
      @visibility
    )
  `).run({
    user_id: user.id,
    ...body,
    source_summary: JSON.stringify(body.source_summary)
  })

  return { id: result.lastInsertRowid }
})
