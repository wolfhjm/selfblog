import { z } from 'zod'

const schema = z.object({
  log_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  stage_title: z.string().max(80).default(''),
  completion_score: z.number().int().min(0).max(100).default(0),
  actual_behavior: z.string().default(''),
  observation: z.string().default(''),
  barrier: z.string().default(''),
  learning: z.string().default(''),
  next_step: z.string().default('')
})

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const id = Number(getRouterParam(event, 'id'))
  const body = schema.parse(await readBody(event))

  getDb().prepare(`
    UPDATE experiment_logs SET
      log_date = @log_date,
      stage_title = @stage_title,
      completion_score = @completion_score,
      actual_behavior = @actual_behavior,
      observation = @observation,
      barrier = @barrier,
      learning = @learning,
      next_step = @next_step,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = @id AND user_id = @user_id
  `).run({ id, user_id: user.id, ...body })

  return { ok: true }
})
