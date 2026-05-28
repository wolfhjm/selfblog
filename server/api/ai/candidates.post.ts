import { z } from 'zod'

const schema = z.object({
  conversation_id: z.number()
})

const candidateSchema = z.object({
  type: z.enum(['pattern', 'case', 'reaction', 'lesson', 'insight', 'experiment']),
  title: z.string().min(1),
  content: z.string().default('')
})

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const body = schema.parse(await readBody(event))
  const db = getDb()
  const conversation = db.prepare('SELECT * FROM conversations WHERE id = ? AND user_id = ?').get(body.conversation_id, user.id)
  if (!conversation) {
    throw createError({ statusCode: 404, statusMessage: '没有找到这段对话' })
  }

  const messages = db.prepare('SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY id ASC').all(body.conversation_id) as any[]
  const transcript = messages.map((message) => `${message.role}: ${message.content}`).join('\n')
  const raw = await callAi([
    {
      role: 'system',
      content: [
        '你是个人成长 OS 的结构化提取助手。请从对话中提取候选内容，供用户确认后入库。',
        '只输出 JSON 数组，不要 Markdown，不要解释。',
        '每个元素必须包含 type、title、content。',
        'type 只能是 pattern、case、reaction、lesson、insight、experiment。',
        'case 表示具体发生的小事件；reaction 表示当时的感受/解释；insight 表示用户认识到的东西；lesson 表示下次可复用的经验教训；pattern 表示更通用的规律；experiment 表示一次 30 分钟内可尝试的小实验。',
        '最多输出 6 条。标题要短，内容要具体，不能编造原文没有支撑的内容。'
      ].join('\n')
    },
    { role: 'user', content: transcript }
  ], { temperature: 0.2 })

  const candidates = parseCandidates(raw)
  const insert = db.prepare(`
    INSERT INTO candidates (
      user_id,
      candidate_type,
      title,
      content,
      source_type,
      source_id,
      payload
    )
    VALUES (?, ?, ?, ?, 'conversation', ?, '{}')
  `)

  const inserted = db.transaction((items: Array<z.infer<typeof candidateSchema>>) => items.map((item) => {
    const result = insert.run(user.id, item.type, item.title, item.content, body.conversation_id)
    return { id: Number(result.lastInsertRowid), ...item }
  }))(candidates)

  return { count: inserted.length, candidates: inserted }
})

function parseCandidates(raw: string) {
  const normalized = raw.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim()
  let parsed: unknown
  try {
    parsed = JSON.parse(normalized)
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'AI 返回的候选格式不是有效 JSON' })
  }

  const items = z.array(candidateSchema).parse(parsed)
  return items
    .map((item) => ({
      type: item.type,
      title: item.title.trim(),
      content: item.content.trim()
    }))
    .filter((item) => item.title)
    .slice(0, 6)
}
