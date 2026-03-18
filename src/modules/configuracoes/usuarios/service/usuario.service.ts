import { api } from '@/api/http'
import { AxiosError } from 'axios'

export interface Usuario {
    id: number
    username: string
    nome: string
    email: string
    unidade_codigo: string
    unidade_nome: string
    grupo_nome: string
    status: string
    status_display: string
}

export interface PaginatedResponse<T> {
    count: number
    next: string | null
    previous: string | null
    results: T[]
}

export const usuarioService = {

    list: async (params: any = {}): Promise<PaginatedResponse<Usuario>> => {
        try {

            const query = new URLSearchParams()

            console.log(`Search Query Before: ${query.toString()}`)
            console.log("Params")
            console.log(`Params Page: ${params.page}`)
            console.log(`Params Search: ${params.search}`)
            console.log(`Params Unidade: ${params.unidade}`)
            console.log(`Params Grupo: ${params.grupo}`)
            console.log(`Params Status: ${params.status}`)
            console.log(`Params Ordering: ${params.oredring}`)

            if (params.page)
                query.append('page', String(params.page))

            if (params.search?.trim())
                query.append('search', params.search.trim())

            if (params.unidade && params.unidade !== 'todas')
                query.append('unidade', params.unidade)

            if (params.grupo && params.grupo !== 'todos')
                query.append('group_name', params.grupo)

            if (params.status && params.status !== 'todos')

                query.append('is_active', params.status === "ativo" ? "true" : "false")

            if (params.ordering)
                query.append('ordering', params.ordering)

            console.log(`Search Query After: ${query.toString()}`)

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

    create: async (payload: Partial<Usuario>): Promise<Usuario> => {
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