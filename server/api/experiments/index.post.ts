import { z } from 'zod'

const schema = z.object({
  title: z.string().min(1),
  description: z.string().default(''),
  status: z.enum(['active', 'done', 'partial', 'skipped', 'draft']).default('active'),
  week_number: z.string().default(''),
  visibility: z.enum(['private', 'public']).default('private'),
  suggested_by_ai: z.number().int().default(0),
  target_behavior: z.string().default(''),
  motivation: z.string().default(''),
  ability: z.string().default(''),
  prompt: z.string().default(''),
  tiny_version: z.string().default(''),
  success_criterion: z.string().default(''),
  failure_reason: z.string().default(''),
  opportunity: z.string().default(''),
  health_context: z.string().default(''),
  completion_score: z.number().int().min(0).max(100).default(0),
  actual_behavior: z.string().default(''),
  learning: z.string().default('')
})

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const body = schema.parse(await readBody(event))
  const result = getDb().prepare(`
    INSERT INTO experiments (
      user_id,
      title,
      description,
      status,
      week_number,
      visibility,
      suggested_by_ai,
      target_behavior,
      motivation,
      ability,
      prompt,
      tiny_version,
      success_criterion,
      failure_reason,
      opportunity,
      health_context,
      completion_score,
      actual_behavior,
      learning
    )
    VALUES (
      @user_id,
      @title,
      @description,
      @status,
      @week_number,
      @visibility,
      @suggested_by_ai,
      @target_behavior,
      @motivation,
      @ability,
      @prompt,
      @tiny_version,
      @success_criterion,
      @failure_reason,
      @opportunity,
      @health_context,
      @completion_score,
      @actual_behavior,
      @learning
    )
  `).run({ user_id: user.id, ...body })
  return { id: result.lastInsertRowid }
})
