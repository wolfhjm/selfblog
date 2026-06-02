import { z } from 'zod'

const schema = z.object({
  log_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).default(appDateString()),
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
  const db = getDb()
  const experiment = db.prepare('SELECT id FROM experiments WHERE id = ? AND user_id = ?').get(id, user.id)
  if (!experiment) {
    throw createError({ statusCode: 404, statusMessage: '没有找到这个实验' })
  }

  const result = db.prepare(`
    INSERT INTO experiment_logs (
      user_id,
      experiment_id,
      log_date,
      stage_title,
      completion_score,
      actual_behavior,
      observation,
      barrier,
      learning,
      next_step
    )
    VALUES (
      @user_id,
      @experiment_id,
      @log_date,
      @stage_title,
      @completion_score,
      @actual_behavior,
      @observation,
      @barrier,
      @learning,
      @next_step
    )
  `).run({ user_id: user.id, experiment_id: id, ...body })

  return { id: result.lastInsertRowid }
})
