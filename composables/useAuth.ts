export function useAuth() {
  const user = useState<any | null>('auth:user', () => null)

  async function refresh() {
    const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined
    const data = await $fetch<{ user: any | null }>('/api/auth/me', { headers })
    user.value = data.user
    return user.value
  }

  async function login(email: string, password: string) {
    const data = await $fetch<{ user: any }>('/api/auth/login', {
      method: 'POST',
      body: { email, password }
    })
    user.value = data.user
    return data.user
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    await navigateTo('/login')
  }

  return { user, refresh, login, logout }
}
