export default defineEventHandler((event) => {
  const user = requireUser(event)
  const id = Number(getRouterParam(event, 'id'))
  const db = getDb()
  const candidate = db.prepare(`
    SELECT * FROM candidates
    WHERE id = ? AND user_id = ? AND status = 'pending'
  `).get(id, user.id) as any

  if (!candidate) {
    throw createError({ statusCode: 404, statusMessage: '没有找到这条候选' })
  }

  const payload = parsePayload(candidate.payload)
  const transaction = db.transaction(() => {
    let acceptedObjectType = candidate.candidate_type
    let acceptedObjectId: number

    if (candidate.candidate_type === 'experiment') {
      const result = db.prepare(`
        INSERT INTO experiments (
          user_id,
          title,
          description,
          status,
          week_number,
          visibility,
          suggested_by_ai,
          experiment_type,
          linked_object_type,
          linked_object_id
        )
        VALUES (?, ?, ?, 'draft', ?, 'private', 1, ?, ?, ?)
      `).run(
        user.id,
        candidate.title,
        candidate.content,
        appDateString(),
        String(payload.experiment_type || 'single'),
        payload.linked_object_type || null,
        payload.linked_object_id || null
      )
      acceptedObjectType = 'experiment'
      acceptedObjectId = Number(result.lastInsertRowid)
    } else {
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
        VALUES (?, ?, ?, ?, ?, ?, ?, 'private')
      `).run(
        user.id,
        candidate.candidate_type,
        candidate.title,
        candidate.content,
        candidate.source_type || null,
        candidate.source_id || null,
        String(payload.verification_status || 'unverified')
      )
      acceptedObjectType = candidate.candidate_type
      acceptedObjectId = Number(result.lastInsertRowid)
    }

    db.prepare(`
      UPDATE candidates SET
        status = 'accepted',
        accepted_object_type = ?,
        accepted_object_id = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(acceptedObjectType, acceptedObjectId, id, user.id)

    return { acceptedObjectType, acceptedObjectId }
  })

  return transaction()
})

function parsePayload(value: string) {
  try {
    return JSON.parse(value || '{}')
  } catch {
    return {}
  }
}
