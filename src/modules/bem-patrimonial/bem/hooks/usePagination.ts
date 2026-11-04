import { useMemo } from 'react'

interface UsePaginationProps {
  page: number
  totalItems: number
  pageSize: number
}

export function usePagination({
  page,
  totalItems,
  pageSize,
}: UsePaginationProps) {
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalItems / pageSize)),
    [totalItems, pageSize]
  )

  const pages = useMemo<(number | string)[]>(() => {
    const result: (number | string)[] = []

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) result.push(i)
      return result
    }

    result.push(1)

    if (page > 4) result.push('...')

    const start = Math.max(2, page - 1)
    const end = Math.min(totalPages - 1, page + 1)

    for (let i = start; i <= end; i++) {
      result.push(i)
    }

    if (page < totalPages - 3) result.push('...')

    result.push(totalPages)

    return result
  }, [page, totalPages])

  return {
    totalPages,
    pages,
  }
}