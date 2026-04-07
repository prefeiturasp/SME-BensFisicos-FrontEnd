import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { unidadesAdministrativasService } from '../services/unidades-administrativas.service';
import type { UAStatusFilter } from '../types/unidades-administrativas.types';

interface UseUnidadeAdministrativaListProps {
  pageSize: number;
}

const SEARCH_DEBOUNCE_MS = 500;
const MIN_FILTER_CHARS = 2;

export function useUnidadeAdministrativaList({ pageSize }: UseUnidadeAdministrativaListProps) {
  const [page, setPage] = useState(1);
  const [ordering, setOrdering] = useState('codigo');

  const [codigoInput, setCodigoInput] = useState('');
  const [nomeOuSiglaInput, setNomeOuSiglaInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<UAStatusFilter>('todos');

  const [codigoFiltro, setCodigoFiltro] = useState('');
  const [nomeOuSiglaFiltro, setNomeOuSiglaFiltro] = useState('');

  const normalizeTextFilter = (value: string) => {
    const normalized = value.trim();

    if (!normalized) {
      return '';
    }

    if (normalized.length < MIN_FILTER_CHARS) {
      return '';
    }

    return normalized;
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setCodigoFiltro(normalizeTextFilter(codigoInput));
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [codigoInput]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setNomeOuSiglaFiltro(normalizeTextFilter(nomeOuSiglaInput));
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [nomeOuSiglaInput]);

  const queryKey = useMemo(
    () => [
      'unidades-administrativas',
      {
        page,
        pageSize,
        codigoFiltro,
        nomeOuSiglaFiltro,
        statusFilter,
        ordering,
      },
    ],
    [page, pageSize, codigoFiltro, nomeOuSiglaFiltro, statusFilter, ordering],
  );

  const query = useQuery({
    queryKey,
    queryFn: () =>
      unidadesAdministrativasService.list({
        page,
        pageSize,
        codigo: codigoFiltro,
        nomeOuSigla: nomeOuSiglaFiltro,
        status: statusFilter,
        ordering,
      }),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (query.error instanceof Error) {
      toast.error(query.error.message);
    }
  }, [query.error]);

  const handleStatusFilterChange = (status: UAStatusFilter) => {
    setPage(1);
    setStatusFilter(status);
  };

  return {
    unidades: query.data?.results ?? [],
    count: query.data?.count ?? 0,
    loading: query.isLoading,
    fetching: query.isFetching,
    page,
    ordering,
    codigoInput,
    nomeOuSiglaInput,
    codigoFiltro,
    nomeOuSiglaFiltro,
    statusFilter,
    setPage,
    setOrdering,
    setCodigoInput,
    setNomeOuSiglaInput,
    setStatusFilter: handleStatusFilterChange,
  };
}
