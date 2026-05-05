import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { parametrosConciliacaoAnualService } from '../services/parametros-conciliacao-anual.service';
import type {
  ParametroConciliacaoStatusFilter,
  ParametroConciliacaoUpdatePayload,
} from '../types/parametros-conciliacao-anual.types';

interface UseParametrosListParams {
  pageSize: number;
}

interface UpdateParams {
  id: number;
  payload: ParametroConciliacaoUpdatePayload;
}

function useDebouncedValue(value: string, delay = 350) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [delay, value]);

  return debounced;
}

export function useParametrosConciliacaoAnualList({ pageSize }: UseParametrosListParams) {
  const [page, setPage] = useState(1);
  const [ordering, setOrdering] = useState('-ano_referencia');
  const [anoInput, setAnoInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<ParametroConciliacaoStatusFilter>('todos');

  const anoFiltro = useDebouncedValue(anoInput);

  const query = useQuery({
    queryKey: ['parametros-conciliacao-anual', page, pageSize, anoFiltro, statusFilter, ordering],
    queryFn: () =>
      parametrosConciliacaoAnualService.list({
        page,
        pageSize,
        anoReferencia: anoFiltro,
        ativo: statusFilter,
        ordering,
      }),
  });

  return {
    parametros: query.data?.results ?? [],
    count: query.data?.count ?? 0,
    loading: query.isLoading,
    fetching: query.isFetching,
    page,
    ordering,
    anoInput,
    anoFiltro,
    statusFilter,
    setPage,
    setOrdering,
    setAnoInput: (value: string) => {
      setPage(1);
      setAnoInput(value);
    },
    setStatusFilter: (value: ParametroConciliacaoStatusFilter) => {
      setPage(1);
      setStatusFilter(value);
    },
  };
}

export function useParametroConciliacaoAnualById(id: number | null) {
  return useQuery({
    queryKey: ['parametro-conciliacao-anual', id],
    queryFn: () => parametrosConciliacaoAnualService.retrieve(id as number),
    enabled: Boolean(id),
  });
}

export function useParametroConciliacaoAnualUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: UpdateParams) =>
      parametrosConciliacaoAnualService.update(id, payload),
    onSuccess: (parametro) => {
      queryClient.setQueryData(['parametro-conciliacao-anual', parametro.id], parametro);
      queryClient.invalidateQueries({ queryKey: ['parametros-conciliacao-anual'] });
    },
  });
}

export function useParametroConciliacaoAnualDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => parametrosConciliacaoAnualService.destroy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parametros-conciliacao-anual'] });
    },
  });
}
