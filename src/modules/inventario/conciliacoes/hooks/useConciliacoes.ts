import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { conciliacoesService } from '../services/conciliacoes.service';
import type {
  ConciliacaoItemDetail,
  ConciliacaoItemSituacaoFilter,
  ConciliacaoItemSortableField,
  ConciliacaoOcorrenciaPayload,
  ConciliacaoSituacaoDisponivel,
  ConciliacaoStatusFilter,
  ConciliacaoTipoFilter,
  CreateConciliacaoPayload,
} from '../types/conciliacoes.types';

interface UseConciliacoesListParams {
  pageSize: number;
}

interface UseConciliacaoItensParams {
  conciliacaoId: number;
  pageSize: number;
}

const DEFAULT_LIST_ORDERING = '-criado_em';
const DEFAULT_ITENS_ORDERING: ConciliacaoItemSortableField = 'bem__numero_patrimonial';

export function useConciliacoesList({ pageSize }: UseConciliacoesListParams) {
  const [page, setPage] = useState(1);
  const [ordering, setOrdering] = useState(DEFAULT_LIST_ORDERING);
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

export function useConciliacaoById(id: number | null) {
  return useQuery({
    queryKey: ['conciliacao', id],
    queryFn: () => conciliacoesService.retrieve(id as number),
    enabled: Boolean(id),
  });
}

export function useConciliacaoFinalizar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => conciliacoesService.finalizar(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conciliacoes'] });
      queryClient.invalidateQueries({ queryKey: ['conciliacao', data.id] });
      queryClient.invalidateQueries({ queryKey: ['conciliacao', data.id, 'itens'] });
    },
  });
}

export function useConciliacaoItens({ conciliacaoId, pageSize }: UseConciliacaoItensParams) {
  const [page, setPage] = useState(1);
  const [ordering, setOrdering] = useState<ConciliacaoItemSortableField>(DEFAULT_ITENS_ORDERING);
  const [numeroPatrimonialInput, setNumeroPatrimonialInput] = useState('');
  const [nomeInput, setNomeInput] = useState('');
  const [situacaoFilter, setSituacaoFilter] = useState<ConciliacaoItemSituacaoFilter>('todos');

  const numeroPatrimonial = useDebouncedValue(numeroPatrimonialInput);
  const nome = useDebouncedValue(nomeInput);

  const query = useQuery({
    queryKey: [
      'conciliacao',
      conciliacaoId,
      'itens',
      page,
      pageSize,
      numeroPatrimonial,
      nome,
      situacaoFilter,
      ordering,
    ],
    queryFn: () =>
      conciliacoesService.listItens(conciliacaoId, {
        page,
        pageSize,
        numeroPatrimonial,
        nome,
        situacao: situacaoFilter,
        ordering,
      }),
    enabled: Boolean(conciliacaoId),
  });

  return {
    itens: query.data?.results ?? [],
    count: query.data?.count ?? 0,
    loading: query.isLoading,
    fetching: query.isFetching,
    error: query.error,
    page,
    ordering,
    numeroPatrimonialInput,
    nomeInput,
    situacaoFilter,
    setPage,
    setOrdering,
    setNumeroPatrimonialInput: (value: string) => {
      setPage(1);
      setNumeroPatrimonialInput(value);
    },
    setNomeInput: (value: string) => {
      setPage(1);
      setNomeInput(value);
    },
    setSituacaoFilter: (value: ConciliacaoItemSituacaoFilter) => {
      setPage(1);
      setSituacaoFilter(value);
    },
  };
}

function useDebouncedValue<T>(value: T, delay = 500): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = globalThis.setTimeout(() => setDebounced(value), delay);
    return () => globalThis.clearTimeout(timer);
  }, [delay, value]);

  return debounced;
}

export function useConciliacaoItem(
  conciliacaoId: number | null,
  itemId: number | null,
) {
  return useQuery({
    queryKey: ['conciliacao', conciliacaoId, 'item', itemId],
    queryFn: () =>
      conciliacoesService.retrieveItem(conciliacaoId as number, itemId as number),
    enabled:
      Number.isInteger(conciliacaoId) &&
      Number.isInteger(itemId) &&
      (conciliacaoId as number) > 0 &&
      (itemId as number) > 0,
  });
}

export function useConciliacaoItemSituacoesDisponiveis(
  conciliacaoId: number | null,
  itemId: number | null,
) {
  return useQuery<ConciliacaoSituacaoDisponivel[]>({
    queryKey: ['conciliacao', conciliacaoId, 'item', itemId, 'situacoes-disponiveis'],
    queryFn: () =>
      conciliacoesService.listSituacoesDisponiveis(
        conciliacaoId as number,
        itemId as number,
      ),
    enabled:
      Number.isInteger(conciliacaoId) &&
      Number.isInteger(itemId) &&
      (conciliacaoId as number) > 0 &&
      (itemId as number) > 0,
  });
}

export function useConciliacaoOcorrenciaUpsert() {
  const queryClient = useQueryClient();

  return useMutation<
    ConciliacaoItemDetail,
    unknown,
    { conciliacaoId: number; itemId: number; payload: ConciliacaoOcorrenciaPayload }
  >({
    mutationFn: ({ conciliacaoId, itemId, payload }) =>
      conciliacoesService.upsertOcorrencia(conciliacaoId, itemId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conciliacao', data.conciliacao] });
      queryClient.invalidateQueries({
        queryKey: ['conciliacao', data.conciliacao, 'item', data.id],
      });
      queryClient.invalidateQueries({
        queryKey: ['conciliacao', data.conciliacao, 'item', data.id, 'situacoes-disponiveis'],
      });
      queryClient.invalidateQueries({
        queryKey: ['conciliacao', data.conciliacao, 'itens'],
      });
      queryClient.invalidateQueries({ queryKey: ['conciliacoes'] });
    },
  });
}

export function useConciliacaoOcorrenciaRemover() {
  const queryClient = useQueryClient();

  return useMutation<
    ConciliacaoItemDetail,
    unknown,
    { conciliacaoId: number; itemId: number }
  >({
    mutationFn: ({ conciliacaoId, itemId }) =>
      conciliacoesService.removerOcorrencia(conciliacaoId, itemId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conciliacao', data.conciliacao] });
      queryClient.invalidateQueries({
        queryKey: ['conciliacao', data.conciliacao, 'item', data.id],
      });
      queryClient.invalidateQueries({
        queryKey: ['conciliacao', data.conciliacao, 'item', data.id, 'situacoes-disponiveis'],
      });
      queryClient.invalidateQueries({
        queryKey: ['conciliacao', data.conciliacao, 'itens'],
      });
      queryClient.invalidateQueries({ queryKey: ['conciliacoes'] });
    },
  });
}
