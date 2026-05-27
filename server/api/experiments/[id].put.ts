import { z } from 'zod'

const schema = z.object({
  title: z.string().min(1),
  description: z.string().default(''),
  status: z.enum(['active', 'done', 'skipped', 'draft']),
  week_number: z.string().default(''),
  reflection: z.string().default(''),
  barrier: z.string().default(''),
  visibility: z.enum(['private', 'public'])
})

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const id = Number(getRouterParam(event, 'id'))
  const body = schema.parse(await readBody(event))
  const doneAt = body.status === 'done' ? new Date().toISOString() : null
  getDb().prepare(`
    UPDATE experiments SET
      title = @title,
      description = @description,
      status = @status,
      week_number = @week_number,
      reflection = @reflection,
      barrier = @barrier,
      visibility = @visibility,
      done_at = @done_at,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = @id AND user_id = @user_id
  `).run({ ...body, done_at: doneAt, id, user_id: user.id })
  return { ok: true }
})
