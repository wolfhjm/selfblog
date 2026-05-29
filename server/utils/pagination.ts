import type { H3Event } from 'h3'

export type Pagination = {
  page: number
  pageSize: number
  offset: number
}

export type PaginatedResult<T> = Pagination & {
  items: T[]
  total: number
  pageCount: number
  hasPrev: boolean
  hasNext: boolean
}

function positiveInteger(value: unknown, fallback: number) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 1) return fallback
  return Math.floor(parsed)
}

export function getPagination(event: H3Event, options: { defaultPageSize?: number, maxPageSize?: number } = {}): Pagination {
  const query = getQuery(event)
  const maxPageSize = options.maxPageSize ?? 100
  const defaultPageSize = Math.min(options.defaultPageSize ?? 20, maxPageSize)
  const page = positiveInteger(query.page, 1)
  const pageSize = Math.min(positiveInteger(query.pageSize, defaultPageSize), maxPageSize)

  return {
    page,
    pageSize,
    offset: (page - 1) * pageSize
  }
}

export function paginatedResult<T>(items: T[], total: number, pagination: Pagination): PaginatedResult<T> {
  const pageCount = Math.max(1, Math.ceil(total / pagination.pageSize))

  return {
    ...pagination,
    items,
    total,
    pageCount,
    hasPrev: pagination.page > 1,
    hasNext: pagination.page < pageCount
  }
}
