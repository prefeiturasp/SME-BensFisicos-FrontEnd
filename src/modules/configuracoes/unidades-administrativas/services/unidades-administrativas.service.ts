import { AxiosError } from 'axios';
import { api } from '@/api/http';
import {
  createUnidadesListService,
  handleApiError,
} from '@/lib/unidades-list-service';
import type {
  CreateUnidadeAdministrativaPayload,
  UAStatusFilter,
  UpdateUnidadeAdministrativaPayload,
  UnidadeAdministrativaExportFormat,
  UnidadeAdministrativa,
  UnidadesAdministrativasListParams,
} from '../types/unidades-administrativas.types';

const baseUnidadesAdministrativasService = createUnidadesListService<
  UnidadeAdministrativa,
  UnidadeAdministrativaExportFormat,
  UAStatusFilter,
  'status',
  UnidadesAdministrativasListParams
>({
  basePath: '/unidades-administrativas',
  fileNamePrefix: 'unidades-administrativas',
  listErrorMessage: 'Erro ao listar unidades administrativas',
  exportErrorMessage: 'Erro ao exportar unidades administrativas',
  statusParamName: 'status',
});

export const unidadesAdministrativasService = {
  ...baseUnidadesAdministrativasService,

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
