import { z } from 'zod'

const schema = z.object({
  content: z.string().min(1),
  source_conversation_id: z.number().nullable().optional(),
  visibility: z.enum(['private', 'public']).default('private')
})

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const body = schema.parse(await readBody(event))
  const db = getDb()
  const transaction = db.transaction(() => {
    const insight = db.prepare(`
      INSERT INTO insights (user_id, content, source_conversation_id, visibility)
      VALUES (@user_id, @content, @source_conversation_id, @visibility)
    `).run({ user_id: user.id, source_conversation_id: null, ...body })

    const item = db.prepare(`
      INSERT INTO cognitive_items (
        user_id,
        item_type,
        title,
        content,
        source_type,
        source_id,
        verification_status,
        visibility
      )
      VALUES (?, 'insight', ?, ?, 'insight', ?, 'unverified', ?)
    `).run(
      user.id,
      insightTitle(body.content),
      body.content,
      Number(insight.lastInsertRowid),
      body.visibility
    )

    return { id: insight.lastInsertRowid, cognitive_item_id: item.lastInsertRowid }
  })

  return transaction()
})

function insightTitle(content: string) {
  return content
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 32) || '未命名洞察'
}
