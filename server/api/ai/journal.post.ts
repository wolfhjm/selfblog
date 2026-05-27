import { z } from 'zod'

const schema = z.object({
  conversation_id: z.number(),
  date: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const body = schema.parse(await readBody(event))
  const db = getDb()
  const conversation = db.prepare('SELECT * FROM conversations WHERE id = ? AND user_id = ?').get(body.conversation_id, user.id) as any
  if (!conversation) {
    throw createError({ statusCode: 404, statusMessage: '没有找到这段对话' })
  }

  const date = body.date || new Date().toISOString().slice(0, 10)
  const checkin = db.prepare('SELECT * FROM checkins WHERE user_id = ? AND date = ?').get(user.id, date) as any
  const recentCheckins = db.prepare(`
    SELECT date, done_text, feeling_text, mood
    FROM checkins
    WHERE user_id = ?
    ORDER BY date DESC
    LIMIT 7
  `).all(user.id)
  const messages = db.prepare('SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY id ASC').all(body.conversation_id) as any[]

  const content = await callAi([
    {
      role: 'system',
      content: [
        '你是个人成长 OS 的日记小结助手。你的任务不是给诊断，也不是泛泛鼓励，而是把用户的一次打卡和一段对话整理成可回看的中文日记小结。',
        '请保持朋友式陪伴的语气：温暖、诚实、具体。不要使用心理疾病标签，不要把用户定义成某种人。',
        '必须输出 Markdown，结构固定为：',
        '## 今天发生了什么',
        '## 情绪与身体信号',
        '## 行为模式',
        '## 内在矛盾',
        '## 可能的需求',
        '## 值得保留的洞察',
        '## 明天一个很小的动作',
        '每个部分 1-3 条，尽量从原文证据出发。最后的小动作必须 30 分钟内可完成。'
      ].join('\n')
    },
    {
      role: 'user',
      content: JSON.stringify({
        date,
        todayCheckin: checkin || null,
        recentCheckins,
        conversation: {
          id: conversation.id,
          title: conversation.title,
          messages
        }
      }, null, 2)
    }
  ], { temperature: 0.35 })

  return {
    date,
    title: `${date} 日记小结`,
    content: content.trim(),
    source_conversation_id: body.conversation_id,
    checkin_id: checkin?.id ?? null
  }
})
