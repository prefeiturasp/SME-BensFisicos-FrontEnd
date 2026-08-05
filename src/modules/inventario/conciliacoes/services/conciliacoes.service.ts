import { AxiosError } from 'axios';
import { api } from '@/api/http';
import { handleApiError } from '@/lib/unidades-list-service';
import type {
  Conciliacao,
  ConciliacaoHistoricoGrupo,
  ConciliacaoItemDetail,
  ConciliacaoItemSituacaoFilter,
  ConciliacaoItensListParams,
  ConciliacaoOcorrenciaPayload,
  ConciliacaoSituacaoDisponivel,
  ConciliacoesListParams,
  ConciliacaoStatusFilter,
  ConciliacaoTipoFilter,
  CreateConciliacaoPayload,
  PaginatedConciliacaoItens,
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

function buildItensListParams(params?: ConciliacaoItensListParams) {
  const queryParams: Record<string, string | number> = {};

  if (params?.page) queryParams.page = params.page;
  if (params?.pageSize) queryParams.page_size = params.pageSize;

  const numeroPatrimonial = params?.numeroPatrimonial?.trim();
  const nome = params?.nome?.trim();
  const search = [numeroPatrimonial, nome].filter(Boolean).join(' ').trim();
  if (search) {
    queryParams.search = search;
  }

  if (params?.situacao && params.situacao !== ('todos' as ConciliacaoItemSituacaoFilter)) {
    queryParams.situacao = params.situacao;
  }

  if (params?.ordering) queryParams.ordering = params.ordering;

  return queryParams;
}

function handleCreateError(error: unknown, defaultMessage: string): never {
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

  throw new Error(defaultMessage);
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
      handleCreateError(error, 'Erro ao cadastrar conciliação.');
    }
  },

  async retrieve(id: number): Promise<Conciliacao> {
    try {
      const { data } = await api.get<Conciliacao>(`${BASE_PATH}/${id}/`);
      return data;
    } catch (error) {
      handleApiError(error, 'Erro ao carregar conciliação.');
    }
  },

  async listItens(
    id: number,
    params?: ConciliacaoItensListParams,
  ): Promise<PaginatedConciliacaoItens> {
    try {
      const { data } = await api.get<PaginatedConciliacaoItens>(
        `${BASE_PATH}/${id}/itens/`,
        { params: buildItensListParams(params) },
      );
      return data;
    } catch (error) {
      handleApiError(error, 'Erro ao listar itens da conciliação.');
    }
  },

  async historico(id: number): Promise<ConciliacaoHistoricoGrupo[]> {
    try {
      const { data } = await api.get<ConciliacaoHistoricoGrupo[]>(
        `${BASE_PATH}/${id}/historico/`,
      );
      return data;
    } catch (error) {
      handleApiError(error, 'Erro ao buscar histórico da conciliação.');
    }
  },

  async exportar(id: number): Promise<Blob> {
    try {
      const { data } = await api.get<Blob>(`${BASE_PATH}/${id}/exportar/`, {
        responseType: 'blob',
      });
      return data;
    } catch (error) {
      handleApiError(error, 'Erro ao exportar PDF da conciliação.');
    }
  },

  async finalizar(id: number): Promise<Conciliacao> {
    try {
      const { data } = await api.post<Conciliacao>(`${BASE_PATH}/${id}/finalizar/`);
      return data;
    } catch (error) {
      handleApiError(error, 'Erro ao finalizar conciliação.');
    }
  },

  async retrieveItem(
    conciliacaoId: number,
    itemId: number,
  ): Promise<ConciliacaoItemDetail> {
    try {
      const { data } = await api.get<ConciliacaoItemDetail>(
        `${BASE_PATH}/${conciliacaoId}/itens/${itemId}/`,
      );
      return data;
    } catch (error) {
      handleApiError(error, 'Erro ao carregar item da conciliação.');
    }
  },

  async listSituacoesDisponiveis(
    conciliacaoId: number,
    itemId: number,
  ): Promise<ConciliacaoSituacaoDisponivel[]> {
    try {
      const { data } = await api.get<ConciliacaoSituacaoDisponivel[]>(
        `${BASE_PATH}/${conciliacaoId}/itens/${itemId}/situacoes-disponiveis/`,
      );
      return data;
    } catch (error) {
      handleApiError(error, 'Erro ao listar situações disponíveis para o item.');
    }
  },

  async upsertOcorrencia(
    conciliacaoId: number,
    itemId: number,
    payload: ConciliacaoOcorrenciaPayload,
  ): Promise<ConciliacaoItemDetail> {
    try {
      const { data } = await api.post<ConciliacaoItemDetail>(
        `${BASE_PATH}/${conciliacaoId}/itens/${itemId}/ocorrencias/`,
        payload,
      );
      return data;
    } catch (error) {
      handleCreateError(error, 'Erro ao registrar ocorrência.');
    }
  },

  async removerOcorrencia(
    conciliacaoId: number,
    itemId: number,
  ): Promise<ConciliacaoItemDetail> {
    try {
      const { data } = await api.post<ConciliacaoItemDetail>(
        `${BASE_PATH}/${conciliacaoId}/itens/${itemId}/ocorrencias/remover/`,
      );
      return data;
    } catch (error) {
      handleCreateError(error, 'Erro ao excluir ocorrência.');
    }
  },
};
