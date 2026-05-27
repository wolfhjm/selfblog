import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

export default defineEventHandler(async (event) => {
  const body = schema.parse(await readBody(event))
  const db = getDb()
  const user = db.prepare('SELECT id, email, display_name, password_hash FROM users WHERE email = ?')
    .get(body.email) as { id: number, email: string, display_name: string, password_hash: string } | undefined

  if (!user || !verifyPassword(body.password, user.password_hash)) {
    throw createError({ statusCode: 401, statusMessage: '邮箱或密码不正确' })
  }

  createSession(event, user.id)
  return { user: { id: user.id, email: user.email, display_name: user.display_name } }
})
