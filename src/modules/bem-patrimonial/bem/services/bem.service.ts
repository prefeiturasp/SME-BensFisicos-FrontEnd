import { api } from '@/api/http'
import { AxiosError } from 'axios'

export interface Bem {
  id: number
  status: string
  status_display: string
  nome: string
  descricao: string
  numero_patrimonial: string | null
  numero_formato_antigo: boolean
  sem_numeracao: boolean
  valor_unitario?: string | null
  marca?: string | null
  modelo?: string | null
  localizacao: string
  numero_processo?: string | null
  numero_processo_baixa?: string | null
  unidade_administrativa_codigo: string
  unidade_administrativa_nome: string
  unidade_orcamentaria_nome: string
  observacao?: string
  justificativa?: string
  criado_por_nome?: string | null
  criado_em?: string | null
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

export interface BemListParams {
  page?: number
  pageSize?: number
  search?: string
  status?: string
  unidade_administrativa?: string | number
  unidade_orcamentaria?: string | number
  busca_geral_uos?: boolean
  bens_baixados?: boolean
  ordering?: string
}

export interface ImportacaoErroLinha {
  linha: number
  erros: Record<string, string[]>
}

export interface ImportacaoResultado {
  detail: string
  importados: number
  ignorados_com_erro: number
  total_linhas: number
  erros_por_linha?: string[]
  erros_campos?: ImportacaoErroLinha[]
}

export const bemService = {
  list: async (params: BemListParams = {}): Promise<PaginatedResponse<Bem>> => {
    try {
      const query = new URLSearchParams()

      if (params.page) query.append('page', String(params.page))
      if (params.pageSize) query.append('page_size', String(params.pageSize))

      if (params.search?.trim()) query.append('search', params.search.trim())

      if (params.status && params.status !== 'todos') query.append('status', params.status)

      if (params.unidade_administrativa && params.unidade_administrativa !== 'todas')
        query.append('unidade_administrativa', String(params.unidade_administrativa))

      if (params.unidade_orcamentaria)
        query.append('unidade_orcamentaria', String(params.unidade_orcamentaria))

      if (params.busca_geral_uos) query.append('busca_geral_uos', String(params.busca_geral_uos))

      if (params.bens_baixados)
        query.append('bens_baixados', String(params.bens_baixados))

      if (params.ordering) query.append('ordering', params.ordering)

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

  delete: async (id: number): Promise<void> => {
    try {
      await api.delete(`/bens/${id}/`)
    } catch (error) {
      handleApiError(error, 'Erro ao excluir bem')
    }
  },

  gerarNbbpm: async (id: number): Promise<Blob> => {
    try {
      const { data } = await api.get(`/baixa-fisica/${id}/gerar-nbbpm/`, {
        responseType: 'blob',
      })
      return data
    } catch (error) {
      handleApiError(error, 'Erro ao gerar PDF NBBPM')
    }
  },

  /**
   * Importa bens patrimoniais em lote a partir de uma planilha (XLSX, XLS ou CSV).
   *
   * Retorna o resultado mesmo em casos parciais (207) ou de erro (422),
   * pois esses status carregam payload estruturado que a UI precisa exibir.
   * Somente erros de infraestrutura (5xx, sem conexão) são lançados como exceção.
   */
  importar: async (arquivo: File): Promise<{ status: number; data: ImportacaoResultado }> => {
    const formData = new FormData()
    formData.append('arquivo', arquivo)

    try {
      const response = await api.post('/bens/importar/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        // Não lançar automaticamente para status 4xx — o payload precisa chegar à UI
        validateStatus: (status) => status < 500,
      })

      return { status: response.status, data: response.data }
    } catch (error) {
      handleApiError(error, 'Erro ao importar bens')
    }
  },
}

function handleApiError(error: unknown, defaultMessage: string): never {
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