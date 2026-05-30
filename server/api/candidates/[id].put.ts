import { z } from 'zod'

const schema = z.object({
  candidate_type: z.enum(['pattern', 'case', 'reaction', 'lesson', 'insight', 'experiment']),
  title: z.string().min(1),
  content: z.string().default(''),
  source_type: z.string().nullable().optional(),
  source_id: z.number().int().positive().nullable().optional(),
  event_chain_id: z.number().int().positive().nullable().optional(),
  extracted_event_id: z.number().int().positive().nullable().optional(),
  payload: z.record(z.unknown()).default({})
})

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const id = Number(getRouterParam(event, 'id'))
  const body = schema.parse(await readBody(event))

  getDb().prepare(`
    UPDATE candidates SET
      candidate_type = @candidate_type,
      title = @title,
      content = @content,
      source_type = @source_type,
      source_id = @source_id,
      event_chain_id = @event_chain_id,
      extracted_event_id = @extracted_event_id,
      payload = @payload,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = @id AND user_id = @user_id AND status = 'pending'
  `).run({
    id,
    user_id: user.id,
    ...body,
    source_type: body.source_type || null,
    source_id: body.source_id || null,
    event_chain_id: body.event_chain_id || null,
    extracted_event_id: body.extracted_event_id || null,
    payload: JSON.stringify(body.payload)
  })

  return { ok: true }
})
