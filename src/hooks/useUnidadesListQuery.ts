import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface PaginatedListResponse<TItem> {
  count: number;
  results: TItem[];
}

interface UnidadesListQueryState<TStatus extends string> {
  page: number;
  pageSize: number;
  codigo: string;
  nomeOuSigla: string;
  ordering: string;
  statusFilter: TStatus;
}

interface UseUnidadesListQueryOptions<TItem, TStatus extends string, TParams> {
  queryKey: string;
  pageSize: number;
  initialOrdering?: string;
  initialStatus: TStatus;
  buildParams: (state: UnidadesListQueryState<TStatus>) => TParams;
  queryFn: (params: TParams) => Promise<PaginatedListResponse<TItem>>;
}

interface UseUnidadesListProps {
  pageSize: number;
}

type UnidadesListParamsShape<TStatusParam extends string, TStatus extends string> = {
  page?: number;
  pageSize?: number;
  codigo?: string;
  nomeOuSigla?: string;
  ordering?: string;
} & Partial<Record<TStatusParam, TStatus>>;

interface CreateUseUnidadesListOptions<
  TItem,
  TStatus extends string,
  TStatusParam extends string,
  TParams extends UnidadesListParamsShape<TStatusParam, TStatus>,
> {
  queryKey: string;
  initialStatus: TStatus;
  statusParamName: TStatusParam;
  queryFn: (params: TParams) => Promise<PaginatedListResponse<TItem>>;
}

const SEARCH_DEBOUNCE_MS = 500;
const MIN_FILTER_CHARS = 2;

function normalizeTextFilter(value: string) {
  const normalized = value.trim();

  if (!normalized || normalized.length < MIN_FILTER_CHARS) {
    return '';
  }

  return normalized;
}

export function useUnidadesListQuery<TItem, TStatus extends string, TParams>({
  queryKey,
  pageSize,
  initialOrdering = 'codigo',
  initialStatus,
  buildParams,
  queryFn,
}: Readonly<UseUnidadesListQueryOptions<TItem, TStatus, TParams>>) {
  const [page, setPage] = useState(1);
  const [ordering, setOrdering] = useState(initialOrdering);

  const [codigoInput, setCodigoInput] = useState('');
  const [nomeOuSiglaInput, setNomeOuSiglaInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<TStatus>(initialStatus);

  const [codigoFilter, setCodigoFilter] = useState('');
  const [nomeOuSiglaFilter, setNomeOuSiglaFilter] = useState('');

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setCodigoFilter(normalizeTextFilter(codigoInput));
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [codigoInput]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setNomeOuSiglaFilter(normalizeTextFilter(nomeOuSiglaInput));
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [nomeOuSiglaInput]);

  const params = useMemo(
    () =>
      buildParams({
        page,
        pageSize,
        codigo: codigoFilter,
        nomeOuSigla: nomeOuSiglaFilter,
        ordering,
        statusFilter,
      }),
    [page, pageSize, codigoFilter, nomeOuSiglaFilter, ordering, statusFilter, buildParams],
  );

  const query = useQuery({
    queryKey: [queryKey, params],
    queryFn: () => queryFn(params),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (query.error instanceof Error) {
      toast.error(query.error.message);
    }
  }, [query.error]);

  const handleStatusFilterChange = (status: TStatus) => {
    setPage(1);
    setStatusFilter(status);
  };

  return {
    items: query.data?.results ?? [],
    count: query.data?.count ?? 0,
    loading: query.isLoading,
    fetching: query.isFetching,
    page,
    ordering,
    codigoInput,
    nomeOuSiglaInput,
    codigoFilter,
    nomeOuSiglaFilter,
    statusFilter,
    setPage,
    setOrdering,
    setCodigoInput,
    setNomeOuSiglaInput,
    setStatusFilter: handleStatusFilterChange,
  };
}

export function createUseUnidadesList<
  TItem,
  TStatus extends string,
  TStatusParam extends string,
  TParams extends UnidadesListParamsShape<TStatusParam, TStatus>,
>({
  queryKey,
  initialStatus,
  statusParamName,
  queryFn,
}: Readonly<CreateUseUnidadesListOptions<TItem, TStatus, TStatusParam, TParams>>) {
  return function useUnidadesList({ pageSize }: Readonly<UseUnidadesListProps>) {
    const listState = useUnidadesListQuery<TItem, TStatus, TParams>({
      queryKey,
      pageSize,
      initialStatus,
      buildParams: ({ page, codigo, nomeOuSigla, ordering, statusFilter }) =>
        ({
          page,
          pageSize,
          codigo,
          nomeOuSigla,
          ordering,
          [statusParamName]: statusFilter,
        }) as TParams,
      queryFn,
    });

    return {
      unidades: listState.items,
      count: listState.count,
      loading: listState.loading,
      fetching: listState.fetching,
      page: listState.page,
      ordering: listState.ordering,
      codigoInput: listState.codigoInput,
      nomeOuSiglaInput: listState.nomeOuSiglaInput,
      codigoFiltro: listState.codigoFilter,
      nomeOuSiglaFiltro: listState.nomeOuSiglaFilter,
      statusFilter: listState.statusFilter,
      setPage: listState.setPage,
      setOrdering: listState.setOrdering,
      setCodigoInput: listState.setCodigoInput,
      setNomeOuSiglaInput: listState.setNomeOuSiglaInput,
      setStatusFilter: listState.setStatusFilter,
    };
  };
}