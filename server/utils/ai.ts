export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

const exploreSystemPrompt = `
你是一个陪伴型的个人成长教练。你的用户正在通过这个网站认识自己、建立原则、尝试新事物。
你的角色不是心理医生、命令者或评判者。你不会诊断、开药、恐吓或责备。
你的角色是像一个真正关心用户的朋友，问对的问题，帮助用户发现模式和矛盾。
当用户说“不知道”时，给具体选项；当目标太大时，拆成 30 分钟内的最小可行动作。
用中文交流，温暖但直接。每次回复不要太长，像一个真人在聊天。适当追问，不轻易放过模糊回答。
`

export function withExplorePrompt(messages: ChatMessage[]) {
  return [{ role: 'system' as const, content: exploreSystemPrompt.trim() }, ...messages]
}

function compactErrorDetail(detail: string, fallback: string) {
  const trimmed = detail.trim()
  if (!trimmed) return fallback
  if (/<!doctype html|<html/i.test(trimmed)) {
    const title = trimmed.match(/<title>(.*?)<\/title>/is)?.[1]
      ?.replace(/\s+/g, ' ')
      ?.trim()
    const cloudflare = /cloudflare/i.test(trimmed) ? 'Cloudflare 网关' : '上游服务'
    return `${cloudflare}返回 HTML 错误页面${title ? `：${title}` : ''}`
  }

  try {
    const parsed = JSON.parse(trimmed)
    const message = parsed?.error?.message || parsed?.message || parsed?.error
    if (message) return String(message).slice(0, 240)
  } catch {
    // Non-JSON error bodies are normalized below.
  }

  return trimmed.replace(/\s+/g, ' ').slice(0, 240)
}

function isRetriableStatus(status: number) {
  return status === 429 || status === 502 || status === 503 || status === 504
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function requestAiJson(path: 'chat/completions' | 'responses', body: Record<string, unknown>) {
  const config = useRuntimeConfig()
  const endpoint = aiEndpoint(path)
  let lastStatus = 500
  let lastStatusText = 'AI request failed'
  let lastDetail = ''

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.aiApiKey}`
      },
      body: JSON.stringify(body)
    })

    if (response.ok) {
      return response.json()
    }

    lastStatus = response.status
    lastStatusText = response.statusText
    lastDetail = await response.text().catch(() => '')

    if (!isRetriableStatus(response.status) || attempt === 2) break
    await sleep(600 * (attempt + 1))
  }

  throw createError({
    statusCode: lastStatus,
    statusMessage: 'AI 调用失败',
    message: `AI 调用失败：${compactErrorDetail(lastDetail, lastStatusText)}`
  })
}

export async function callAi(messages: ChatMessage[], options: { temperature?: number } = {}) {
  const config = useRuntimeConfig()
  if (!config.aiApiKey) {
    throw createError({
      statusCode: 424,
      statusMessage: 'AI_API_KEY 未配置，请在 .env 中设置 AI_API_KEY 或 GLM_API_KEY'
    })
  }

  const wireApi = String(config.aiWireApi || 'chat_completions')
  if (wireApi === 'responses') {
    return callResponsesApi(messages, options)
  }

  return callChatCompletionsApi(messages, options)
}

function aiEndpoint(path: 'chat/completions' | 'responses') {
  const config = useRuntimeConfig()
  const baseUrl = String(config.aiBaseUrl || '').replace(/\/$/, '')
  if (baseUrl.endsWith(`/${path}`)) return baseUrl
  if (baseUrl.endsWith('/v1') || baseUrl.endsWith('/v4')) return `${baseUrl}/${path}`
  return `${baseUrl}/${path}`
}

async function callChatCompletionsApi(messages: ChatMessage[], options: { temperature?: number } = {}) {
  const config = useRuntimeConfig()
  const data = await requestAiJson('chat/completions', {
    model: config.aiModel,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: 1400
  })
  const content = data?.choices?.[0]?.message?.content
  if (!content) {
    throw createError({ statusCode: 502, statusMessage: 'AI 返回格式异常，没有找到回复内容' })
  }
  return String(content)
}

async function callResponsesApi(messages: ChatMessage[], options: { temperature?: number } = {}) {
  const config = useRuntimeConfig()
  const systemText = messages
    .filter((message) => message.role === 'system')
    .map((message) => message.content)
    .join('\n\n')
  const input = messages
    .filter((message) => message.role !== 'system')
    .map((message) => ({
      role: message.role,
      content: [{
        type: message.role === 'assistant' ? 'output_text' : 'input_text',
        text: message.content
      }]
    }))

  const data = await requestAiJson('responses', {
    model: config.aiModel,
    instructions: systemText || undefined,
    input,
    temperature: options.temperature ?? 0.7,
    max_output_tokens: 1400
  })
  const content = data?.output_text
    || data?.output?.flatMap((item: any) => item?.content || [])
      ?.map((item: any) => item?.text || '')
      ?.join('')

  if (!content) {
    throw createError({ statusCode: 502, statusMessage: 'AI 返回格式异常，没有找到 Responses 回复内容' })
  }
  return String(content)
}

export function getAiRuntimeSummary() {
  const config = useRuntimeConfig()
  return {
    provider: config.aiProvider,
    baseUrl: config.aiBaseUrl,
    model: config.aiModel,
    wireApi: config.aiWireApi || 'chat_completions',
    hasApiKey: Boolean(config.aiApiKey)
  }
}
