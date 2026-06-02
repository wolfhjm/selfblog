type Db = ReturnType<typeof getDb>

type AcceptedEventCase = {
  id: number
  created: boolean
}

export function acceptCandidateById(db: Db, userId: number, id: number) {
  const candidate = db.prepare(`
    SELECT * FROM candidates
    WHERE id = ? AND user_id = ? AND status = 'pending'
  `).get(id, userId) as any

  if (!candidate) {
    throw createError({ statusCode: 404, statusMessage: '没有找到这条候选' })
  }

  const payload = parseCandidatePayload(candidate.payload)
  const eventCase = candidate.extracted_event_id
    ? promoteExtractedEvent(db, userId, Number(candidate.extracted_event_id), { linkAcceptedCandidates: false })
    : null
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
      payload.linked_object_type || (eventCase ? 'case' : null),
      payload.linked_object_id || eventCase?.id || null,
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
      candidate.source_type || (eventCase ? 'extracted_event' : null),
      candidate.source_id || candidate.extracted_event_id || null,
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

  if (eventCase) {
    linkAcceptedObjectToEventCase(
      db,
      userId,
      eventCase.id,
      candidate.candidate_type,
      acceptedObjectType,
      acceptedObjectId
    )
  }

  return { acceptedObjectType, acceptedObjectId, candidateId: id }
}

export function promoteExtractedEvent(
  db: Db,
  userId: number,
  eventId: number,
  options: { linkAcceptedCandidates?: boolean } = {}
): AcceptedEventCase {
  const eventRow = db.prepare(`
    SELECT
      extracted_events.*,
      event_chains.source_type AS chain_source_type,
      event_chains.source_id AS chain_source_id
    FROM extracted_events
    JOIN event_chains ON event_chains.id = extracted_events.event_chain_id
    WHERE extracted_events.id = ? AND extracted_events.user_id = ?
  `).get(eventId, userId) as any

  if (!eventRow) {
    throw createError({ statusCode: 404, statusMessage: '没有找到这个事件' })
  }

  const existing = db.prepare(`
    SELECT id FROM cognitive_items
    WHERE user_id = ?
      AND item_type = 'case'
      AND source_type = 'extracted_event'
      AND source_id = ?
    ORDER BY id DESC
    LIMIT 1
  `).get(userId, eventId) as { id: number } | undefined

  const eventCase = existing
    ? { id: Number(existing.id), created: false }
    : createEventCase(db, userId, eventId, eventRow)

  if (options.linkAcceptedCandidates !== false) {
    linkAcceptedCandidatesForExtractedEvent(db, userId, eventId, eventCase.id)
  }

  return eventCase
}

function createEventCase(db: Db, userId: number, eventId: number, eventRow: any): AcceptedEventCase {
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
  `).run(userId, title, content, eventId)

  return { id: Number(result.lastInsertRowid), created: true }
}

function linkAcceptedCandidatesForExtractedEvent(db: Db, userId: number, eventId: number, eventCaseId: number) {
  const acceptedCandidates = db.prepare(`
    SELECT candidate_type, accepted_object_type, accepted_object_id
    FROM candidates
    WHERE extracted_event_id = ?
      AND user_id = ?
      AND status = 'accepted'
      AND accepted_object_type IS NOT NULL
      AND accepted_object_id IS NOT NULL
    ORDER BY updated_at ASC
  `).all(eventId, userId) as Array<{
    candidate_type: string
    accepted_object_type: string
    accepted_object_id: number
  }>

  for (const candidate of acceptedCandidates) {
    linkAcceptedObjectToEventCase(
      db,
      userId,
      eventCaseId,
      candidate.candidate_type,
      candidate.accepted_object_type,
      Number(candidate.accepted_object_id)
    )
  }
}

function linkAcceptedObjectToEventCase(
  db: Db,
  userId: number,
  eventCaseId: number,
  candidateType: string,
  acceptedObjectType: string,
  acceptedObjectId: number
) {
  if (acceptedObjectType === 'case' && acceptedObjectId === eventCaseId) return

  const link = linkShapeForAcceptedObject(eventCaseId, candidateType, acceptedObjectType, acceptedObjectId)

  db.prepare(`
    INSERT OR IGNORE INTO object_links (
      user_id,
      source_type,
      source_id,
      target_type,
      target_id,
      relation_type,
      confidence,
      created_by
    )
    VALUES (?, ?, ?, ?, ?, ?, 0.8, 'ai')
  `).run(
    userId,
    link.sourceType,
    link.sourceId,
    link.targetType,
    link.targetId,
    link.relationType
  )
}

function linkShapeForAcceptedObject(
  eventCaseId: number,
  candidateType: string,
  acceptedObjectType: string,
  acceptedObjectId: number
) {
  if (candidateType === 'experiment' || acceptedObjectType === 'experiment') {
    return {
      sourceType: 'case',
      sourceId: eventCaseId,
      targetType: 'experiment',
      targetId: acceptedObjectId,
      relationType: 'suggests_experiment'
    }
  }

  if (candidateType === 'insight' || candidateType === 'lesson') {
    return {
      sourceType: acceptedObjectType,
      sourceId: acceptedObjectId,
      targetType: 'case',
      targetId: eventCaseId,
      relationType: 'derived_from'
    }
  }

  if (candidateType === 'pattern') {
    return {
      sourceType: 'case',
      sourceId: eventCaseId,
      targetType: acceptedObjectType,
      targetId: acceptedObjectId,
      relationType: 'evidence_for'
    }
  }

  if (candidateType === 'case') {
    return {
      sourceType: 'case',
      sourceId: eventCaseId,
      targetType: acceptedObjectType,
      targetId: acceptedObjectId,
      relationType: 'example_of'
    }
  }

  return {
    sourceType: 'case',
    sourceId: eventCaseId,
    targetType: acceptedObjectType,
    targetId: acceptedObjectId,
    relationType: 'related_to'
  }
}

export function parseCandidatePayload(value: string) {
  try {
    return JSON.parse(value || '{}')
  } catch {
    return {}
  }
}
