import { AxiosError } from 'axios';
import { api } from '@/api/http';
import {
  buildListQueryParams,
  handleApiError,
  parseFileNameFromContentDisposition,
} from '@/lib/unidades-list-service';
import type {
  CreateUnidadeAdministrativaPayload,
  PaginatedResponse,
  UpdateUnidadeAdministrativaPayload,
  UnidadeAdministrativaExportFormat,
  UnidadeAdministrativaExportResult,
  UnidadeAdministrativa,
  UnidadesAdministrativasListParams,
} from '../types/unidades-administrativas.types';

export const unidadesAdministrativasService = {
  async list(
    params: UnidadesAdministrativasListParams = {},
  ): Promise<PaginatedResponse<UnidadeAdministrativa>> {
    try {
      const query = buildListQueryParams(
        {
          page: params.page,
          pageSize: params.pageSize,
          codigo: params.codigo,
          nomeOuSigla: params.nomeOuSigla,
          statusValue: params.status,
          ordering: params.ordering,
        },
        { includePagination: true, statusParamName: 'status' },
      );

      const { data } = await api.get<PaginatedResponse<UnidadeAdministrativa>>(
        `/unidades-administrativas/?${query.toString()}`,
      );

      return data;
    } catch (error) {
      handleApiError(error, 'Erro ao listar unidades administrativas');
    }
  },

  async exportar(
    formato: UnidadeAdministrativaExportFormat,
    params: Omit<UnidadesAdministrativasListParams, 'page' | 'pageSize'> = {},
  ): Promise<UnidadeAdministrativaExportResult> {
    try {
      const query = buildListQueryParams(
        {
          codigo: params.codigo,
          nomeOuSigla: params.nomeOuSigla,
          statusValue: params.status,
          ordering: params.ordering,
        },
        { includePagination: false, statusParamName: 'status' },
      );
      query.set('formato', formato);

      const response = await api.get<Blob>(
        `/unidades-administrativas/exportar/?${query.toString()}`,
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
          `unidades-administrativas.${formato}`,
        contentType,
      };
    } catch (error) {
      handleApiError(error, 'Erro ao exportar unidades administrativas');
    }
  },

  async create(payload: CreateUnidadeAdministrativaPayload): Promise<UnidadeAdministrativa> {
    try {
      const { data } = await api.post<UnidadeAdministrativa>('/unidades-administrativas/', payload);
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

        throw new Error('Erro ao criar unidade administrativa.');
      }

      throw error;
    }
  },

  async retrieve(id: number): Promise<UnidadeAdministrativa> {
    try {
      const { data } = await api.get<UnidadeAdministrativa>(`/unidades-administrativas/${id}/`);
      return data;
    } catch (error) {
      handleApiError(error, 'Erro ao carregar unidade administrativa');
    }
  },

  async update(
    id: number,
    payload: UpdateUnidadeAdministrativaPayload,
  ): Promise<UnidadeAdministrativa> {
    try {
      const { data } = await api.patch<UnidadeAdministrativa>(
        `/unidades-administrativas/${id}/`,
        payload,
      );
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

        throw new Error('Erro ao atualizar unidade administrativa.');
      }

      throw error;
    }
  },
};
