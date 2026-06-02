import { z } from 'zod'

const schema = z.object({
  period_type: z.enum(['week', 'month', 'custom']).default('week'),
  start_date: z.string().optional().default(''),
  end_date: z.string().optional().default('')
})

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const body = schema.parse(await readBody(event))
  const input = normalizePeriodReviewInput({
    periodType: body.period_type,
    startDate: body.start_date,
    endDate: body.end_date
  })
  const db = getDb()
  const sources = collectPeriodReviewSources(db, user.id, input)
  const sourceSummary = summarizePeriodReviewSources(sources)
  const title = `${input.startDate} 至 ${input.endDate} 周期回顾`

  try {
    const content = await callAi([
      {
        role: 'system',
        content: [
          '你是个人成长 OS 的周期回顾助手。你的任务是把一段时间里的打卡、日记、实验和候选入库整理成可回看的中文周期复盘。',
          '不要诊断，不要道德评价，不要泛泛鼓励。请从证据出发，把事件、情绪、身体状态、解释、隐藏需求、实验结果串起来。',
          '必须输出 Markdown，结构固定为：',
          '## 这段时间发生了什么',
          '## 重复出现的事件链',
          '## 情绪与身体状态',
          '## 可能的信念和隐藏需求',
          '## 实验与行动反馈',
          '## 已入库或值得入库的洞察',
          '## 下周期一个很小的动作',
          '每个部分 1-4 条。最后的小动作必须能在 30 分钟内完成，并尽量包含 Fogg MAP：动机、能力、提示。'
        ].join('\n')
      },
      {
        role: 'user',
        content: JSON.stringify({
          period: input,
          sourceSummary,
          sources
        }, null, 2)
      }
    ], { temperature: 0.35 })

    return {
      period_type: input.periodType,
      start_date: input.startDate,
      end_date: input.endDate,
      title,
      content: content.trim(),
      source_summary: sourceSummary,
      fallback: false
    }
  } catch (error: any) {
    return {
      period_type: input.periodType,
      start_date: input.startDate,
      end_date: input.endDate,
      title,
      content: fallbackPeriodReviewDraft(input, sources),
      source_summary: {
        ...sourceSummary,
        fallback_reason: readableAiError(error)
      },
      fallback: true
    }
  }
})

function readableAiError(error: any) {
  return String(error?.message || error?.statusMessage || 'AI 生成失败').replace(/\s+/g, ' ').slice(0, 180)
}
