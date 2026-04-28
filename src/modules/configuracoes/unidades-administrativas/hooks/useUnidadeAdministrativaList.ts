import { useUnidadesListQuery } from '@/hooks/useUnidadesListQuery';
import { unidadesAdministrativasService } from '../services/unidades-administrativas.service';
import type {
  UAStatusFilter,
  UnidadesAdministrativasListParams,
} from '../types/unidades-administrativas.types';

interface UseUnidadeAdministrativaListProps {
  pageSize: number;
}

export function useUnidadeAdministrativaList({ pageSize }: UseUnidadeAdministrativaListProps) {
  const listState = useUnidadesListQuery<
    Awaited<ReturnType<typeof unidadesAdministrativasService.list>>['results'][number],
    UAStatusFilter,
    UnidadesAdministrativasListParams
  >({
    queryKey: 'unidades-administrativas',
    pageSize,
    initialStatus: 'todos',
    buildParams: ({ page, codigo, nomeOuSigla, ordering, statusFilter }) => ({
      page,
      pageSize,
      codigo,
      nomeOuSigla,
      status: statusFilter,
      ordering,
    }),
    queryFn: unidadesAdministrativasService.list,
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
