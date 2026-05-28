import { z } from 'zod'

const schema = z.object({
  date: z.string().optional(),
  done_text: z.string().default(''),
  feeling_text: z.string().default(''),
  mood: z.number().int().min(1).max(5)
})

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const body = schema.parse(await readBody(event))
  const date = /^\d{4}-\d{2}-\d{2}$/.test(body.date || '') ? body.date : appDateString()
  getDb().prepare(`
    INSERT INTO checkins (user_id, date, done_text, feeling_text, mood)
    VALUES (@user_id, @date, @done_text, @feeling_text, @mood)
    ON CONFLICT(user_id, date) DO UPDATE SET
      done_text = excluded.done_text,
      feeling_text = excluded.feeling_text,
      mood = excluded.mood
  `).run({ user_id: user.id, ...body, date })
  return { ok: true }
})
