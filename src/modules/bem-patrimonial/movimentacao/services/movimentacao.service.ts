import { AxiosError } from 'axios'
import { api } from '@/api/http'
import type {
  MovimentacaoBemPatrimonialCreatePayload,
  MovimentacaoBemPatrimonialDetail,
  MovimentacaoBemPatrimonialListItem,
  MovimentacaoBemPatrimonialListParams,
  PaginatedResponse,
} from '../types/movimentacao.types'

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

function buildQuery(params: MovimentacaoBemPatrimonialListParams = {}) {
  const query = new URLSearchParams()

  if (params.page) query.append('page', String(params.page))
  if (params.pageSize) query.append('page_size', String(params.pageSize))
  if (params.search?.trim()) query.append('search', params.search.trim())
  if (params.status && params.status !== 'todos') query.append('status', params.status)
  if (params.unidade_administrativa_origem)
    query.append('unidade_administrativa_origem', String(params.unidade_administrativa_origem))
  if (params.unidade_administrativa_destino)
    query.append('unidade_administrativa_destino', String(params.unidade_administrativa_destino))
  if (params.numero_cimbpm?.trim()) query.append('numero_cimbpm', params.numero_cimbpm.trim())
  if (params.ordering) query.append('ordering', params.ordering)

  return query
}

export const movimentacaoService = {
  async list(
    params: MovimentacaoBemPatrimonialListParams = {},
  ): Promise<PaginatedResponse<MovimentacaoBemPatrimonialListItem>> {
    try {
      const query = buildQuery(params)
      const { data } = await api.get(`/movimentacoes/?${query.toString()}`)
      return data
    } catch (error) {
      handleApiError(error, 'Erro ao listar movimentações')
    }
  },

  async create(
    payload: MovimentacaoBemPatrimonialCreatePayload,
  ): Promise<MovimentacaoBemPatrimonialDetail> {
    try {
      const { data } = await api.post('/movimentacoes/', payload)
      return data
    } catch (error) {
      handleApiError(error, 'Erro ao criar movimentação')
    }
  },
}
