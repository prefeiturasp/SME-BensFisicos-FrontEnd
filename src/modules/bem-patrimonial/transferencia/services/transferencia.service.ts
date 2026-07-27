import { api } from '@/api/http'
import { handleApiError } from '@/lib/api-error'
import type {
  PaginatedResponse,
  TransferenciaBemPatrimonialCreatePayload,
  TransferenciaBemPatrimonialDetail,
  TransferenciaBemPatrimonialListItem,
  TransferenciaBemPatrimonialListParams,
  TransferenciaUoCadastroOption,
} from '../types/transferencia.types'

function buildQuery(params: TransferenciaBemPatrimonialListParams = {}) {
  const query = new URLSearchParams()

  if (params.page) query.append('page', String(params.page))
  if (params.pageSize) query.append('page_size', String(params.pageSize))
  if (params.search?.trim()) query.append('search', params.search.trim())
  if (params.nome_bem?.trim()) query.append('nome_bem', params.nome_bem.trim())
  if (params.numero_ntbpm?.trim()) query.append('numero_ntbpm', params.numero_ntbpm.trim())
  if (params.numero_processo?.trim()) {
    query.append('numero_processo', params.numero_processo.trim())
  }
  if (params.unidade_orcamentaria_origem) {
    query.append('unidade_orcamentaria_origem', String(params.unidade_orcamentaria_origem))
  }
  if (params.unidade_orcamentaria_destino) {
    query.append('unidade_orcamentaria_destino', String(params.unidade_orcamentaria_destino))
  }
  if (params.ordering) query.append('ordering', params.ordering)

  return query
}

export const transferenciaService = {
  async list(
    params: TransferenciaBemPatrimonialListParams = {},
  ): Promise<PaginatedResponse<TransferenciaBemPatrimonialListItem>> {
    try {
      const query = buildQuery(params)
      const { data } = await api.get(`/transferencias/?${query.toString()}`)
      return data
    } catch (error) {
      handleApiError(error, 'Erro ao listar transferências')
    }
  },

  async create(
    payload: TransferenciaBemPatrimonialCreatePayload,
  ): Promise<TransferenciaBemPatrimonialDetail> {
    try {
      const { data } = await api.post('/transferencias/', payload)
      return data
    } catch (error) {
      handleApiError(error, 'Erro ao criar transferência')
    }
  },

  async retrieve(id: number): Promise<TransferenciaBemPatrimonialDetail> {
    try {
      const { data } = await api.get(`/transferencias/${id}/`)
      return data
    } catch (error) {
      handleApiError(error, 'Erro ao carregar transferência')
    }
  },

  async listOpcoesCadastro(): Promise<TransferenciaUoCadastroOption[]> {
    try {
      const { data } = await api.get('/transferencias/opcoes-cadastro/')
      return data
    } catch (error) {
      handleApiError(error, 'Erro ao carregar opções de transferência')
    }
  },

  async baixarDocumentoNtBpm(urlDocumento: string): Promise<Blob> {
    try {
      const { data } = await api.get(urlDocumento, {
        responseType: 'blob',
      })
      return data
    } catch (error) {
      handleApiError(error, 'Erro ao baixar documento NTBPM')
    }
  },
}
