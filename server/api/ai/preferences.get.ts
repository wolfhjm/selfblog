export default defineEventHandler((event) => {
  const user = requireUser(event)
  const models = availableAiModels(user.id)

  return {
    ...models,
    config: getAiRuntimeSummary(user.id)
  }
})
