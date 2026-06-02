import { z } from 'zod'

const schema = z.object({
  title: z.string().min(1).max(40),
  description: z.string().max(240).default(''),
  prompt_hint: z.string().max(500).default(''),
  sort_order: z.number().int().default(100)
})

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const id = Number(getRouterParam(event, 'id'))
  const body = schema.parse(await readBody(event))

  getDb().prepare(`
    UPDATE adventure_categories SET
      title = @title,
      description = @description,
      prompt_hint = @prompt_hint,
      sort_order = @sort_order,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = @id AND user_id = @user_id
  `).run({ id, user_id: user.id, ...body })

  return { ok: true }
})
