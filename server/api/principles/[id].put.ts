import { z } from 'zod'

const schema = z.object({
  title: z.string().min(1),
  category: z.string().min(1),
  description: z.string().default(''),
  source: z.string().default(''),
  application: z.string().default(''),
  example: z.string().default(''),
  visibility: z.enum(['private', 'public'])
})

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const id = Number(getRouterParam(event, 'id'))
  const body = schema.parse(await readBody(event))
  getDb().prepare(`
    UPDATE principles SET
      title = @title,
      category = @category,
      description = @description,
      source = @source,
      application = @application,
      example = @example,
      visibility = @visibility,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = @id AND user_id = @user_id
  `).run({ ...body, id, user_id: user.id })
  return { ok: true }
})
