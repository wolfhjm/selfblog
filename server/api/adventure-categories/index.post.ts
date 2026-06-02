import { z } from 'zod'

const schema = z.object({
  title: z.string().min(1).max(40),
  description: z.string().max(240).default(''),
  prompt_hint: z.string().max(500).default(''),
  sort_order: z.number().int().default(100)
})

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const body = schema.parse(await readBody(event))
  const result = getDb().prepare(`
    INSERT INTO adventure_categories (
      user_id,
      title,
      description,
      prompt_hint,
      sort_order
    )
    VALUES (@user_id, @title, @description, @prompt_hint, @sort_order)
    ON CONFLICT(user_id, title) DO UPDATE SET
      description = excluded.description,
      prompt_hint = excluded.prompt_hint,
      status = 'active',
      sort_order = excluded.sort_order,
      updated_at = CURRENT_TIMESTAMP
  `).run({ user_id: user.id, ...body })

  return { id: result.lastInsertRowid }
})
