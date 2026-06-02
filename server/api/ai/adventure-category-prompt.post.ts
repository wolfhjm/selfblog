import { z } from 'zod'

const schema = z.object({
  title: z.string().min(1),
  description: z.string().default(''),
  prompt_hint: z.string().default('')
})

export default defineEventHandler(async (event) => {
  requireUser(event)
  const body = schema.parse(await readBody(event))

  try {
    const prompt = await callAi([
      {
        role: 'system',
        content: [
          '你是个人成长 OS 的随机实验提示词编辑助手。',
          '请根据类别名和描述，写一段给 AI 生成实验用的中文提示词。',
          '要求：安全、低成本、可逆、30 分钟内完成；避免危险、违法、大额消费、强迫社交、羞辱或高风险冲突。',
          '提示词要说明这个类别的目标、边界和实验风格。只输出提示词本身。'
        ].join('\n')
      },
      { role: 'user', content: JSON.stringify(body, null, 2) }
    ], { temperature: 0.45 })

    return { prompt_hint: prompt.trim().slice(0, 500) }
  } catch {
    return {
      prompt_hint: `生成一个「${body.title}」类别下的随机大冒险实验。实验必须安全、低成本、可逆，能在 30 分钟内完成；重点是${body.description || '帮助用户获得一个新的经验样本'}。`
    }
  }
})
