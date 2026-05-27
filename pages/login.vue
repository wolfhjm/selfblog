<template>
  <div class="auth-page mx-auto grid min-h-[calc(100dvh-6rem)] w-full max-w-md place-items-center">
    <SectionCard title="登录个人成长 OS" description="默认账号来自 .env：ADMIN_EMAIL / ADMIN_PASSWORD。">
      <form class="space-y-4" @submit.prevent="submit">
        <UFormField label="邮箱">
          <UInput v-model="email" name="email" type="email" autocomplete="email" class="w-full" />
        </UFormField>
        <UFormField label="密码">
          <UInput v-model="password" name="password" type="password" autocomplete="current-password" class="w-full" />
        </UFormField>
        <UButton type="submit" block icon="i-lucide-log-in" :loading="loading">进入系统</UButton>
        <UAlert
          v-if="error"
          color="error"
          variant="soft"
          icon="i-lucide-circle-alert"
          :title="error"
        />
      </form>
      <template #actions>
        <UButton to="/public" color="neutral" variant="ghost" icon="i-lucide-globe-2">公开页</UButton>
      </template>
    </SectionCard>
  </div>
</template>

<script setup lang="ts">
const { login } = useAuth()
const email = ref('you@example.com')
const password = ref('change-me-now')
const loading = ref(false)
const error = ref('')

async function submit() {
  loading.value = true
  error.value = ''
  try {
    await login(email.value, password.value)
    await navigateTo('/')
  } catch (err: any) {
    error.value = err?.statusMessage || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>
