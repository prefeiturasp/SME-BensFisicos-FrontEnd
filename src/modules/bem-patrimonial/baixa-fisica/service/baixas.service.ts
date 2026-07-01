import { api } from '@/api/http'
import { AxiosError } from 'axios'
import type {
    BaixaFisica,
    BaixaFisicaDetail,
    BaixaFisicaCreatePayload,
    BaixaFisicaUpdatePayload,
    BaixaFisicaRecusarPayload,
    BaixaFisicaSolicitarCorrecaoPayload,
    BaixaFisicaListParams,
    PaginatedResponse,
} from '../types/baixas-fisicas.types'

// ============================================================================
// SERVICE
// ============================================================================

export const baixaFisicaService = {

    list: async (params: BaixaFisicaListParams = {}): Promise<PaginatedResponse<BaixaFisica>> => {
        try {
            const query = new URLSearchParams()

            if (params.page)
                query.append('page', String(params.page))

            if (params.search?.trim())
                query.append('search', params.search.trim())

            if (params.status && params.status !== 'todos')
                query.append('status', params.status)

            if (params.unidade_administrativa_origem)
                query.append('unidade_administrativa_origem', String(params.unidade_administrativa_origem))

            if (params.ordering)
                query.append('ordering', params.ordering)

            if (params.data_criacao__gte)
                query.append('data_criacao__gte', params.data_criacao__gte)

            if (params.data_criacao__lte)
                query.append('data_criacao__lte', params.data_criacao__lte)

            if (params.data_aprovacao__gte)
                query.append('data_aprovacao__gte', params.data_aprovacao__gte)

            if (params.data_aprovacao__lte)
                query.append('data_aprovacao__lte', params.data_aprovacao__lte)

            const { data } = await api.get(`/baixa-fisica/?${query.toString()}`)
            return data

        } catch (error) {
            handleApiError(error, 'Erro ao listar baixas físicas')
        }
    },

    retrieve: async (id: number): Promise<BaixaFisicaDetail> => {
        try {
            const { data } = await api.get(`/baixa-fisica/${id}/`)
            return data

        } catch (error) {
            handleApiError(error, 'Erro ao buscar baixa física')
        }
    },

    create: async (payload: BaixaFisicaCreatePayload): Promise<BaixaFisicaDetail> => {
        try {
            const { data } = await api.post(`/baixa-fisica/`, payload)
            return data

        } catch (error) {
            handleApiError(error, 'Erro ao criar baixa física')
        }
    },

    update: async (id: number, payload: BaixaFisicaUpdatePayload): Promise<BaixaFisicaDetail> => {
        try {
            const { data } = await api.put(`/baixa-fisica/${id}/`, payload)
            return data

        } catch (error) {
            handleApiError(error, 'Erro ao atualizar baixa física')
        }
    },

    partialUpdate: async (id: number, payload: Partial<BaixaFisicaUpdatePayload>): Promise<BaixaFisicaDetail> => {
        try {
            const { data } = await api.patch(`/baixa-fisica/${id}/`, payload)
            return data

        } catch (error) {
            handleApiError(error, 'Erro ao atualizar baixa física')
        }
    },

    enviarSolicitacao: async (id: number): Promise<BaixaFisicaDetail> => {
        try {
            const { data } = await api.post(`/baixa-fisica/${id}/solicitar/`)
            return data

        } catch (error) {
            handleApiError(error, 'Erro ao enviar solicitação de baixa física')
        }
    },

    aprovar: async (id: number): Promise<BaixaFisicaDetail> => {
        try {
            const { data } = await api.post(`/baixa-fisica/${id}/aprovar/`)
            return data

        } catch (error) {
            handleApiError(error, 'Erro ao aprovar baixa física')
        }
    },

    recusar: async (id: number, payload: BaixaFisicaRecusarPayload = {}): Promise<BaixaFisicaDetail> => {
        try {
            const { data } = await api.post(`/baixa-fisica/${id}/recusar/`, payload)
            return data

        } catch (error) {
            handleApiError(error, 'Erro ao recusar baixa física')
        }
    },

    solicitarCorrecao: async (
        id: number,
        payload: BaixaFisicaSolicitarCorrecaoPayload
    ): Promise<BaixaFisicaDetail> => {
        try {
            const { data } = await api.post(`/baixa-fisica/${id}/solicitar-correcao/`, payload)
            return data

        } catch (error) {
            handleApiError(error, 'Erro ao solicitar correção da baixa física')
        }
    },

    gerarNbbpm: async (id: number): Promise<Blob> => {
        try {
            const { data } = await api.get(`/baixa-fisica/${id}/gerar-nbbpm/`, {
                responseType: 'blob',
            })
            return data

        } catch (error) {
            handleApiError(error, 'Erro ao gerar NBBPM')
        }
    },

    gerarLaudo: async (id: number): Promise<Blob> => {
        try {
            const { data } = await api.get(`/baixa-fisica/${id}/gerar-laudo/`, {
                responseType: 'blob',
            })
            return data

        } catch (error) {
            handleApiError(error, 'Erro ao gerar Laudo de Avaliação')
        }
    },

    exportarExcel: async (params: Pick<BaixaFisicaListParams, 'ids' | 'status' | 'unidade_administrativa_origem'> = {}): Promise<Blob> => {
        try {
            const query = new URLSearchParams()

            if (params.ids)
                query.append('ids', params.ids)

            if (params.status && params.status !== 'todos')
                query.append('status', params.status)

            if (params.unidade_administrativa_origem)
                query.append('unidade_administrativa_origem', String(params.unidade_administrativa_origem))

            const { data } = await api.get(`/baixa-fisica/exportar-excel/?${query.toString()}`, {
                responseType: 'blob',
            })
            return data

        } catch (error) {
            handleApiError(error, 'Erro ao exportar Excel')
        }
    },

    historico: async (id: number) => {
        try {
            const { data } = await api.get(`/baixa-fisica/${id}/historico/`)
            return data
        } catch (error) {
            handleApiError(error, 'Erro ao buscar histórico')
        }
    },
}

// ============================================================================
// UTILITÁRIOS
// ============================================================================

export function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
}

// ============================================================================
// TRATAMENTO DE ERROS
// ============================================================================

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