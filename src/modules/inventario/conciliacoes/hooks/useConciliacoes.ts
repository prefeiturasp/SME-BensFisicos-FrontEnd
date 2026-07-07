import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { conciliacoesService } from '../services/conciliacoes.service';
import type {
  ConciliacaoStatusFilter,
  ConciliacaoTipoFilter,
  CreateConciliacaoPayload,
} from '../types/conciliacoes.types';

interface UseConciliacoesListParams {
  pageSize: number;
}

const DEFAULT_ORDERING = '-criado_em';

export function useConciliacoesList({ pageSize }: UseConciliacoesListParams) {
  const [page, setPage] = useState(1);
  const [ordering, setOrdering] = useState(DEFAULT_ORDERING);
  const [searchInput, setSearchInput] = useState('');
  const [anoVigenciaInput, setAnoVigenciaInput] = useState('');
  const [tipoFilter, setTipoFilter] = useState<ConciliacaoTipoFilter>('todos');
  const [statusFilter, setStatusFilter] = useState<ConciliacaoStatusFilter>('todos');

  const search = useDebouncedValue(searchInput);
  const anoVigencia = useDebouncedValue(anoVigenciaInput);

  const query = useQuery({
    queryKey: [
      'conciliacoes',
      'list',
      page,
      pageSize,
      search,
      anoVigencia,
      tipoFilter,
      statusFilter,
      ordering,
    ],
    queryFn: () =>
      conciliacoesService.list({
        page,
        pageSize,
        search,
        anoVigencia,
        tipo: tipoFilter,
        status: statusFilter,
        ordering,
      }),
  });

  return {
    conciliacoes: query.data?.results ?? [],
    count: query.data?.count ?? 0,
    loading: query.isLoading,
    fetching: query.isFetching,
    error: query.error,
    page,
    ordering,
    searchInput,
    anoVigenciaInput,
    tipoFilter,
    statusFilter,
    setPage,
    setOrdering,
    setSearchInput: (value: string) => {
      setPage(1);
      setSearchInput(value);
    },
    setAnoVigenciaInput: (value: string) => {
      setPage(1);
      setAnoVigenciaInput(value);
    },
    setTipoFilter: (value: ConciliacaoTipoFilter) => {
      setPage(1);
      setTipoFilter(value);
    },
    setStatusFilter: (value: ConciliacaoStatusFilter) => {
      setPage(1);
      setStatusFilter(value);
    },
  };
}

export function useConciliacaoCreate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateConciliacaoPayload) => conciliacoesService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conciliacoes'] });
    },
  });
}

function useDebouncedValue(value: string, delay = 500) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = globalThis.setTimeout(() => setDebounced(value), delay);
    return () => globalThis.clearTimeout(timer);
  }, [delay, value]);

  return debounced;
}
