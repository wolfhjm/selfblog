export default defineEventHandler((event) => {
  const user = requireUser(event)
  const id = Number(getRouterParam(event, 'id'))
  const db = getDb()
  const eventCase = promoteExtractedEvent(db, user.id, id)

  return { id: eventCase.id, created: eventCase.created }
})
