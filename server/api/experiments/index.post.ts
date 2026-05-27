import { z } from 'zod'

const schema = z.object({
  title: z.string().min(1),
  description: z.string().default(''),
  status: z.enum(['active', 'done', 'skipped', 'draft']).default('active'),
  week_number: z.string().default(''),
  visibility: z.enum(['private', 'public']).default('private'),
  suggested_by_ai: z.number().int().default(0)
})

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const body = schema.parse(await readBody(event))
  const result = getDb().prepare(`
    INSERT INTO experiments (user_id, title, description, status, week_number, visibility, suggested_by_ai)
    VALUES (@user_id, @title, @description, @status, @week_number, @visibility, @suggested_by_ai)
  `).run({ user_id: user.id, ...body })
  return { id: result.lastInsertRowid }
})
