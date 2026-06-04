import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function loadDotEnv() {
  const envPath = resolve(process.cwd(), '.env')
  if (!existsSync(envPath)) return

  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!match) continue
    const [, key, rawValue] = match
    if (process.env[key]) continue
    process.env[key] = rawValue.replace(/^["']|["']$/g, '')
  }
}

function endpoint(baseUrl, wireApi) {
  const clean = baseUrl.replace(/\/$/, '')
  const path = wireApi === 'responses' ? 'responses' : 'chat/completions'
  if (clean.endsWith(`/${path}`)) return clean
  return `${clean}/${path}`
}

async function testChatCompletions(url, apiKey, model) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: '请只回复 OK，用于测试 API 连通性。' }],
      temperature: 0,
      max_tokens: 32
    })
  })
  const text = await response.text()
  return { status: response.status, ok: response.ok, text }
}

async function testResponses(url, apiKey, model) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      input: [{ role: 'user', content: [{ type: 'input_text', text: '请只回复 OK，用于测试 API 连通性。' }] }],
      temperature: 0,
      max_output_tokens: 32
    })
  })
  const text = await response.text()
  return { status: response.status, ok: response.ok, text }
}

async function testResponsesHistory(url, apiKey, model) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      instructions: 'Answer briefly.',
      input: [
        { role: 'user', content: [{ type: 'input_text', text: 'Remember this keyword: BLUE_NOTE. Reply only OK.' }] },
        { role: 'assistant', content: [{ type: 'output_text', text: 'OK' }] },
        { role: 'user', content: [{ type: 'input_text', text: 'What keyword did I ask you to remember? Reply only the keyword.' }] }
      ],
      temperature: 0,
      max_output_tokens: 32
    })
  })
  const text = await response.text()
  return { status: response.status, ok: response.ok, text }
}

loadDotEnv()

function providerConfig() {
  const provider = process.env.AI_PROVIDER || 'glm'
  if (provider === 'newapi') {
    return {
      provider,
      baseUrl: process.env.NEWAPI_BASE_URL || process.env.AI_BASE_URL || 'http://119.29.173.211:13000/v1',
      model: process.env.NEWAPI_MODEL || 'glm-4.7',
      wireApi: process.env.NEWAPI_WIRE_API || process.env.AI_WIRE_API || 'chat_completions',
      apiKey: process.env.NEWAPI_API_KEY || process.env.AI_API_KEY || ''
    }
  }

  return {
    provider,
    baseUrl: process.env.AI_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4',
    model: process.env.AI_MODEL || 'glm-4-plus',
    wireApi: process.env.AI_WIRE_API || 'chat_completions',
    apiKey: process.env.AI_API_KEY || process.env.GLM_API_KEY || ''
  }
}

const { provider, baseUrl, model, wireApi, apiKey } = providerConfig()

console.log(JSON.stringify({
  provider,
  baseUrl,
  model,
  wireApi,
  hasApiKey: Boolean(apiKey)
}, null, 2))

if (!apiKey) {
  console.error('AI_API_KEY is missing. Put it in .env or set it in the current shell.')
  process.exit(1)
}

const url = endpoint(baseUrl, wireApi)
const result = wireApi === 'responses'
  ? await testResponses(url, apiKey, model)
  : await testChatCompletions(url, apiKey, model)

console.log(JSON.stringify({
  endpoint: url,
  status: result.status,
  ok: result.ok,
  bodyPreview: result.text.replace(/\s+/g, ' ').slice(0, 800)
}, null, 2))

if (!result.ok) {
  process.exit(1)
}

if (wireApi === 'responses') {
  const historyResult = await testResponsesHistory(url, apiKey, model)
  console.log(JSON.stringify({
    endpoint: url,
    case: 'responses-history',
    status: historyResult.status,
    ok: historyResult.ok,
    bodyPreview: historyResult.text.replace(/\s+/g, ' ').slice(0, 800)
  }, null, 2))
  process.exit(historyResult.ok ? 0 : 1)
}

process.exit(0)
