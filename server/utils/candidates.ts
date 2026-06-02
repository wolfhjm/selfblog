export function acceptCandidateById(db: ReturnType<typeof getDb>, userId: number, id: number) {
  const candidate = db.prepare(`
    SELECT * FROM candidates
    WHERE id = ? AND user_id = ? AND status = 'pending'
  `).get(id, userId) as any

  if (!candidate) {
    throw createError({ statusCode: 404, statusMessage: '没有找到这条候选' })
  }

  const payload = parseCandidatePayload(candidate.payload)
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
        linked_object_id,
        target_behavior,
        motivation,
        ability,
        prompt,
        tiny_version,
        success_criterion,
        opportunity,
        health_context
      )
      VALUES (?, ?, ?, 'draft', ?, 'private', 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      candidate.title,
      candidate.content,
      appDateString(),
      String(payload.experiment_type || 'single'),
      payload.linked_object_type || null,
      payload.linked_object_id || null,
      String(payload.target_behavior || ''),
      String(payload.motivation || ''),
      String(payload.ability || ''),
      String(payload.prompt || ''),
      String(payload.tiny_version || ''),
      String(payload.success_criterion || ''),
      String(payload.opportunity || ''),
      String(payload.health_context || '')
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
      userId,
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
  `).run(acceptedObjectType, acceptedObjectId, id, userId)

  return { acceptedObjectType, acceptedObjectId, candidateId: id }
}

export function parseCandidatePayload(value: string) {
  try {
    return JSON.parse(value || '{}')
  } catch {
    return {}
  }
}
