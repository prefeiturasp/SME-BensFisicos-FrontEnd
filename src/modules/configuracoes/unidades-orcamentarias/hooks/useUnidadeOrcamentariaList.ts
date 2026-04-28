import { createUseUnidadesList } from '@/hooks/useUnidadesListQuery';
import { unidadesOrcamentariasService } from '../services/unidades-orcamentarias.service';
import type {
  UnidadeOrcamentariaStatusFilter,
  UnidadesOrcamentariasListParams,
} from '../types/unidades-orcamentarias.types';

export const useUnidadeOrcamentariaList = createUseUnidadesList<
  Awaited<ReturnType<typeof unidadesOrcamentariasService.list>>['results'][number],
  UnidadeOrcamentariaStatusFilter,
  'ativa',
  UnidadesOrcamentariasListParams
>({
  queryKey: 'unidades-orcamentarias',
  initialStatus: 'todos',
  statusParamName: 'ativa',
  queryFn: unidadesOrcamentariasService.list,
});