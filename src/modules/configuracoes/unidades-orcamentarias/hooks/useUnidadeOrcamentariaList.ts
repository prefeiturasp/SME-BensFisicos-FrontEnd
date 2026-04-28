import { useUnidadesListQuery } from '@/hooks/useUnidadesListQuery';
import { unidadesOrcamentariasService } from '../services/unidades-orcamentarias.service';
import type {
  UnidadeOrcamentariaStatusFilter,
  UnidadesOrcamentariasListParams,
} from '../types/unidades-orcamentarias.types';

interface UseUnidadeOrcamentariaListProps {
  pageSize: number;
}

export function useUnidadeOrcamentariaList({
  pageSize,
}: UseUnidadeOrcamentariaListProps) {
  const listState = useUnidadesListQuery<
    Awaited<ReturnType<typeof unidadesOrcamentariasService.list>>['results'][number],
    UnidadeOrcamentariaStatusFilter,
    UnidadesOrcamentariasListParams
  >({
    queryKey: 'unidades-orcamentarias',
    pageSize,
    initialStatus: 'todos',
    buildParams: ({ page, codigo, nomeOuSigla, ordering, statusFilter }) => ({
      page,
      pageSize,
      codigo,
      nomeOuSigla,
      ativa: statusFilter,
      ordering,
    }),
    queryFn: unidadesOrcamentariasService.list,
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
}