import { AxiosError } from 'axios'

import { api } from '@/api/http'
import type {
  PaginatedResponse,
  TransferenciaBemPatrimonialCreatePayload,
  TransferenciaBemPatrimonialDetail,
  TransferenciaBemPatrimonialListItem,
  TransferenciaBemPatrimonialListParams,
  TransferenciaUoCadastroOption,
} from '../types/transferencia.types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function primitiveMessage(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value
  if (typeof value === 'number') return String(value)
  return null
}

function arrayMessage(value: unknown): string | null {
  if (!Array.isArray(value) || value.length === 0) return null
  return primitiveMessage(value[0])
}

function firstErrorMessage(data: unknown): string | null {
  if (!isRecord(data)) return null

  const detail = primitiveMessage(data.detail)
  if (detail) return detail

  for (const value of Object.values(data)) {
    const message = arrayMessage(value) ?? primitiveMessage(value)
    if (message) return message
  }

  return null
}

function handleApiError(error: unknown, defaultMessage: string): never {
    if (error instanceof AxiosError) {
      if (!error.response) {
        throw new Error('Erro de conexão com o servidor.')
      }

    const message = firstErrorMessage(error.response.data)
    if (message) {
      throw new Error(message)
    }

    throw new Error(defaultMessage)
  }

  throw error
}

function buildQuery(params: TransferenciaBemPatrimonialListParams = {}) {
  const query = new URLSearchParams()

  if (params.page) query.append('page', String(params.page))
  if (params.pageSize) query.append('page_size', String(params.pageSize))
  if (params.search?.trim()) query.append('search', params.search.trim())
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
