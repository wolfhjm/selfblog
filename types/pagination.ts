export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  pageCount: number
  hasPrev: boolean
  hasNext: boolean
}

export function emptyPaginatedResponse<T>(pageSize = 20): PaginatedResponse<T> {
  return {
    items: [],
    total: 0,
    page: 1,
    pageSize,
    pageCount: 1,
    hasPrev: false,
    hasNext: false
  }
}
