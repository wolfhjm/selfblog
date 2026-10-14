/**
 * Format an error into a readable string for display in toasts.
 * Detects HTML gateway error pages and returns a friendlier message.
 */
export function readableError(err: unknown, fallback: string): string {
  let message = fallback
  if (typeof err === 'string') {
    message = err
  } else if (err && typeof err === 'object') {
    const raw = err as {
      statusMessage?: string
      message?: string
      data?: { statusMessage?: string, message?: string, error?: string }
    }
    message = raw.statusMessage || raw.data?.statusMessage || raw.data?.message || raw.data?.error || raw.message || fallback
  } else if (err !== null && err !== undefined) {
    message = String(err)
  }
  if (/<\/?[a-z][\s\S]*>/i.test(message)) {
    return 'AI 上游返回了网关错误页面，请稍后再试或切换模型/线路。'
  }
  return message.replace(/\s+/g, ' ').slice(0, 180)
}
