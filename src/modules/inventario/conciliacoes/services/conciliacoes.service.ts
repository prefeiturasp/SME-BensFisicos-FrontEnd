import { AxiosError } from 'axios';
import { api } from '@/api/http';
import { handleApiError } from '@/lib/unidades-list-service';
import type {
  Conciliacao,
  ConciliacoesListParams,
  ConciliacaoStatusFilter,
  ConciliacaoTipoFilter,
  CreateConciliacaoPayload,
  PaginatedConciliacoes,
} from '../types/conciliacoes.types';

const BASE_PATH = '/inventario/conciliacoes';

function buildListParams(params?: ConciliacoesListParams) {
  const queryParams: Record<string, string | number> = {};

  if (params?.page) queryParams.page = params.page;
  if (params?.pageSize) queryParams.page_size = params.pageSize;

  const search = params?.search?.trim();
  if (search) queryParams.search = search;

  if (params?.anoVigencia?.trim()) queryParams.ano_vigencia = params.anoVigencia.trim();

  if (params?.tipo && params.tipo !== ('todos' as ConciliacaoTipoFilter)) {
    queryParams.tipo = params.tipo;
  }

  if (params?.status && params.status !== ('todos' as ConciliacaoStatusFilter)) {
    queryParams.status = params.status;
  }

  if (params?.ordering) queryParams.ordering = params.ordering;

  return queryParams;
}

function handleCreateError(error: unknown): never {
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

  throw new Error('Erro ao cadastrar conciliação.');
}

export const conciliacoesService = {
  async list(params?: ConciliacoesListParams): Promise<PaginatedConciliacoes> {
    try {
      const { data } = await api.get<PaginatedConciliacoes>(`${BASE_PATH}/`, {
        params: buildListParams(params),
      });
      return data;
    } catch (error) {
      handleApiError(error, 'Erro ao listar conciliações.');
    }
  },

  async create(payload: CreateConciliacaoPayload): Promise<Conciliacao> {
    try {
      const { data } = await api.post<Conciliacao>(`${BASE_PATH}/`, payload);
      return data;
    } catch (error) {
      handleCreateError(error);
    }
  },
};
