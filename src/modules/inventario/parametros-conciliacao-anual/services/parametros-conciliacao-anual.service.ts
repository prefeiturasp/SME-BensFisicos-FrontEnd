import { AxiosError } from 'axios';
import { api } from '@/api/http';
import { handleApiError } from '@/lib/unidades-list-service';
import type {
  PaginatedResponse,
  ParametroConciliacaoAnual,
  ParametroConciliacaoPayload,
  ParametroConciliacaoUpdatePayload,
  ParametrosConciliacaoListParams,
} from '../types/parametros-conciliacao-anual.types';

const BASE_PATH = '/inventario/parametros-conciliacao-anual';

function buildListParams(params?: ParametrosConciliacaoListParams) {
  const queryParams: Record<string, string | number | boolean> = {};

  if (params?.page) queryParams.page = params.page;
  if (params?.pageSize) queryParams.page_size = params.pageSize;
  if (params?.anoReferencia?.trim()) queryParams.ano_referencia = params.anoReferencia.trim();
  if (params?.ativo && params.ativo !== 'todos') queryParams.ativo = params.ativo;
  if (params?.ordering) queryParams.ordering = params.ordering;

  return queryParams;
}

function handleWriteError(error: unknown, fallbackMessage: string): never {
  if (error instanceof AxiosError) {
    if (!error.response) {
      throw new Error('Erro de conexão com o servidor.');
    }

    if (error.response.status === 400) {
      throw error;
    }

    if (error.response.data?.detail) {
      throw new Error(error.response.data.detail);
    }
  }

  throw new Error(fallbackMessage);
}

export const parametrosConciliacaoAnualService = {
  async list(
    params?: ParametrosConciliacaoListParams,
  ): Promise<PaginatedResponse<ParametroConciliacaoAnual>> {
    try {
      const { data } = await api.get<PaginatedResponse<ParametroConciliacaoAnual>>(
        `${BASE_PATH}/`,
        { params: buildListParams(params) },
      );
      return data;
    } catch (error) {
      handleApiError(error, 'Erro ao listar parâmetros de conciliação anual.');
    }
  },

  async retrieve(id: number): Promise<ParametroConciliacaoAnual> {
    try {
      const { data } = await api.get<ParametroConciliacaoAnual>(`${BASE_PATH}/${id}/`);
      return data;
    } catch (error) {
      handleApiError(error, 'Erro ao carregar parâmetro de conciliação anual.');
    }
  },

  async create(payload: ParametroConciliacaoPayload): Promise<ParametroConciliacaoAnual> {
    try {
      const { data } = await api.post<ParametroConciliacaoAnual>(`${BASE_PATH}/`, payload);
      return data;
    } catch (error) {
      handleWriteError(error, 'Erro ao cadastrar parâmetro de conciliação anual.');
    }
  },

  async update(
    id: number,
    payload: ParametroConciliacaoUpdatePayload,
  ): Promise<ParametroConciliacaoAnual> {
    try {
      const { data } = await api.patch<ParametroConciliacaoAnual>(`${BASE_PATH}/${id}/`, payload);
      return data;
    } catch (error) {
      handleWriteError(error, 'Erro ao atualizar parâmetro de conciliação anual.');
    }
  },

  async destroy(id: number): Promise<void> {
    try {
      await api.delete(`${BASE_PATH}/${id}/`);
    } catch (error) {
      handleWriteError(error, 'Erro ao excluir parâmetro de conciliação anual.');
    }
  },
};
