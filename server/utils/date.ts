export function appDateString(date = new Date()) {
  const timeZone = process.env.APP_TIME_ZONE || 'Asia/Shanghai'
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date)
}
