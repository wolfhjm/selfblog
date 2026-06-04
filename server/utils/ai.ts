export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type ConversationMode = 'explore' | 'structured'
export type AiProvider = 'glm' | 'newapi' | 'sub2'

export interface AiPreference {
  provider: AiProvider
  model: string
}

interface AiResolvedConfig extends AiPreference {
  baseUrl: string
  apiKey: string
  wireApi: string
}

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

async function requestAiJson(path: 'chat/completions' | 'responses', body: Record<string, unknown>, aiConfig: AiResolvedConfig) {
  const endpoint = aiEndpoint(path, aiConfig.baseUrl)
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
          Authorization: `Bearer ${aiConfig.apiKey}`
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

export async function callAi(messages: ChatMessage[], options: { temperature?: number, userId?: number } = {}) {
  const aiConfig = resolveAiConfig(options.userId)
  if (!aiConfig.apiKey) {
    throw createError({
      statusCode: 424,
      statusMessage: `${aiConfig.provider} API Key 未配置，请检查 .env`
    })
  }

  if (aiConfig.wireApi === 'responses') {
    return callResponsesApi(messages, aiConfig, options)
  }

  return callChatCompletionsApi(messages, aiConfig, options)
}

function aiEndpoint(path: 'chat/completions' | 'responses', inputBaseUrl: string) {
  const baseUrl = String(inputBaseUrl || '').replace(/\/$/, '')
  if (baseUrl.endsWith(`/${path}`)) return baseUrl
  if (baseUrl.endsWith('/v1') || baseUrl.endsWith('/v4')) return `${baseUrl}/${path}`
  return `${baseUrl}/${path}`
}

async function callChatCompletionsApi(messages: ChatMessage[], aiConfig: AiResolvedConfig, options: { temperature?: number } = {}) {
  const data = await requestAiJson('chat/completions', {
    model: aiConfig.model,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: 1400
  }, aiConfig)
  const content = data?.choices?.[0]?.message?.content
  if (!content) {
    throw createError({ statusCode: 502, statusMessage: 'AI 返回格式异常，没有找到回复内容' })
  }
  return String(content)
}

async function callResponsesApi(messages: ChatMessage[], aiConfig: AiResolvedConfig, options: { temperature?: number } = {}) {
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
    model: aiConfig.model,
    instructions: systemText || undefined,
    input,
    temperature: options.temperature ?? 0.7,
    max_output_tokens: 1400
  }, aiConfig)
  const content = data?.output_text
    || data?.output?.flatMap((item: any) => item?.content || [])
      ?.map((item: any) => item?.text || '')
      ?.join('')

  if (!content) {
    throw createError({ statusCode: 502, statusMessage: 'AI 返回格式异常，没有找到 Responses 回复内容' })
  }
  return String(content)
}

export function getAiRuntimeSummary(userId?: number) {
  const config = resolveAiConfig(userId)
  return {
    provider: config.provider,
    baseUrl: config.baseUrl,
    model: config.model,
    wireApi: config.wireApi,
    hasApiKey: Boolean(config.apiKey)
  }
}

export function availableAiModels(userId?: number) {
  const config = useRuntimeConfig()
  const preference = getAiPreference(userId)
  const glmModel = String(config.glmModel || 'glm-4-plus')
  const newapiModels = splitModels(String(config.newapiModels || 'glm-4.7,glm-5.1,glm-4.6'))
  const sub2Models = splitModels(String(config.sub2Models || 'gpt-5.5,gpt-5.4,gpt-5.1,gpt-5'))
  const groups = [
    {
      label: 'GLM 官方',
      provider: 'glm' as const,
      models: uniqueModels([glmModel])
    },
    {
      label: 'New API',
      provider: 'newapi' as const,
      models: uniqueModels([String(config.newapiModel || 'glm-4.7'), ...newapiModels])
    },
    {
      label: 'sub2',
      provider: 'sub2' as const,
      models: uniqueModels([String(config.sub2Model || 'gpt-5.5'), ...sub2Models])
    }
  ]

  const items = groups.flatMap((group) => group.models.map((model) => ({
    label: `${group.label} · ${model}`,
    value: `${group.provider}:${model}`,
    provider: group.provider,
    model
  })))
  const currentValue = `${preference.provider}:${preference.model}`
  if (!items.some((item) => item.value === currentValue)) {
    items.unshift({
      label: `当前 · ${preference.model}`,
      value: currentValue,
      provider: preference.provider,
      model: preference.model
    })
  }

  return {
    current: preference,
    items
  }
}

export function getAiPreference(userId?: number): AiPreference {
  const runtimeProvider = normalizeAiProvider(String(useRuntimeConfig().aiProvider || 'glm'))
  const fallback = normalizeAiPreference({
    provider: runtimeProvider,
    model: String(useRuntimeConfig().aiModel || '')
  })
  if (!userId) return fallback

  const stored = getDb().prepare(`
    SELECT provider, model
    FROM ai_preferences
    WHERE user_id = ?
  `).get(userId) as Partial<AiPreference> | undefined

  return normalizeAiPreference(stored || fallback)
}

export function setAiPreference(userId: number, preference: AiPreference) {
  const normalized = normalizeAiPreference(preference)
  getDb().prepare(`
    INSERT INTO ai_preferences (user_id, provider, model, updated_at)
    VALUES (@user_id, @provider, @model, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id) DO UPDATE SET
      provider = excluded.provider,
      model = excluded.model,
      updated_at = CURRENT_TIMESTAMP
  `).run({ user_id: userId, ...normalized })
  return normalized
}

function resolveAiConfig(userId?: number): AiResolvedConfig {
  const config = useRuntimeConfig()
  const preference = getAiPreference(userId)
  if (preference.provider === 'sub2') {
    return {
      ...preference,
      baseUrl: String(config.sub2BaseUrl || config.aiBaseUrl || ''),
      apiKey: String(config.sub2ApiKey || ''),
      wireApi: String(config.sub2WireApi || config.aiWireApi || 'responses')
    }
  }

  if (preference.provider === 'newapi') {
    return {
      ...preference,
      baseUrl: String(config.newapiBaseUrl || config.aiBaseUrl || ''),
      apiKey: String(config.newapiApiKey || ''),
      wireApi: String(config.newapiWireApi || 'chat_completions')
    }
  }

  return {
    ...preference,
    baseUrl: String(config.glmBaseUrl || config.aiBaseUrl || ''),
    apiKey: String(config.glmApiKey || config.aiApiKey || ''),
    wireApi: String(config.glmWireApi || 'chat_completions')
  }
}

function normalizeAiPreference(input: Partial<AiPreference>): AiPreference {
  const provider = normalizeAiProvider(input.provider)
  const config = useRuntimeConfig()
  const fallbackModel = provider === 'sub2'
    ? config.sub2Model
    : provider === 'newapi'
      ? config.newapiModel
      : config.glmModel
  const model = String(input.model || fallbackModel || '').trim()
  return {
    provider,
    model: model || defaultModelForProvider(provider)
  }
}

function normalizeAiProvider(provider?: string | null): AiProvider {
  return provider === 'newapi' || provider === 'sub2' ? provider : 'glm'
}

function defaultModelForProvider(provider: AiProvider) {
  if (provider === 'sub2') return 'gpt-5.5'
  if (provider === 'newapi') return 'glm-4.7'
  return 'glm-4-plus'
}

function splitModels(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean)
}

function uniqueModels(models: string[]) {
  return Array.from(new Set(models.map((model) => model.trim()).filter(Boolean)))
}
