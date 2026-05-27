export default defineNuxtRouteMiddleware(async (to) => {
  const publicRoutes = ['/login', '/public']
  const isPublic = publicRoutes.some((path) => to.path === path || to.path.startsWith(`${path}/`))
  const { user, refresh } = useAuth()

  if (!user.value) {
    try {
      await refresh()
    } catch {
      user.value = null
    }
  }

  if (!user.value && !isPublic) {
    return navigateTo('/login')
  }

  if (user.value && to.path === '/login') {
    return navigateTo('/')
  }
})
