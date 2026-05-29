import { z } from 'zod'

const schema = z.object({
  conversation_id: z.number()
})

const candidatePayloadSchema = z.object({
  objective_context: z.string().default(''),
  event_detail: z.string().default(''),
  body_signal: z.string().default(''),
  emotion: z.string().default(''),
  interpretation: z.string().default(''),
  hidden_need: z.string().default(''),
  hidden_fear: z.string().default(''),
  raw_evidence: z.string().default(''),
  follow_up_questions: z.array(z.string()).default([])
}).default({})

const candidateSchema = z.object({
  type: z.enum(['pattern', 'case', 'reaction', 'lesson', 'insight', 'experiment']),
  title: z.string().min(1),
  content: z.string().default(''),
  payload: candidatePayloadSchema
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
        '每个元素必须包含 type、title、content、payload。',
        'type 只能是 pattern、case、reaction、lesson、insight、experiment。',
        'case 表示具体发生的小事件；reaction 表示当时的感受/解释；insight 表示用户认识到的东西；lesson 表示下次可复用的经验教训；pattern 表示更通用的规律；experiment 表示一次 30 分钟内可尝试的小实验。',
        'payload 必须是对象，字段包括：objective_context、event_detail、body_signal、emotion、interpretation、hidden_need、hidden_fear、raw_evidence、follow_up_questions。',
        'objective_context 写客观环境；event_detail 写具体发生了什么；body_signal 写身体信号；emotion 写感受；interpretation 写用户当时给事件的解释；hidden_need 写可能需求；hidden_fear 写可能恐惧；raw_evidence 写原文证据片段；follow_up_questions 写 1-3 个值得继续追问的问题。',
        '感受不要独立漂浮，必须尽量挂到某个事件、环境或解释上。',
        '洞察必须带上下文证据，避免输出漂亮但无根的抽象话。',
        '最多输出 6 条。标题要短，内容要具体，不能编造原文没有支撑的内容；不确定的隐藏需求/恐惧要用“可能”。'
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
    VALUES (?, ?, ?, ?, 'conversation', ?, ?)
  `)

  const inserted = db.transaction((items: Array<z.infer<typeof candidateSchema>>) => items.map((item) => {
    const result = insert.run(user.id, item.type, item.title, item.content, body.conversation_id, JSON.stringify(item.payload))
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
      content: item.content.trim(),
      payload: normalizePayload(item.payload)
    }))
    .filter((item) => item.title)
    .slice(0, 6)
}

function normalizePayload(payload: z.infer<typeof candidatePayloadSchema>) {
  return {
    objective_context: payload.objective_context.trim(),
    event_detail: payload.event_detail.trim(),
    body_signal: payload.body_signal.trim(),
    emotion: payload.emotion.trim(),
    interpretation: payload.interpretation.trim(),
    hidden_need: payload.hidden_need.trim(),
    hidden_fear: payload.hidden_fear.trim(),
    raw_evidence: payload.raw_evidence.trim(),
    follow_up_questions: payload.follow_up_questions.map((item) => item.trim()).filter(Boolean).slice(0, 3)
  }
}
