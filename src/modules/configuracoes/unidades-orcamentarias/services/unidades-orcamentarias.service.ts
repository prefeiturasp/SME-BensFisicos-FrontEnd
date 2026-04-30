import { AxiosError } from 'axios';
import { api } from '@/api/http';
import { createUnidadesListService } from '@/lib/unidades-list-service';
import type {
  CreateUnidadeOrcamentariaPayload,
  PaginatedResponse,
  UnidadeOrcamentaria,
  UnidadeOrcamentariaExportFormat,
  UnidadeOrcamentariaExportResult,
  UnidadeOrcamentariaStatusFilter,
  UnidadesOrcamentariasListParams,
} from '../types/unidades-orcamentarias.types';

const baseUnidadesOrcamentariasService = createUnidadesListService<
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

export const unidadesOrcamentariasService: {
  list(params?: UnidadesOrcamentariasListParams): Promise<PaginatedResponse<UnidadeOrcamentaria>>;
  exportar(
    formato: UnidadeOrcamentariaExportFormat,
    params?: Omit<UnidadesOrcamentariasListParams, 'page' | 'pageSize'>,
  ): Promise<UnidadeOrcamentariaExportResult>;
  create(payload: CreateUnidadeOrcamentariaPayload): Promise<UnidadeOrcamentaria>;
} = {
  ...baseUnidadesOrcamentariasService,

  async create(payload: CreateUnidadeOrcamentariaPayload): Promise<UnidadeOrcamentaria> {
    try {
      const { data } = await api.post<UnidadeOrcamentaria>('/unidades-orcamentarias/', payload);
      return data;
    } catch (error) {
      if (error instanceof AxiosError) {
        if (!error.response) {
          throw new Error('Erro de conexão com o servidor.');
        }

        const { status, data } = error.response;

        if (status === 400) {
          throw error;
        }

        if (data?.detail) {
          throw new Error(data.detail);
        }

        throw new Error('Erro ao criar unidade orçamentária.');
      }

      throw error;
    }
  },
};