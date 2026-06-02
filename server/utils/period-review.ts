type Db = ReturnType<typeof getDb>

export type PeriodReviewInput = {
  periodType: string
  startDate: string
  endDate: string
}

export function normalizePeriodReviewInput(input: PeriodReviewInput): PeriodReviewInput {
  const periodType = ['week', 'month', 'custom'].includes(input.periodType) ? input.periodType : 'week'
  const today = appDateString()
  const startDate = isDateString(input.startDate) ? input.startDate : today
  const endDate = isDateString(input.endDate) ? input.endDate : startDate

  return startDate <= endDate
    ? { periodType, startDate, endDate }
    : { periodType, startDate: endDate, endDate: startDate }
}

export function collectPeriodReviewSources(db: Db, userId: number, input: PeriodReviewInput) {
  const checkins = db.prepare(`
    SELECT id, date, done_text, feeling_text, mood
    FROM checkins
    WHERE user_id = ? AND date BETWEEN ? AND ?
    ORDER BY date ASC
  `).all(userId, input.startDate, input.endDate)

  const journals = db.prepare(`
    SELECT id, date, title, content
    FROM journal_summaries
    WHERE user_id = ? AND date BETWEEN ? AND ?
    ORDER BY date ASC, created_at ASC
  `).all(userId, input.startDate, input.endDate)

  const experiments = db.prepare(`
    SELECT id, title, description, status, reflection, barrier, target_behavior, failure_reason, completion_score, actual_behavior, learning, done_at, created_at
    FROM experiments
    WHERE user_id = ?
      AND (
        week_number BETWEEN ? AND ?
        OR date(created_at) BETWEEN ? AND ?
        OR (done_at IS NOT NULL AND date(done_at) BETWEEN ? AND ?)
      )
    ORDER BY created_at ASC
  `).all(userId, input.startDate, input.endDate, input.startDate, input.endDate, input.startDate, input.endDate)

  const candidates = db.prepare(`
    SELECT id, candidate_type, title, content, status, accepted_object_type, accepted_object_id, created_at, updated_at
    FROM candidates
    WHERE user_id = ?
      AND (
        date(created_at) BETWEEN ? AND ?
        OR date(updated_at) BETWEEN ? AND ?
      )
    ORDER BY updated_at ASC, created_at ASC
  `).all(userId, input.startDate, input.endDate, input.startDate, input.endDate)

  return { checkins, journals, experiments, candidates }
}

export function summarizePeriodReviewSources(sources: ReturnType<typeof collectPeriodReviewSources>) {
  return {
    checkins: sources.checkins.length,
    journals: sources.journals.length,
    experiments: sources.experiments.length,
    candidates: sources.candidates.length
  }
}

export function fallbackPeriodReviewDraft(input: PeriodReviewInput, sources: ReturnType<typeof collectPeriodReviewSources>) {
  const moodValues = sources.checkins
    .map((item: any) => Number(item.mood))
    .filter((value: number) => Number.isFinite(value))
  const moodAverage = moodValues.length
    ? (moodValues.reduce((sum: number, value: number) => sum + value, 0) / moodValues.length).toFixed(1)
    : '暂无'
  const topCheckins = sources.checkins
    .slice(0, 5)
    .map((item: any) => `- ${item.date}：${item.done_text || '未写事项'}；感受：${item.feeling_text || '未写'}`)
    .join('\n') || '- 暂无打卡记录'
  const topJournals = sources.journals
    .slice(0, 3)
    .map((item: any) => `- ${item.date}：${item.title}`)
    .join('\n') || '- 暂无日记小结'
  const topExperiments = sources.experiments
    .slice(0, 5)
    .map((item: any) => `- ${item.title}：${item.status}${item.completion_score ? `；完成度 ${item.completion_score}%` : ''}${item.learning ? `；学到：${item.learning}` : item.reflection ? `；复盘：${item.reflection}` : ''}`)
    .join('\n') || '- 暂无实验记录'
  const acceptedCandidates = sources.candidates.filter((item: any) => item.status === 'accepted').length

  return [
    `## 这段时间发生了什么`,
    topCheckins,
    '',
    `## 情绪与身体状态`,
    `- 平均情绪分数：${moodAverage}`,
    `- 可以回看这些感受里是否有重复词：${sources.checkins.map((item: any) => item.feeling_text).filter(Boolean).slice(0, 6).join('；') || '暂无'}`,
    '',
    `## 日记线索`,
    topJournals,
    '',
    `## 实验与行动`,
    topExperiments,
    '',
    `## 候选和入库`,
    `- 本周期产生候选 ${sources.candidates.length} 条，已确认 ${acceptedCandidates} 条。`,
    '',
    `## 可能值得继续追问`,
    `- 哪一类事件最容易触发情绪波动？`,
    `- 哪个行动不是缺意志力，而是缺能力、机会或提示？`,
    `- 有没有一个洞察已经有多个事件支持，值得升级为规律或原则？`,
    '',
    `## 下周期一个很小的动作`,
    `- 选择一个高频触发点，设计一个 30 分钟内能完成的 Fogg 小实验。`
  ].join('\n')
}

function isDateString(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || '')
}
