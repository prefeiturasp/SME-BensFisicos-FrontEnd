import { useMemo } from 'react'

type PaginationItem =
  | { type: "page"; value: number }
  | { type: "ellipsis"; id: string }

type UsePaginationProps = {
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

  const pages = useMemo<PaginationItem[]>(() => {

    const result: PaginationItem[] = []

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        result.push({ type: "page", value: i })
      }
      return result
    }

    result.push({ type: "page", value: 1 })

    if (page > 4) {
      result.push({ type: "ellipsis", id: "start" })
    }

    const start = Math.max(2, page - 1)
    const end = Math.min(totalPages - 1, page + 1)

    for (let i = start; i <= end; i++) {
      result.push({ type: "page", value: i })
    }

    if (page < totalPages - 3)
      result.push({ type: "ellipsis", id: "end" })
    

    result.push({ type: "page", value: totalPages })

    return result

  }, [page, totalPages])

  return {
    totalPages,
    pages,
  }
}