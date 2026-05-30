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
  const body = schema.parse(await readBody(event))
  const result = getDb().prepare(`
    INSERT INTO candidates (
      user_id,
      candidate_type,
      title,
      content,
      source_type,
      source_id,
      event_chain_id,
      extracted_event_id,
      payload
    )
    VALUES (
      @user_id,
      @candidate_type,
      @title,
      @content,
      @source_type,
      @source_id,
      @event_chain_id,
      @extracted_event_id,
      @payload
    )
  `).run({
    user_id: user.id,
    ...body,
    source_type: body.source_type || null,
    source_id: body.source_id || null,
    event_chain_id: body.event_chain_id || null,
    extracted_event_id: body.extracted_event_id || null,
    payload: JSON.stringify(body.payload)
  })

  return { id: result.lastInsertRowid }
})
