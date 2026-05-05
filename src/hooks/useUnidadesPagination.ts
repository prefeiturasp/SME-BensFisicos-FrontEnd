import { useMemo } from 'react';

export type UnidadesPaginationItem =
  | { type: 'page'; value: number; id: string }
  | { type: 'ellipsis'; id: string };

interface UseUnidadesPaginationProps {
  page: number;
  totalItems: number;
  pageSize: number;
}

export function useUnidadesPagination({
  page,
  totalItems,
  pageSize,
}: Readonly<UseUnidadesPaginationProps>) {
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalItems / pageSize)),
    [totalItems, pageSize],
  );

  const pages = useMemo<UnidadesPaginationItem[]>(() => {
    const result: UnidadesPaginationItem[] = [];

    if (totalPages <= 7) {
      for (let current = 1; current <= totalPages; current += 1) {
        result.push({ type: 'page', value: current, id: `page-${current}` });
      }

      return result;
    }

    result.push({ type: 'page', value: 1, id: 'page-1' });

    if (page > 4) {
      result.push({ type: 'ellipsis', id: 'start' });
    }

    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);

    for (let current = start; current <= end; current += 1) {
      result.push({ type: 'page', value: current, id: `page-${current}` });
    }

    if (page < totalPages - 3) {
      result.push({ type: 'ellipsis', id: 'end' });
    }

    result.push({ type: 'page', value: totalPages, id: `page-${totalPages}` });

    return result;
  }, [page, totalPages]);

  return {
    totalPages,
    pages,
  };
}