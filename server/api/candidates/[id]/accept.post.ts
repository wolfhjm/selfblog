export default defineEventHandler((event) => {
  const user = requireUser(event)
  const id = Number(getRouterParam(event, 'id'))
  const db = getDb()
  const transaction = db.transaction(() => acceptCandidateById(db, user.id, id))

  return transaction()
})
