const aiConfig = aiProviderConfig()

export default defineNuxtConfig({
  compatibilityDate: '2026-05-27',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@pinia/nuxt', '@vueuse/nuxt'],
  fonts: {
    provider: 'none'
  },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: '个人成长 OS',
      meta: [
        { name: 'description', content: 'AI 陪伴的个人成长操作系统' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#f8fafc' }
      ],
      link: [
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'icon', href: '/icon.svg' }
      ]
    }
  },
  runtimeConfig: {
    sessionSecret: process.env.SESSION_SECRET || 'dev-session-secret-change-me',
    adminEmail: process.env.ADMIN_EMAIL || 'you@example.com',
    adminPassword: process.env.ADMIN_PASSWORD || 'change-me-now',
    aiProvider: aiConfig.provider,
    aiBaseUrl: aiConfig.baseUrl,
    aiApiKey: aiConfig.apiKey,
    aiModel: aiConfig.model,
    aiWireApi: aiConfig.wireApi,
    public: {
      appName: '个人成长 OS'
    }
  },
  nitro: {
    experimental: {
      wasm: true
    }
  }
})

function aiProviderConfig() {
  const provider = process.env.AI_PROVIDER || 'glm'
  if (provider === 'newapi') {
    return {
      provider,
      baseUrl: process.env.NEWAPI_BASE_URL || process.env.AI_BASE_URL || 'http://119.29.173.211:13000/v1',
      apiKey: process.env.NEWAPI_API_KEY || process.env.AI_API_KEY || '',
      model: process.env.NEWAPI_MODEL || 'glm-4.7',
      wireApi: process.env.NEWAPI_WIRE_API || process.env.AI_WIRE_API || 'chat_completions'
    }
  }

  return {
    provider,
    baseUrl: process.env.AI_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4',
    apiKey: process.env.AI_API_KEY || process.env.GLM_API_KEY || '',
    model: process.env.AI_MODEL || 'glm-4-plus',
    wireApi: process.env.AI_WIRE_API || 'chat_completions'
  }
}
