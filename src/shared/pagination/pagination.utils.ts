/**
 * Standardized pagination helpers for Prisma & controllers
 * Based on myshop_demo_api architecture
 */

export type PaginationMeta = {
  current_page: number;
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
};

/**
 * Helper to get Prisma skip/take and a wrapper function for the response
 */
export function getPagination(page: number = 1, limit: number = 20) {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.max(1, Number(limit) || 20);
  const skip = (p - 1) * l;
  const take = l;

  return {
    skip,
    take,
    page: p,
    limit: l,
    /**
     * Wraps the results into the standard response structure
     */
    wrap: <T>(items: T[], totalElements: number) => ({
      content: items,
      totalElements,
      totalPages: Math.ceil(totalElements / l),
      page: p,
      limit: l,
    }),
  };
}

/**
 * Helper to build standard PaginationMeta object for ApiResponse.withPagination
 */
export function buildPaginationMeta(
  total: number,
  currentPage: number,
  perPage: number,
  dataLength: number,
): PaginationMeta {
  const lastPage = total === 0 ? 1 : Math.ceil(total / perPage);
  const hasRows = dataLength > 0;
  const from = hasRows ? (currentPage - 1) * perPage + 1 : null;
  const to = hasRows ? from! + dataLength - 1 : null;

  return {
    current_page: currentPage,
    from,
    last_page: lastPage,
    per_page: perPage,
    to,
    total,
  };
}

