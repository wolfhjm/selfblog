export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type ConversationMode = 'explore' | 'structured'

const exploreSystemPrompt = `
你是一个陪伴型的个人成长教练。你的用户正在通过这个网站认识自己、建立原则、尝试新事物。
你的角色不是心理医生、命令者或评判者。你不会诊断、开药、恐吓或责备。
你的角色是像一个真正关心用户的朋友，问对的问题，帮助用户发现模式和矛盾。
当用户说“不知道”时，给具体选项；当目标太大时，拆成 30 分钟内的最小可行动作。
用中文交流，温暖但直接。每次回复不要太长，像一个真人在聊天。适当追问，不轻易放过模糊回答。
`

const structuredSystemPrompt = `
你是个人成长 OS 的结构化追问助手。你的目标不是直接总结，而是帮助用户把经历拆清楚。
请围绕“客观环境 -> 具体事件 -> 身体信号 -> 情绪感受 -> 当时解释 -> 隐藏需求/恐惧 -> 可验证洞察”推进。
一次只问一个最值得回答的问题；如果用户描述很散，先帮他拆成 2-4 个小事件供选择。
感受必须尽量挂到某个事件、环境或解释上，不要让情绪独立漂浮。
洞察必须追问证据和反例，避免漂亮但无根的结论。
不要诊断，不要责备，不要急着给建议。可以温暖，但要具体、耐心、略微有结构。
回复格式尽量短：先用一两句话复述你抓到的线索，再提出一个问题。
`

export function normalizeConversationMode(mode?: string | null): ConversationMode {
  return mode === 'structured' ? 'structured' : 'explore'
}

export function withConversationPrompt(messages: ChatMessage[], mode?: string | null) {
  const prompt = normalizeConversationMode(mode) === 'structured'
    ? structuredSystemPrompt
    : exploreSystemPrompt

  return [{ role: 'system' as const, content: prompt.trim() }, ...messages]
}

export function withExplorePrompt(messages: ChatMessage[]) {
  return withConversationPrompt(messages, 'explore')
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

function compactNetworkError(error: any, endpoint: string) {
  let host = 'AI 上游'
  try {
    host = new URL(endpoint).host
  } catch {
    // Keep the generic host label when endpoint parsing fails.
  }

  const code = error?.cause?.code || error?.code
  if (code === 'UND_ERR_CONNECT_TIMEOUT' || /timeout/i.test(String(error?.message || ''))) {
    return `连接 ${host} 超时，请稍后重试或切换 AI_BASE_URL/线路`
  }

  return `无法连接到 ${host}：${String(error?.message || '网络请求失败').replace(/\s+/g, ' ').slice(0, 160)}`
}

async function requestAiJson(path: 'chat/completions' | 'responses', body: Record<string, unknown>) {
  const config = useRuntimeConfig()
  const endpoint = aiEndpoint(path)
  let lastStatus = 500
  let lastStatusText = 'AI request failed'
  let lastDetail = ''

  for (let attempt = 0; attempt < 3; attempt += 1) {
    let response: Response
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.aiApiKey}`
        },
        body: JSON.stringify(body)
      })
    } catch (error: any) {
      lastStatus = 504
      lastStatusText = 'AI 网络连接失败'
      lastDetail = compactNetworkError(error, endpoint)

      if (attempt === 2) break
      await sleep(600 * (attempt + 1))
      continue
    }

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
