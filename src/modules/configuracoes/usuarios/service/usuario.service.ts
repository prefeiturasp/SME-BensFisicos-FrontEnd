import { api } from '@/api/http'
import { AxiosError } from 'axios'
import { parseFileNameFromContentDisposition } from '@/lib/unidades-list-service'

export interface Usuario {
    id: number
    username: string
    nome: string
    email: string
    unidade_codigo: string
    unidade_nome: string
    unidade_orcamentaria_codigo?: string
    unidade_orcamentaria_nome?: string
    grupo_nome: string
    status: string
    status_display: string
    rf: string
    unidade_orcamentaria?: number | null
    unidades_administrativas?: number[]
}

export interface UsuarioCreatePayload {
    username: string
    nome: string
    email: string
    rf: string
    unidade_administrativa: number | null
    unidade_orcamentaria: number | null
    group_name: string
    password: string
    password_confirm: string
    is_active: boolean
    unidades_administrativas?: number[]
}

export interface PaginatedResponse<T> {
    count: number
    next: string | null
    previous: string | null
    results: T[]
}

export interface UsuarioExportResult {
    blob: Blob
    fileName: string
    contentType: string | null
}

// ─── Helpers de construção da query string ─────────────────────────────────

/**
 * Adiciona o parâmetro à query somente se o valor for "truthy".
 * Cobre os casos simples: page, unidade_administrativa_id, page_size, ordering.
 */
function appendIfPresent(
    query: URLSearchParams,
    key: string,
    value: string | number | undefined | null
): void {
    if (value) {
        query.append(key, String(value))
    }
}

/**
 * Adiciona o parâmetro somente se o valor estiver preenchido e for
 * diferente do valor "padrão" usado pelos selects (ex: 'todas', 'todos').
 */
function appendIfNotDefault(
    query: URLSearchParams,
    key: string,
    value: string | undefined,
    defaultValue: string
): void {
    if (value && value !== defaultValue) {
        query.append(key, value)
    }
}

function appendSearch(query: URLSearchParams, search?: string): void {
    const trimmed = search?.trim()

    if (trimmed) {
        query.append('search', trimmed)
    }
}

function appendStatus(query: URLSearchParams, status?: string): void {
    if (!status || status === 'todos') {
        return
    }

    query.append('is_active', status === 'ativo' ? 'true' : 'false')
}

function buildListQuery(params: any): URLSearchParams {
    const query = new URLSearchParams()

    appendIfPresent(query, 'page', params.page)
    appendSearch(query, params.search)
    appendIfNotDefault(query, 'unidade', params.unidade, 'todas')
    appendIfPresent(query, 'unidade_administrativa_id', params.unidade_administrativa_id)
    appendIfPresent(query, 'page_size', params.page_size)
    appendIfNotDefault(query, 'unidade_orcamentaria', params.unidade_orcamentaria, 'todas')
    appendIfNotDefault(query, 'group_name', params.grupo, 'todos')
    appendStatus(query, params.status)
    appendIfPresent(query, 'ordering', params.ordering)

    return query
}

// ─── Serviço ────────────────────────────────────────────────────────────────

export const usuarioService = {

    list: async (params: any = {}): Promise<PaginatedResponse<Usuario>> => {
        try {

            const query = buildListQuery(params)

            const { data } = await api.get(`/user/?${query.toString()}`)
            return data

        } catch (error) {
            handleApiError(error, 'Erro ao listar usuários')
        }
    },

    retrieve: async (id: number): Promise<Usuario> => {
        try {

            const { data } = await api.get(`/user/${id}/`)
            return data

        } catch (error) {
            handleApiError(error, 'Erro ao buscar usuário')
        }
    },

    create: async (payload: UsuarioCreatePayload): Promise<Usuario> => {
        try {

            const { data } = await api.post(`/user/`, payload)
            return data

        } catch (error) {
            handleApiError(error, 'Erro ao criar usuário')
        }
    },

    update: async (id: number, payload: Partial<Usuario>): Promise<Usuario> => {
        try {

            const { data } = await api.put(`/user/${id}/`, payload)
            return data

        } catch (error) {
            handleApiError(error, 'Erro ao atualizar usuário')
        }
    },

    partialUpdate: async (
        id: number,
        payload: Partial<Usuario>
    ): Promise<Usuario> => {
        try {

            const { data } = await api.patch(`/user/${id}/`, payload)
            return data

        } catch (error) {
            handleApiError(error, 'Erro ao atualizar usuário')
        }
    },

    delete: async (id: number): Promise<void> => {
        try {

            await api.delete(`/usuarios/${id}/`)

        } catch (error) {
            handleApiError(error, 'Erro ao remover usuário')
        }
    },

    exportar: async (): Promise<UsuarioExportResult> => {
        try {
            const response = await api.get(`/user/exportar/`, {
                responseType: 'blob',
            })

            const contentDisposition = response.headers['content-disposition']
            const contentType = response.headers['content-type'] ?? null

            return {
                blob: response.data,
                fileName:
                    parseFileNameFromContentDisposition(contentDisposition) ??
                    'usuarios.xlsx',
                contentType,
            }
        } catch (error) {
            handleApiError(error, 'Erro ao exportar usuários')
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