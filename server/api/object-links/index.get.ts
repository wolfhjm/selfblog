export default defineEventHandler((event) => {
  const user = requireUser(event)
  const query = getQuery(event)
  const sourceType = typeof query.source_type === 'string' ? query.source_type : ''
  const sourceId = typeof query.source_id === 'string' ? Number(query.source_id) : 0
  const db = getDb()

  if (sourceType && sourceId) {
    return db.prepare(`
      SELECT
        object_links.*,
        source_item.title AS source_title,
        target_item.title AS target_title,
        source_experiment.title AS source_experiment_title,
        target_experiment.title AS target_experiment_title
      FROM object_links
      LEFT JOIN cognitive_items AS source_item
        ON source_item.user_id = object_links.user_id
       AND source_item.item_type = object_links.source_type
       AND source_item.id = object_links.source_id
      LEFT JOIN cognitive_items AS target_item
        ON target_item.user_id = object_links.user_id
       AND target_item.item_type = object_links.target_type
       AND target_item.id = object_links.target_id
      LEFT JOIN experiments AS source_experiment
        ON source_experiment.user_id = object_links.user_id
       AND object_links.source_type = 'experiment'
       AND source_experiment.id = object_links.source_id
      LEFT JOIN experiments AS target_experiment
        ON target_experiment.user_id = object_links.user_id
       AND object_links.target_type = 'experiment'
       AND target_experiment.id = object_links.target_id
      WHERE object_links.user_id = ?
        AND object_links.status = 'active'
        AND (
          (object_links.source_type = ? AND object_links.source_id = ?)
          OR (object_links.target_type = ? AND object_links.target_id = ?)
        )
      ORDER BY object_links.created_at DESC
    `).all(user.id, sourceType, sourceId, sourceType, sourceId)
  }

  return db.prepare(`
    SELECT
      object_links.*,
      source_item.title AS source_title,
      target_item.title AS target_title,
      source_experiment.title AS source_experiment_title,
      target_experiment.title AS target_experiment_title
    FROM object_links
    LEFT JOIN cognitive_items AS source_item
      ON source_item.user_id = object_links.user_id
     AND source_item.item_type = object_links.source_type
     AND source_item.id = object_links.source_id
    LEFT JOIN cognitive_items AS target_item
      ON target_item.user_id = object_links.user_id
     AND target_item.item_type = object_links.target_type
     AND target_item.id = object_links.target_id
    LEFT JOIN experiments AS source_experiment
      ON source_experiment.user_id = object_links.user_id
     AND object_links.source_type = 'experiment'
     AND source_experiment.id = object_links.source_id
    LEFT JOIN experiments AS target_experiment
      ON target_experiment.user_id = object_links.user_id
     AND object_links.target_type = 'experiment'
     AND target_experiment.id = object_links.target_id
    WHERE object_links.user_id = ? AND object_links.status = 'active'
    ORDER BY object_links.created_at DESC
  `).all(user.id)
})
