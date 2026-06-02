export default defineEventHandler((event) => {
  const user = requireUser(event)
  const id = Number(getRouterParam(event, 'id'))
  const db = getDb()
  const eventRow = db.prepare(`
    SELECT
      extracted_events.*,
      event_chains.source_type,
      event_chains.source_id
    FROM extracted_events
    JOIN event_chains ON event_chains.id = extracted_events.event_chain_id
    WHERE extracted_events.id = ? AND extracted_events.user_id = ?
  `).get(id, user.id) as any

  if (!eventRow) {
    throw createError({ statusCode: 404, statusMessage: '没有找到这个事件' })
  }

  const title = eventRow.title || eventRow.activating_event || eventRow.event_detail.slice(0, 32) || '未命名事件'
  const content = [
    eventRow.objective_context ? `客观环境：${eventRow.objective_context}` : '',
    eventRow.event_detail ? `事件细节：${eventRow.event_detail}` : '',
    eventRow.activating_event ? `ABC 触发：${eventRow.activating_event}` : '',
    eventRow.belief_or_interpretation ? `解释/信念：${eventRow.belief_or_interpretation}` : '',
    eventRow.consequence ? `后果：${eventRow.consequence}` : '',
    eventRow.body_signal ? `身体信号：${eventRow.body_signal}` : '',
    eventRow.emotion ? `情绪：${eventRow.emotion}` : '',
    eventRow.hidden_need ? `隐藏需求：${eventRow.hidden_need}` : '',
    eventRow.hidden_fear ? `隐藏恐惧：${eventRow.hidden_fear}` : '',
    eventRow.raw_evidence ? `原文证据：${eventRow.raw_evidence}` : ''
  ].filter(Boolean).join('\n')

  const result = db.prepare(`
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
    VALUES (?, 'case', ?, ?, 'extracted_event', ?, 'has_example', 'private')
  `).run(user.id, title, content, id)

  return { id: Number(result.lastInsertRowid) }
})
