import { emptyPaginatedResponse, type PaginatedResponse } from '~/types/pagination'

type ExtraQuery = Record<string, unknown>

interface UsePaginatedFetchOptions {
  pageSize?: number
  /** Additional reactive query params merged alongside page/pageSize */
  extraQuery?: ComputedRef<ExtraQuery> | Ref<ExtraQuery>
}

/**
 * Unified paginated data fetching composable.
 *
 * Usage:
 *   const { data, page, refresh } = usePaginatedFetch<Checkin>('/api/checkins', { pageSize: 10 })
 *
 *   // With extra filters:
 *   const { data, page, refresh } = usePaginatedFetch<Candidate>('/api/candidates', {
 *     pageSize: 12,
 *     extraQuery: computed(() => ({ type: activeType.value === 'all' ? undefined : activeType.value }))
 *   })
 *
 * `page` is exposed so it can be bound directly to <PaginationBar>.
 * Changing `page` or any key in `extraQuery` automatically triggers a re-fetch.
 */
export function usePaginatedFetch<T>(
  url: string,
  options: UsePaginatedFetchOptions = {}
) {
  const { pageSize = 20, extraQuery } = options
  const page = ref(1)

  // Reset to first page whenever extra query params change
  if (extraQuery) {
    watch(extraQuery, () => { page.value = 1 })
  }

  const query = computed(() => ({
    page: page.value,
    pageSize,
    ...(extraQuery ? extraQuery.value : {})
  }))

  const { data, refresh, status } = useFetch<PaginatedResponse<T>>(url, {
    query,
    default: () => emptyPaginatedResponse<T>(pageSize)
  })

  return { data, page, refresh, status }
}
