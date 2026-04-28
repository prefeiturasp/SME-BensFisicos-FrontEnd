import {
  createUnidadesListService,
} from '@/lib/unidades-list-service';
import type {
  PaginatedResponse,
  UnidadeOrcamentaria,
  UnidadeOrcamentariaExportFormat,
  UnidadeOrcamentariaExportResult,
  UnidadeOrcamentariaStatusFilter,
  UnidadesOrcamentariasListParams,
} from '../types/unidades-orcamentarias.types';

export const unidadesOrcamentariasService: {
  list(params?: UnidadesOrcamentariasListParams): Promise<PaginatedResponse<UnidadeOrcamentaria>>;
  exportar(
    formato: UnidadeOrcamentariaExportFormat,
    params?: Omit<UnidadesOrcamentariasListParams, 'page' | 'pageSize'>,
  ): Promise<UnidadeOrcamentariaExportResult>;
} = createUnidadesListService<
  UnidadeOrcamentaria,
  UnidadeOrcamentariaExportFormat,
  UnidadeOrcamentariaStatusFilter,
  'ativa',
  UnidadesOrcamentariasListParams
>({
  basePath: '/unidades-orcamentarias',
  fileNamePrefix: 'unidades-orcamentarias',
  listErrorMessage: 'Erro ao listar unidades orçamentárias.',
  exportErrorMessage: 'Erro ao exportar unidades orçamentárias.',
  statusParamName: 'ativa',
});