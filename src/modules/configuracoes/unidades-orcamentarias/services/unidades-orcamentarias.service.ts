import { api } from '@/api/http';
import {
  buildListQueryParams,
  handleApiError,
  parseFileNameFromContentDisposition,
} from '@/lib/unidades-list-service';
import type {
  PaginatedResponse,
  UnidadeOrcamentaria,
  UnidadeOrcamentariaExportFormat,
  UnidadeOrcamentariaExportResult,
  UnidadesOrcamentariasListParams,
} from '../types/unidades-orcamentarias.types';

export const unidadesOrcamentariasService = {
  async list(
    params: UnidadesOrcamentariasListParams = {},
  ): Promise<PaginatedResponse<UnidadeOrcamentaria>> {
    try {
      const query = buildListQueryParams(
        {
          page: params.page,
          pageSize: params.pageSize,
          codigo: params.codigo,
          nomeOuSigla: params.nomeOuSigla,
          statusValue: params.ativa,
          ordering: params.ordering,
        },
        { includePagination: true, statusParamName: 'ativa' },
      );

      const { data } = await api.get<PaginatedResponse<UnidadeOrcamentaria>>(
        `/unidades-orcamentarias/?${query.toString()}`,
      );

      return data;
    } catch (error) {
      handleApiError(error, 'Erro ao listar unidades orçamentárias.');
    }
  },

  async exportar(
    formato: UnidadeOrcamentariaExportFormat,
    params: Omit<UnidadesOrcamentariasListParams, 'page' | 'pageSize'> = {},
  ): Promise<UnidadeOrcamentariaExportResult> {
    try {
      const query = buildListQueryParams(
        {
          codigo: params.codigo,
          nomeOuSigla: params.nomeOuSigla,
          statusValue: params.ativa,
          ordering: params.ordering,
        },
        { includePagination: false, statusParamName: 'ativa' },
      );
      query.set('formato', formato);

      const response = await api.get<Blob>(
        `/unidades-orcamentarias/exportar/?${query.toString()}`,
        {
          responseType: 'blob',
        },
      );

      const contentDisposition = response.headers['content-disposition'];
      const contentType = response.headers['content-type'];

      return {
        blob: response.data,
        fileName:
          parseFileNameFromContentDisposition(contentDisposition) ??
          `unidades-orcamentarias.${formato}`,
        contentType,
      };
    } catch (error) {
      handleApiError(error, 'Erro ao exportar unidades orçamentárias.');
    }
  },
};