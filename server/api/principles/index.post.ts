import { z } from 'zod'

const schema = z.object({
  title: z.string().min(1),
  category: z.string().min(1).default('life'),
  description: z.string().default(''),
  source: z.string().default(''),
  application: z.string().default(''),
  example: z.string().default(''),
  visibility: z.enum(['private', 'public']).default('private')
})

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const body = schema.parse(await readBody(event))
  const slug = stableSlug(body.title)
  const result = getDb().prepare(`
    INSERT INTO principles (user_id, slug, title, category, description, source, application, example, visibility)
    VALUES (@user_id, @slug, @title, @category, @description, @source, @application, @example, @visibility)
  `).run({ user_id: user.id, slug, ...body })
  return { id: result.lastInsertRowid, slug }
})
