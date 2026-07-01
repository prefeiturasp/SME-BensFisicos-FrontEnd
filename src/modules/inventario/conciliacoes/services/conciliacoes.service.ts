import { AxiosError } from 'axios';
import { api } from '@/api/http';
import type { Conciliacao, CreateConciliacaoPayload } from '../types/conciliacoes.types';

const BASE_PATH = '/inventario/conciliacoes';

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
  async create(payload: CreateConciliacaoPayload): Promise<Conciliacao> {
    try {
      const { data } = await api.post<Conciliacao>(`${BASE_PATH}/`, payload);
      return data;
    } catch (error) {
      handleCreateError(error);
    }
  },
};
