import { z } from 'zod'

const schema = z.object({
  category_id: z.string().min(1),
  category_title: z.string().default(''),
  tool_id: z.string().min(1),
  tool_title: z.string().default(''),
  tool_type: z.string().default(''),
  duration_seconds: z.number().int().min(0).default(0),
  intensity_before: z.number().int().min(0).max(10).default(0),
  intensity_after: z.number().int().min(0).max(10).default(0),
  context: z.string().default(''),
  reflection: z.string().default(''),
  next_step: z.string().default('')
})

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const body = schema.parse(await readBody(event))
  const result = getDb().prepare(`
    INSERT INTO toolbox_logs (
      user_id,
      category_id,
      category_title,
      tool_id,
      tool_title,
      tool_type,
      duration_seconds,
      intensity_before,
      intensity_after,
      context,
      reflection,
      next_step
    )
    VALUES (
      @user_id,
      @category_id,
      @category_title,
      @tool_id,
      @tool_title,
      @tool_type,
      @duration_seconds,
      @intensity_before,
      @intensity_after,
      @context,
      @reflection,
      @next_step
    )
  `).run({ user_id: user.id, ...body })

  return { id: result.lastInsertRowid }
})
