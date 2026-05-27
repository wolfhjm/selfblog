import { randomBytes, createHmac } from 'node:crypto'
import type { H3Event } from 'h3'

const cookieName = 'growth_os_session'

export function signSessionId(sessionId: string) {
  const secret = useRuntimeConfig().sessionSecret
  const signature = createHmac('sha256', secret).update(sessionId).digest('hex')
  return `${sessionId}.${signature}`
}

export function readSignedSession(value?: string | null) {
  if (!value) return null
  const [sessionId, signature] = value.split('.')
  if (!sessionId || !signature) return null
  return signSessionId(sessionId) === value ? sessionId : null
}

export function createSession(event: H3Event, userId: number) {
  const db = getDb()
  const sessionId = randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
  db.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)').run(sessionId, userId, expires.toISOString())
  setCookie(event, cookieName, signSessionId(sessionId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires
  })
}

export function clearAuthSession(event: H3Event) {
  const sessionId = readSignedSession(getCookie(event, cookieName))
  if (sessionId) {
    getDb().prepare('DELETE FROM sessions WHERE id = ?').run(sessionId)
  }
  deleteCookie(event, cookieName, { path: '/' })
}

export function getCurrentUser(event: H3Event) {
  const sessionId = readSignedSession(getCookie(event, cookieName))
  if (!sessionId) return null
  const db = getDb()
  const row = db.prepare(`
    SELECT users.id, users.email, users.display_name
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.id = ? AND sessions.expires_at > datetime('now')
  `).get(sessionId) as { id: number, email: string, display_name: string } | undefined
  return row || null
}

export function requireUser(event: H3Event) {
  const user = getCurrentUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: '请先登录' })
  }
  return user
}
