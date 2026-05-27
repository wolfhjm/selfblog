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
    aiProvider: process.env.AI_PROVIDER || 'glm',
    aiBaseUrl: process.env.AI_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4',
    aiApiKey: process.env.AI_API_KEY || process.env.GLM_API_KEY || '',
    aiModel: process.env.AI_MODEL || 'glm-4-plus',
    aiWireApi: process.env.AI_WIRE_API || 'chat_completions',
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
