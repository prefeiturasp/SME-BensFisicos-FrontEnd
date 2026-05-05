import { createUseUnidadesList } from '@/hooks/useUnidadesListQuery';
import { unidadesAdministrativasService } from '../services/unidades-administrativas.service';
import type {
  UAStatusFilter,
  UnidadesAdministrativasListParams,
} from '../types/unidades-administrativas.types';

export const useUnidadeAdministrativaList = createUseUnidadesList<
  Awaited<ReturnType<typeof unidadesAdministrativasService.list>>['results'][number],
  UAStatusFilter,
  'status',
  UnidadesAdministrativasListParams
>({
  queryKey: 'unidades-administrativas',
  initialStatus: 'todos',
  statusParamName: 'status',
  queryFn: unidadesAdministrativasService.list,
});
