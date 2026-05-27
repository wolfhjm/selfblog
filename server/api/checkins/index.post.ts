import { z } from 'zod'

const schema = z.object({
  date: z.string().min(8),
  done_text: z.string().default(''),
  feeling_text: z.string().default(''),
  mood: z.number().int().min(1).max(5)
})

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const body = schema.parse(await readBody(event))
  getDb().prepare(`
    INSERT INTO checkins (user_id, date, done_text, feeling_text, mood)
    VALUES (@user_id, @date, @done_text, @feeling_text, @mood)
    ON CONFLICT(user_id, date) DO UPDATE SET
      done_text = excluded.done_text,
      feeling_text = excluded.feeling_text,
      mood = excluded.mood
  `).run({ user_id: user.id, ...body })
  return { ok: true }
})
