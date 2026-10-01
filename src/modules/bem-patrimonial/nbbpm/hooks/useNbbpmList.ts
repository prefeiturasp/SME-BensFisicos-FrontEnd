import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { getErrorMessage } from '@/lib/unidades-list-page';
import { nbbpmService } from '../services/nbbpm.service';
import type { NbbpmListItem } from '../types/nbbpm.types';
import {
  NBBPM_DEFAULT_SORT,
  buildNbbpmOrdering,
  toggleNbbpmSort,
  type NbbpmSort,
  type NbbpmSortField,
} from '../utils/ordering';

const SEARCH_DEBOUNCE_MS = 350;
const LIST_ERROR_MESSAGE = 'Erro ao listar NBBPMs.';

interface UseNbbpmListProps {
  pageSize: number;
}

export function useNbbpmList({ pageSize }: Readonly<UseNbbpmListProps>) {
  const [items, setItems] = useState<NbbpmListItem[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<NbbpmSort>(NBBPM_DEFAULT_SORT);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const ordering = useMemo(() => buildNbbpmOrdering(sort), [sort]);

  useEffect(() => {
    const timeout = globalThis.setTimeout(() => {
      const trimmed = searchInput.trim();

      // O timeout dispara a cada mudança de `searchInput`, inclusive a
      // primeira execução no mount (searchInput === ''). Só reseta a página
      // quando o termo de busca efetivamente mudou — senão, qualquer
      // interação do usuário que dure mais que o debounce (paginação,
      // ordenação) teria a página resetada por este efeito "fantasma".
      setSearch((current) => {
        if (current === trimmed) return current;
        setPage(1);
        return trimmed;
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => globalThis.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(false);

      try {
        const data = await nbbpmService.list({
          page,
          pageSize,
          search: search || undefined,
          ordering,
        });

        if (!active) return;

        setItems(data.results);
        setCount(data.count);
      } catch (err) {
        if (!active) return;

        setItems([]);
        setCount(0);
        setError(true);
        toast.error(getErrorMessage(err, LIST_ERROR_MESSAGE));
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [page, pageSize, search, ordering]);

  const handleSort = (field: NbbpmSortField) => {
    setSort((current) => toggleNbbpmSort(current, field));
    setPage(1);
  };

  return {
    items,
    count,
    loading,
    error,
    page,
    sort,
    searchInput,
    setPage,
    setSearchInput,
    handleSort,
  };
}
