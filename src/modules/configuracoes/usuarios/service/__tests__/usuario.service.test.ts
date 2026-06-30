import { describe, it, expect, vi, beforeEach } from "vitest"
import { AxiosError } from "axios"
import { usuarioService, type UsuarioCreatePayload } from "../usuario.service"
import { api } from "@/api/http"

// ─── Mock ─────────────────────────────────────────────────────────────────────

vi.mock("@/api/http", () => ({
    api: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
    },
}))

const mockGet = vi.mocked(api.get)
const mockPost = vi.mocked(api.post)
const mockPut = vi.mocked(api.put)
const mockPatch = vi.mocked(api.patch)
const mockDelete = vi.mocked(api.delete)

// ─── Helpers ──────────────────────────────────────────────────────────────────

const USUARIO: import("../usuario.service").Usuario = {
    id: 1,
    username: "joao",
    nome: "João da Silva",
    email: "joao@email.com",
    unidade_codigo: "001",
    unidade_nome: "Secretaria de Finanças",
    grupo_nome: "GESTOR_PATRIMONIO",
    status: "ativo",
    status_display: "Ativo",
}

const PAGINATED_RESPONSE = {
    count: 1,
    next: null,
    previous: null,
    results: [USUARIO],
}

/**
 * Cria um AxiosError com resposta simulada.
 * Sem `response` = erro de rede/conexão.
 */
function makeAxiosError(status?: number, data?: Record<string, unknown>): AxiosError {
    const error = new AxiosError()
    if (status !== undefined) {
        error.response = {
            status,
            data: data ?? {},
            headers: {},
            config: {} as never,
            statusText: "",
        }
    }
    return error
}

// ─── Testes ───────────────────────────────────────────────────────────────────

describe("usuarioService", () => {

    beforeEach(() => {
        vi.clearAllMocks()
    })

    // ── list ──────────────────────────────────────────────────────────────────

    describe("list", () => {

        describe("chamada à API", () => {

            it("chama GET /user/ sem parâmetros quando nenhum é informado", async () => {
                mockGet.mockResolvedValueOnce({ data: PAGINATED_RESPONSE })

                await usuarioService.list()

                expect(mockGet).toHaveBeenCalledWith("/user/?")
            })

            it("chama exatamente uma vez", async () => {
                mockGet.mockResolvedValueOnce({ data: PAGINATED_RESPONSE })

                await usuarioService.list()

                expect(mockGet).toHaveBeenCalledTimes(1)
            })

            it("retorna os dados paginados da API", async () => {
                mockGet.mockResolvedValueOnce({ data: PAGINATED_RESPONSE })

                const result = await usuarioService.list()

                expect(result).toEqual(PAGINATED_RESPONSE)
            })
        })

        describe("construção da query string", () => {

            it("adiciona page quando informado", async () => {
                mockGet.mockResolvedValueOnce({ data: PAGINATED_RESPONSE })

                await usuarioService.list({ page: 2 })

                expect(mockGet).toHaveBeenCalledWith(
                    expect.stringContaining("page=2")
                )
            })

            it("adiciona search quando informado", async () => {
                mockGet.mockResolvedValueOnce({ data: PAGINATED_RESPONSE })

                await usuarioService.list({ search: "joao" })

                expect(mockGet).toHaveBeenCalledWith(
                    expect.stringContaining("search=joao")
                )
            })

            it("aplica trim no search antes de enviar", async () => {
                mockGet.mockResolvedValueOnce({ data: PAGINATED_RESPONSE })

                await usuarioService.list({ search: "  joao  " })

                expect(mockGet).toHaveBeenCalledWith(
                    expect.stringContaining("search=joao")
                )
            })

            it("não adiciona search quando é string vazia", async () => {
                mockGet.mockResolvedValueOnce({ data: PAGINATED_RESPONSE })

                await usuarioService.list({ search: "" })

                expect(mockGet).toHaveBeenCalledWith(
                    expect.not.stringContaining("search=")
                )
            })

            it("não adiciona search quando contém apenas espaços", async () => {
                mockGet.mockResolvedValueOnce({ data: PAGINATED_RESPONSE })

                await usuarioService.list({ search: "   " })

                expect(mockGet).toHaveBeenCalledWith(
                    expect.not.stringContaining("search=")
                )
            })

            it("adiciona unidade quando informada e diferente de 'todas'", async () => {
                mockGet.mockResolvedValueOnce({ data: PAGINATED_RESPONSE })

                await usuarioService.list({ unidade: "001" })

                expect(mockGet).toHaveBeenCalledWith(
                    expect.stringContaining("unidade=001")
                )
            })

            it("não adiciona unidade quando é 'todas'", async () => {
                mockGet.mockResolvedValueOnce({ data: PAGINATED_RESPONSE })

                await usuarioService.list({ unidade: "todas" })

                expect(mockGet).toHaveBeenCalledWith(
                    expect.not.stringContaining("unidade=")
                )
            })

            it("não adiciona unidade quando é undefined", async () => {
                mockGet.mockResolvedValueOnce({ data: PAGINATED_RESPONSE })

                await usuarioService.list({ unidade: undefined })

                expect(mockGet).toHaveBeenCalledWith(
                    expect.not.stringContaining("unidade=")
                )
            })

            it("adiciona group_name quando grupo informado e diferente de 'todos'", async () => {
                mockGet.mockResolvedValueOnce({ data: PAGINATED_RESPONSE })

                await usuarioService.list({ grupo: "GESTOR_PATRIMONIO" })

                expect(mockGet).toHaveBeenCalledWith(
                    expect.stringContaining("group_name=GESTOR_PATRIMONIO")
                )
            })

            it("não adiciona group_name quando grupo é 'todos'", async () => {
                mockGet.mockResolvedValueOnce({ data: PAGINATED_RESPONSE })

                await usuarioService.list({ grupo: "todos" })

                expect(mockGet).toHaveBeenCalledWith(
                    expect.not.stringContaining("group_name=")
                )
            })

            it("não adiciona group_name quando grupo é undefined", async () => {
                mockGet.mockResolvedValueOnce({ data: PAGINATED_RESPONSE })

                await usuarioService.list({ grupo: undefined })

                expect(mockGet).toHaveBeenCalledWith(
                    expect.not.stringContaining("group_name=")
                )
            })

            it("adiciona is_active=true quando status é 'ativo'", async () => {
                mockGet.mockResolvedValueOnce({ data: PAGINATED_RESPONSE })

                await usuarioService.list({ status: "ativo" })

                expect(mockGet).toHaveBeenCalledWith(
                    expect.stringContaining("is_active=true")
                )
            })

            it("adiciona is_active=false quando status não é 'ativo' nem 'todos'", async () => {
                mockGet.mockResolvedValueOnce({ data: PAGINATED_RESPONSE })

                await usuarioService.list({ status: "inativo" })

                expect(mockGet).toHaveBeenCalledWith(
                    expect.stringContaining("is_active=false")
                )
            })

            it("não adiciona is_active quando status é 'todos'", async () => {
                mockGet.mockResolvedValueOnce({ data: PAGINATED_RESPONSE })

                await usuarioService.list({ status: "todos" })

                expect(mockGet).toHaveBeenCalledWith(
                    expect.not.stringContaining("is_active=")
                )
            })

            it("não adiciona is_active quando status é undefined", async () => {
                mockGet.mockResolvedValueOnce({ data: PAGINATED_RESPONSE })

                await usuarioService.list({ status: undefined })

                expect(mockGet).toHaveBeenCalledWith(
                    expect.not.stringContaining("is_active=")
                )
            })

            it("adiciona ordering quando informado", async () => {
                mockGet.mockResolvedValueOnce({ data: PAGINATED_RESPONSE })

                await usuarioService.list({ ordering: "nome" })

                expect(mockGet).toHaveBeenCalledWith(
                    expect.stringContaining("ordering=nome")
                )
            })

            it("não adiciona ordering quando é undefined", async () => {
                mockGet.mockResolvedValueOnce({ data: PAGINATED_RESPONSE })

                await usuarioService.list({ ordering: undefined })

                expect(mockGet).toHaveBeenCalledWith(
                    expect.not.stringContaining("ordering=")
                )
            })

            it("combina múltiplos parâmetros corretamente", async () => {
                mockGet.mockResolvedValueOnce({ data: PAGINATED_RESPONSE })

                await usuarioService.list({
                    page: 1,
                    search: "joao",
                    unidade: "001",
                    grupo: "GESTOR_PATRIMONIO",
                    status: "ativo",
                    ordering: "nome",
                })

                const url = mockGet.mock.calls[0][0] as string // NOSONAR

                expect(url).toContain("page=1")
                expect(url).toContain("search=joao")
                expect(url).toContain("unidade=001")
                expect(url).toContain("group_name=GESTOR_PATRIMONIO")
                expect(url).toContain("is_active=true")
                expect(url).toContain("ordering=nome")
            })
        })

        describe("tratamento de erros", () => {

            it("lança erro de conexão quando AxiosError sem response", async () => {
                mockGet.mockRejectedValueOnce(makeAxiosError())

                await expect(usuarioService.list()).rejects.toThrow(
                    "Erro de conexão com o servidor."
                )
            })

            it("lança mensagem de detail quando API retorna detail", async () => {
                mockGet.mockRejectedValueOnce(
                    makeAxiosError(422, { detail: "Parâmetro inválido." })
                )

                await expect(usuarioService.list()).rejects.toThrow(
                    "Parâmetro inválido."
                )
            })

            it("relança o AxiosError original quando status é 400", async () => {
                const error400 = makeAxiosError(400, { username: ["Já existe."] })
                mockGet.mockRejectedValueOnce(error400)

                await expect(usuarioService.list()).rejects.toBe(error400)
            })

            it("lança mensagem padrão para outros status HTTP", async () => {
                mockGet.mockRejectedValueOnce(makeAxiosError(500))

                await expect(usuarioService.list()).rejects.toThrow(
                    "Erro ao listar usuários"
                )
            })

            it("propaga erro genérico (não-Axios) diretamente", async () => {
                const genericError = new Error("Erro inesperado")
                mockGet.mockRejectedValueOnce(genericError)

                await expect(usuarioService.list()).rejects.toThrow("Erro inesperado")
            })
        })
    })

    // ── retrieve ──────────────────────────────────────────────────────────────

    describe("retrieve", () => {

        it("chama GET /user/:id/ com o id correto", async () => {
            mockGet.mockResolvedValueOnce({ data: USUARIO })

            await usuarioService.retrieve(1)

            expect(mockGet).toHaveBeenCalledWith("/user/1/")
        })

        it("retorna os dados do usuário", async () => {
            mockGet.mockResolvedValueOnce({ data: USUARIO })

            const result = await usuarioService.retrieve(1)

            expect(result).toEqual(USUARIO)
        })

        it("lança erro de conexão quando AxiosError sem response", async () => {
            mockGet.mockRejectedValueOnce(makeAxiosError())

            await expect(usuarioService.retrieve(1)).rejects.toThrow(
                "Erro de conexão com o servidor."
            )
        })

        it("lança mensagem de detail quando API retorna detail", async () => {
            mockGet.mockRejectedValueOnce(
                makeAxiosError(404, { detail: "Não encontrado." })
            )

            await expect(usuarioService.retrieve(1)).rejects.toThrow("Não encontrado.")
        })

        it("relança o AxiosError original quando status é 400", async () => {
            const error400 = makeAxiosError(400)
            mockGet.mockRejectedValueOnce(error400)

            await expect(usuarioService.retrieve(1)).rejects.toBe(error400)
        })

        it("lança mensagem padrão para outros status HTTP", async () => {
            mockGet.mockRejectedValueOnce(makeAxiosError(500))

            await expect(usuarioService.retrieve(1)).rejects.toThrow(
                "Erro ao buscar usuário"
            )
        })

        it("propaga erro genérico (não-Axios) diretamente", async () => {
            const genericError = new Error("Falha genérica")
            mockGet.mockRejectedValueOnce(genericError)

            await expect(usuarioService.retrieve(1)).rejects.toThrow("Falha genérica")
        })
    })

    // ── create ────────────────────────────────────────────────────────────────

    describe("create", () => {

        const user_senha = ['Abc', '123!'].join('')
        const PAYLOAD: UsuarioCreatePayload = {
            username: "novo.usuario",
            nome: "Novo Usuário",
            email: "novo@email.com",
            rf: "654321",
            unidade_administrativa: 10,
            unidade_orcamentaria: 20,
            group_name: "GESTOR_PATRIMONIO",
            password: user_senha,
            password_confirm: user_senha,
            is_active: true,
        }

        it("chama POST /user/ com o payload correto", async () => {
            mockPost.mockResolvedValueOnce({ data: USUARIO })

            await usuarioService.create(PAYLOAD)

            expect(mockPost).toHaveBeenCalledWith("/user/", PAYLOAD)
        })

        it("retorna os dados do usuário criado", async () => {
            mockPost.mockResolvedValueOnce({ data: USUARIO })

            const result = await usuarioService.create(PAYLOAD)

            expect(result).toEqual(USUARIO)
        })

        it("lança erro de conexão quando AxiosError sem response", async () => {
            mockPost.mockRejectedValueOnce(makeAxiosError())

            await expect(usuarioService.create(PAYLOAD)).rejects.toThrow(
                "Erro de conexão com o servidor."
            )
        })

        it("lança mensagem de detail quando API retorna detail", async () => {
            mockPost.mockRejectedValueOnce(
                makeAxiosError(422, { detail: "Dados inválidos." })
            )

            await expect(usuarioService.create(PAYLOAD)).rejects.toThrow(
                "Dados inválidos."
            )
        })

        it("relança o AxiosError original quando status é 400", async () => {
            const error400 = makeAxiosError(400, { username: ["Já existe."] })
            mockPost.mockRejectedValueOnce(error400)

            await expect(usuarioService.create(PAYLOAD)).rejects.toBe(error400)
        })

        it("lança mensagem padrão para outros status HTTP", async () => {
            mockPost.mockRejectedValueOnce(makeAxiosError(500))

            await expect(usuarioService.create(PAYLOAD)).rejects.toThrow(
                "Erro ao criar usuário"
            )
        })

        it("propaga erro genérico (não-Axios) diretamente", async () => {
            mockPost.mockRejectedValueOnce(new Error("Falha genérica"))

            await expect(usuarioService.create(PAYLOAD)).rejects.toThrow(
                "Falha genérica"
            )
        })
    })

    // ── update ────────────────────────────────────────────────────────────────

    describe("update", () => {

        const PAYLOAD: Partial<import("../usuario.service").Usuario> = {
            nome: "Nome Atualizado",
        }

        it("chama PUT /user/:id/ com id e payload corretos", async () => {
            mockPut.mockResolvedValueOnce({ data: USUARIO })

            await usuarioService.update(1, PAYLOAD)

            expect(mockPut).toHaveBeenCalledWith("/user/1/", PAYLOAD)
        })

        it("retorna os dados do usuário atualizado", async () => {
            mockPut.mockResolvedValueOnce({ data: USUARIO })

            const result = await usuarioService.update(1, PAYLOAD)

            expect(result).toEqual(USUARIO)
        })

        it("lança erro de conexão quando AxiosError sem response", async () => {
            mockPut.mockRejectedValueOnce(makeAxiosError())

            await expect(usuarioService.update(1, PAYLOAD)).rejects.toThrow(
                "Erro de conexão com o servidor."
            )
        })

        it("lança mensagem de detail quando API retorna detail", async () => {
            mockPut.mockRejectedValueOnce(
                makeAxiosError(422, { detail: "Conflito de dados." })
            )

            await expect(usuarioService.update(1, PAYLOAD)).rejects.toThrow(
                "Conflito de dados."
            )
        })

        it("relança o AxiosError original quando status é 400", async () => {
            const error400 = makeAxiosError(400)
            mockPut.mockRejectedValueOnce(error400)

            await expect(usuarioService.update(1, PAYLOAD)).rejects.toBe(error400)
        })

        it("lança mensagem padrão para outros status HTTP", async () => {
            mockPut.mockRejectedValueOnce(makeAxiosError(500))

            await expect(usuarioService.update(1, PAYLOAD)).rejects.toThrow(
                "Erro ao atualizar usuário"
            )
        })

        it("propaga erro genérico (não-Axios) diretamente", async () => {
            mockPut.mockRejectedValueOnce(new Error("Falha genérica"))

            await expect(usuarioService.update(1, PAYLOAD)).rejects.toThrow(
                "Falha genérica"
            )
        })
    })

    // ── partialUpdate ─────────────────────────────────────────────────────────

    describe("partialUpdate", () => {

        const PAYLOAD: Partial<import("../usuario.service").Usuario> = {
            status: "inativo",
        }

        it("chama PATCH /user/:id/ com id e payload corretos", async () => {
            mockPatch.mockResolvedValueOnce({ data: USUARIO })

            await usuarioService.partialUpdate(1, PAYLOAD)

            expect(mockPatch).toHaveBeenCalledWith("/user/1/", PAYLOAD)
        })

        it("retorna os dados do usuário atualizado parcialmente", async () => {
            mockPatch.mockResolvedValueOnce({ data: USUARIO })

            const result = await usuarioService.partialUpdate(1, PAYLOAD)

            expect(result).toEqual(USUARIO)
        })

        it("lança erro de conexão quando AxiosError sem response", async () => {
            mockPatch.mockRejectedValueOnce(makeAxiosError())

            await expect(usuarioService.partialUpdate(1, PAYLOAD)).rejects.toThrow(
                "Erro de conexão com o servidor."
            )
        })

        it("lança mensagem de detail quando API retorna detail", async () => {
            mockPatch.mockRejectedValueOnce(
                makeAxiosError(422, { detail: "Campo inválido." })
            )

            await expect(usuarioService.partialUpdate(1, PAYLOAD)).rejects.toThrow(
                "Campo inválido."
            )
        })

        it("relança o AxiosError original quando status é 400", async () => {
            const error400 = makeAxiosError(400)
            mockPatch.mockRejectedValueOnce(error400)

            await expect(usuarioService.partialUpdate(1, PAYLOAD)).rejects.toBe(
                error400
            )
        })

        it("lança mensagem padrão para outros status HTTP", async () => {
            mockPatch.mockRejectedValueOnce(makeAxiosError(500))

            await expect(usuarioService.partialUpdate(1, PAYLOAD)).rejects.toThrow(
                "Erro ao atualizar usuário"
            )
        })

        it("propaga erro genérico (não-Axios) diretamente", async () => {
            mockPatch.mockRejectedValueOnce(new Error("Falha genérica"))

            await expect(usuarioService.partialUpdate(1, PAYLOAD)).rejects.toThrow(
                "Falha genérica"
            )
        })
    })

    // ── delete ────────────────────────────────────────────────────────────────

    describe("delete", () => {

        it("chama DELETE /usuarios/:id/ com o id correto", async () => {
            mockDelete.mockResolvedValueOnce({})

            await usuarioService.delete(1)

            expect(mockDelete).toHaveBeenCalledWith("/usuarios/1/")
        })

        it("resolve sem retornar valor (void)", async () => {
            mockDelete.mockResolvedValueOnce({})

            const result = await usuarioService.delete(1)

            expect(result).toBeUndefined()
        })

        it("lança erro de conexão quando AxiosError sem response", async () => {
            mockDelete.mockRejectedValueOnce(makeAxiosError())

            await expect(usuarioService.delete(1)).rejects.toThrow(
                "Erro de conexão com o servidor."
            )
        })

        it("lança mensagem de detail quando API retorna detail", async () => {
            mockDelete.mockRejectedValueOnce(
                makeAxiosError(403, { detail: "Sem permissão." })
            )

            await expect(usuarioService.delete(1)).rejects.toThrow("Sem permissão.")
        })

        it("relança o AxiosError original quando status é 400", async () => {
            const error400 = makeAxiosError(400)
            mockDelete.mockRejectedValueOnce(error400)

            await expect(usuarioService.delete(1)).rejects.toBe(error400)
        })

        it("lança mensagem padrão para outros status HTTP", async () => {
            mockDelete.mockRejectedValueOnce(makeAxiosError(500))

            await expect(usuarioService.delete(1)).rejects.toThrow(
                "Erro ao remover usuário"
            )
        })

        it("propaga erro genérico (não-Axios) diretamente", async () => {
            mockDelete.mockRejectedValueOnce(new Error("Falha genérica"))

            await expect(usuarioService.delete(1)).rejects.toThrow("Falha genérica")
        })
    })

    // ── exportar ─────────────────────────────────────────────────────────────

    describe("exportar", () => {

        it("chama GET /user/exportar/ e retorna blob e nome do arquivo", async () => {
            const blob = new Blob(["xlsx-content"], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            })

            mockGet.mockResolvedValueOnce({
                data: blob,
                headers: {
                    "content-disposition": 'attachment; filename="usuarios.xlsx"',
                    "content-type":
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                },
            })

            const result = await usuarioService.exportar()

            expect(mockGet).toHaveBeenCalledWith("/user/exportar/", {
                responseType: "blob",
            })
            expect(result.blob).toBe(blob)
            expect(result.fileName).toBe("usuarios.xlsx")
            expect(result.contentType).toBe(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            )
        })

        it("usa nome padrao quando backend nao envia content-disposition", async () => {
            const blob = new Blob(["xlsx-content"])

            mockGet.mockResolvedValueOnce({
                data: blob,
                headers: {},
            })

            const result = await usuarioService.exportar()

            expect(result.fileName).toBe("usuarios.xlsx")
        })

        it("lança mensagem padrao em erro de exportacao", async () => {
            mockGet.mockRejectedValueOnce(makeAxiosError(500))

            await expect(usuarioService.exportar()).rejects.toThrow(
                "Erro ao exportar usuários"
            )
        })
    })
})
