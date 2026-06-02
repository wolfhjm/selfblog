import { z } from 'zod'

const schema = z.object({
  title: z.string().min(1),
  description: z.string().default(''),
  status: z.enum(['active', 'done', 'partial', 'skipped', 'draft']),
  week_number: z.string().default(''),
  reflection: z.string().default(''),
  barrier: z.string().default(''),
  visibility: z.enum(['private', 'public']),
  target_behavior: z.string().default(''),
  motivation: z.string().default(''),
  ability: z.string().default(''),
  prompt: z.string().default(''),
  tiny_version: z.string().default(''),
  success_criterion: z.string().default(''),
  failure_reason: z.string().default(''),
  opportunity: z.string().default(''),
  health_context: z.string().default(''),
  verification_result: z.string().default('unknown'),
  completion_score: z.number().int().min(0).max(100).default(0),
  actual_behavior: z.string().default(''),
  learning: z.string().default('')
})

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const id = Number(getRouterParam(event, 'id'))
  const body = schema.parse(await readBody(event))
  const doneAt = ['done', 'partial', 'skipped'].includes(body.status) ? new Date().toISOString() : null
  getDb().prepare(`
    UPDATE experiments SET
      title = @title,
      description = @description,
      status = @status,
      week_number = @week_number,
      reflection = @reflection,
      barrier = @barrier,
      visibility = @visibility,
      target_behavior = @target_behavior,
      motivation = @motivation,
      ability = @ability,
      prompt = @prompt,
      tiny_version = @tiny_version,
      success_criterion = @success_criterion,
      failure_reason = @failure_reason,
      opportunity = @opportunity,
      health_context = @health_context,
      completion_score = @completion_score,
      actual_behavior = @actual_behavior,
      learning = @learning,
      verification_result = @verification_result,
      done_at = @done_at,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = @id AND user_id = @user_id
  `).run({ ...body, done_at: doneAt, id, user_id: user.id })
  return { ok: true }
})
