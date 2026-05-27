export default defineEventHandler((event) => {
  const user = getCurrentUser(event)
  return { user }
})
