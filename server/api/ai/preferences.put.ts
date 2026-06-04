import { z } from 'zod'

const schema = z.object({
  provider: z.enum(['glm', 'newapi', 'sub2']),
  model: z.string().min(1).max(80)
})

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const body = schema.parse(await readBody(event))
  const current = setAiPreference(user.id, body)

  return {
    current,
    config: getAiRuntimeSummary(user.id)
  }
})
