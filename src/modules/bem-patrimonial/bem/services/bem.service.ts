import { api } from '@/api/http'
import { AxiosError } from 'axios'

export interface Bem {
  id: number
  status: string
  status_display: string
  nome: string
  descricao: string
  numero_patrimonial: string | null
  localizacao: string
  unidade_administrativa_codigo: string
  unidade_administrativa_nome: string
  unidade_orcamentaria_nome: string
  observacao?: string
  justificativa?: string
}
export interface HistoricoAcao {
  campo: string
  valor_antigo: string | null
  valor_novo: string | null
}

export interface HistoricoGrupo {
  alterado_em: string
  alterado_por: number | null
  alterado_por_nome: string | null
  acoes: HistoricoAcao[]
}
export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export const bemService = {
  list: async (params = {}): Promise<PaginatedResponse<Bem>> => {
    try {
      const query = new URLSearchParams()

      if (params.page)
        query.append('page', String(params.page))

      if (params.search?.trim())
        query.append('search', params.search.trim())

      if (params.status && params.status !== 'todos')
        query.append('status', params.status)

      if (params.unidade_administrativa && params.unidade_administrativa !== 'todas')
        query.append('unidade_administrativa', params.unidade_administrativa)

      if (params.unidade_orcamentaria)
        query.append('unidade_orcamentaria', params.unidade_orcamentaria)

      if (params.baixados_mais_de_um_periodo)
        query.append(
          'baixados_mais_de_um_periodo',
          String(params.baixados_mais_de_um_periodo)
        )

      if (params.ordering)
        query.append('ordering', params.ordering)

      const { data } = await api.get(`/bens/?${query.toString()}`)
      return data
    } catch (error) {
      handleApiError(error, 'Erro ao listar bens')
    }
  },

  retrieve: async (id: number): Promise<Bem> => {
    try {
      const { data } = await api.get(`/bens/${id}/`)
      return data
    } catch (error) {
      handleApiError(error, 'Erro ao buscar detalhes do bem')
    }
  },

  update: async (id: number, payload: Partial<Bem>): Promise<Bem> => {
    try {
      const { data } = await api.put(`/bens/${id}/`, payload)
      return data
    } catch (error) {
      handleApiError(error, 'Erro ao atualizar bem')
    }
  },

  aprovar: async (ids: number[]): Promise<void> => {
    try {
      await api.post('/bens/aprovar/', { ids })
    } catch (error) {
      handleApiError(error, 'Erro ao aprovar bens')
    }
  },

  reprovar: async (ids: number[]): Promise<void> => {
    try {
      await api.post('/bens/reprovar/', { ids })
    } catch (error) {
      handleApiError(error, 'Erro ao reprovar bens')
    }
  },
  async getHistorico(id: number) {
    const { data } = await api.get(`/bens/${id}/historico/`)
    return data
  },
  createMulti: async (payload: any): Promise<void> => {
    try {
      await api.post('/bens/multi/', payload)
    } catch (error) {
      handleApiError(error, 'Erro ao criar bens')
    }
  },
}


function handleApiError(
  error: unknown,
  defaultMessage: string
): never {
  if (error instanceof AxiosError) {
    if (!error.response) {
      throw new Error('Erro de conexão com o servidor.')
    }

    const { status, data } = error.response

    if (data?.detail) {
      throw new Error(data.detail)
    }

    if (status === 400) {
      throw error
    }

    throw new Error(defaultMessage)
  }

  throw error
}