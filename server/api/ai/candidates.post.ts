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
  activating_event: z.string().default(''),
  belief_or_interpretation: z.string().default(''),
  consequence: z.string().default(''),
  evidence_for: z.string().default(''),
  evidence_against: z.string().default(''),
  reframe: z.string().default(''),
  target_behavior: z.string().default(''),
  motivation: z.string().default(''),
  ability: z.string().default(''),
  prompt: z.string().default(''),
  tiny_version: z.string().default(''),
  success_criterion: z.string().default(''),
  opportunity: z.string().default(''),
  health_context: z.string().default(''),
  raw_evidence: z.string().default(''),
  follow_up_questions: z.array(z.string()).default([])
}).default({})

const extractedEventSchema = z.object({
  local_id: z.string().min(1),
  title: z.string().default(''),
  objective_context: z.string().default(''),
  event_detail: z.string().default(''),
  activating_event: z.string().default(''),
  belief_or_interpretation: z.string().default(''),
  consequence: z.string().default(''),
  body_signal: z.string().default(''),
  emotion: z.string().default(''),
  hidden_need: z.string().default(''),
  hidden_fear: z.string().default(''),
  raw_evidence: z.string().default('')
})

const candidateSchema = z.object({
  type: z.enum(['pattern', 'case', 'reaction', 'lesson', 'insight', 'experiment']),
  title: z.string().min(1),
  content: z.string().default(''),
  event_local_id: z.string().default(''),
  payload: candidatePayloadSchema
})

const chainSchema = z.object({
  chain: z.object({
    title: z.string().default(''),
    summary: z.string().default('')
  }).default({}),
  events: z.array(extractedEventSchema).default([]),
  candidates: z.array(candidateSchema).default([])
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
        '你是个人成长 OS 的结构化提取助手。请从对话中先拆事件链，再提取候选内容，供用户确认后入库。',
        '只输出 JSON 对象，不要 Markdown，不要解释。',
        '顶层结构必须是：{ "chain": { "title": "", "summary": "" }, "events": [], "candidates": [] }。',
        'events 中每个元素必须包含 local_id、title、objective_context、event_detail、activating_event、belief_or_interpretation、consequence、body_signal、emotion、hidden_need、hidden_fear、raw_evidence。',
        'local_id 用 e1、e2、e3 这种稳定短 ID。events 最多 4 个，必须按对话中的时间或叙事顺序排列。',
        'candidates 中每个元素必须包含 type、title、content、event_local_id、payload。event_local_id 必须引用某个 events.local_id；如果无法归属，填空字符串。',
        'type 只能是 pattern、case、reaction、lesson、insight、experiment。',
        'case 表示具体发生的小事件；reaction 表示当时的感受/解释；insight 表示用户认识到的东西；lesson 表示下次可复用的经验教训；pattern 表示更通用的规律；experiment 表示一次 30 分钟内可尝试的小实验。',
        'payload 必须是对象，字段包括：objective_context、event_detail、body_signal、emotion、interpretation、hidden_need、hidden_fear、activating_event、belief_or_interpretation、consequence、evidence_for、evidence_against、reframe、target_behavior、motivation、ability、prompt、tiny_version、success_criterion、opportunity、health_context、raw_evidence、follow_up_questions。',
        'objective_context 写客观环境；event_detail 写具体发生了什么；body_signal 写身体信号；emotion 写感受；interpretation 写用户当时给事件的解释；hidden_need 写可能需求；hidden_fear 写可能恐惧；raw_evidence 写原文证据片段；follow_up_questions 写 1-3 个值得继续追问的问题。',
        '认知和情绪使用 ABC / CBT：activating_event 写触发事件；belief_or_interpretation 写信念/自动解释；consequence 写情绪、身体和行为后果；evidence_for/evidence_against 写证据和反例；reframe 写更准确或更有用的新解释。',
        '行动实验使用 Fogg Behavior Model：target_behavior 写具体行为；motivation 写动机；ability 写能力/难度；prompt 写触发提示；tiny_version 写更小版本；success_criterion 写完成标准。opportunity 和 health_context 用来补充 COM-B 的机会与健康状态约束。',
        '感受不要独立漂浮，必须尽量挂到某个事件、环境或解释上。',
        '洞察必须带上下文证据，避免输出漂亮但无根的抽象话。',
        '如果 type 是 experiment，payload 里的 target_behavior、motivation、ability、prompt、tiny_version、success_criterion 尽量不要为空。',
        'candidates 最多输出 8 条。标题要短，内容要具体，不能编造原文没有支撑的内容；不确定的隐藏需求/恐惧要用“可能”。',
        '如果对话很短，也至少输出一个事件链和 1-2 条候选；如果没有足够证据，少输出候选。'
      ].join('\n')
    },
    { role: 'user', content: transcript }
  ], { temperature: 0.2 })

  const extraction = parseExtraction(raw)
  const normalizedEvents = extraction.events.map(normalizeExtractedEvent).slice(0, 4)
  const candidates = extraction.candidates
  const insert = db.prepare(`
    INSERT INTO candidates (
      user_id,
      candidate_type,
      title,
      content,
      source_type,
      source_id,
      payload,
      event_chain_id,
      extracted_event_id
    )
    VALUES (?, ?, ?, ?, 'conversation', ?, ?, ?, ?)
  `)

  const transaction = db.transaction(() => {
    let chainId: number | null = null
    const eventIdsByLocalId = new Map<string, number>()

    if (normalizedEvents.length || extraction.chain.title || extraction.chain.summary) {
      const chainResult = db.prepare(`
        INSERT INTO event_chains (
          user_id,
          source_type,
          source_id,
          title,
          summary
        )
        VALUES (?, 'conversation', ?, ?, ?)
      `).run(
        user.id,
        body.conversation_id,
        extraction.chain.title || '对话事件链',
        extraction.chain.summary
      )
      chainId = Number(chainResult.lastInsertRowid)

      const insertEvent = db.prepare(`
        INSERT INTO extracted_events (
          user_id,
          event_chain_id,
          title,
          objective_context,
          event_detail,
          activating_event,
          belief_or_interpretation,
          consequence,
          body_signal,
          emotion,
          hidden_need,
          hidden_fear,
          raw_evidence,
          sort_order
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      normalizedEvents.forEach((item, index) => {
        const result = insertEvent.run(
          user.id,
          chainId,
          item.title,
          item.objective_context,
          item.event_detail,
          item.activating_event,
          item.belief_or_interpretation,
          item.consequence,
          item.body_signal,
          item.emotion,
          item.hidden_need,
          item.hidden_fear,
          item.raw_evidence,
          index + 1
        )
        eventIdsByLocalId.set(item.local_id, Number(result.lastInsertRowid))
      })
    }

    const inserted = candidates.map((item) => {
      const extractedEventId = item.event_local_id ? eventIdsByLocalId.get(item.event_local_id) || null : null
      const payload = {
        ...item.payload,
        event_chain_id: chainId,
        event_local_id: item.event_local_id,
        extracted_event_id: extractedEventId
      }
      const result = insert.run(
        user.id,
        item.type,
        item.title,
        item.content,
        body.conversation_id,
        JSON.stringify(payload),
        chainId,
        extractedEventId
      )
      return { id: Number(result.lastInsertRowid), ...item, event_chain_id: chainId, extracted_event_id: extractedEventId }
    })

    return { chainId, eventCount: normalizedEvents.length, inserted }
  })

  const result = transaction()

  return {
    count: result.inserted.length,
    event_chain_id: result.chainId,
    event_count: result.eventCount,
    candidates: result.inserted
  }
})

function parseExtraction(raw: string) {
  const normalized = raw.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim()
  let parsed: unknown
  try {
    parsed = JSON.parse(normalized)
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'AI 返回的候选格式不是有效 JSON' })
  }

  if (Array.isArray(parsed)) {
    return {
      chain: { title: '对话事件链', summary: '' },
      events: [],
      candidates: normalizeCandidates(z.array(candidateSchema).parse(parsed))
    }
  }

  const extraction = chainSchema.parse(parsed)
  return {
    chain: {
      title: extraction.chain.title.trim(),
      summary: extraction.chain.summary.trim()
    },
    events: extraction.events,
    candidates: normalizeCandidates(extraction.candidates)
  }
}

function normalizeCandidates(items: Array<z.infer<typeof candidateSchema>>) {
  return items
    .map((item) => ({
      type: item.type,
      title: item.title.trim(),
      content: item.content.trim(),
      event_local_id: item.event_local_id.trim(),
      payload: normalizePayload(item.payload)
    }))
    .filter((item) => item.title)
    .slice(0, 8)
}

function normalizeExtractedEvent(event: z.infer<typeof extractedEventSchema>) {
  return {
    local_id: event.local_id.trim(),
    title: event.title.trim(),
    objective_context: event.objective_context.trim(),
    event_detail: event.event_detail.trim(),
    activating_event: event.activating_event.trim(),
    belief_or_interpretation: event.belief_or_interpretation.trim(),
    consequence: event.consequence.trim(),
    body_signal: event.body_signal.trim(),
    emotion: event.emotion.trim(),
    hidden_need: event.hidden_need.trim(),
    hidden_fear: event.hidden_fear.trim(),
    raw_evidence: event.raw_evidence.trim()
  }
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
    activating_event: payload.activating_event.trim(),
    belief_or_interpretation: payload.belief_or_interpretation.trim(),
    consequence: payload.consequence.trim(),
    evidence_for: payload.evidence_for.trim(),
    evidence_against: payload.evidence_against.trim(),
    reframe: payload.reframe.trim(),
    target_behavior: payload.target_behavior.trim(),
    motivation: payload.motivation.trim(),
    ability: payload.ability.trim(),
    prompt: payload.prompt.trim(),
    tiny_version: payload.tiny_version.trim(),
    success_criterion: payload.success_criterion.trim(),
    opportunity: payload.opportunity.trim(),
    health_context: payload.health_context.trim(),
    raw_evidence: payload.raw_evidence.trim(),
    follow_up_questions: payload.follow_up_questions.map((item) => item.trim()).filter(Boolean).slice(0, 3)
  }
}
