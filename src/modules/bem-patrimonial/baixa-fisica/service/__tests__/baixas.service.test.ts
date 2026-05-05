import { describe, it, expect, vi, beforeEach } from "vitest"
import { baixaFisicaService, downloadBlob } from "../baixas.service"
import { api } from "@/api/http"
import { AxiosError } from "axios"

// ===================== MOCKS =====================

vi.mock("@/api/http", () => ({
    api: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn(),
    },
}))

// ===================== FACTORIES =====================

function makeAxiosError(status: number, data: unknown = {}) {
    const error = new AxiosError("error")
    error.response = { status, data, headers: {}, config: {} as never, statusText: "" }
    return error
}

function makeAxiosNetworkError() {
    const error = new AxiosError("Network Error")
    error.response = undefined
    return error
}

function makePaginatedResponse(results: unknown[] = []) {
    return { data: { results, count: results.length, next: null, previous: null } }
}

function makeBaixaDetail(overrides = {}) {
    return {
        id: 1,
        status: "aguardando_envio",
        status_display: "Aguardando Envio",
        numero_processo_baixa: "PROC-001",
        itens: [],
        ...overrides,
    }
}

// ===================== TESTS =====================

describe("baixaFisicaService", () => {

    beforeEach(() => {
        vi.clearAllMocks()
    })

    // ------------------------------------------------------------------ list

    describe("list", () => {
        it("retorna dados paginados", async () => {
            const mockData = makePaginatedResponse([makeBaixaDetail()])
            vi.mocked(api.get).mockResolvedValue(mockData)

            const result = await baixaFisicaService.list()
            expect(result).toEqual(mockData.data)
            expect(api.get).toHaveBeenCalledWith("/baixa-fisica/?")
        })

        it("passa parâmetro page", async () => {
            vi.mocked(api.get).mockResolvedValue(makePaginatedResponse())
            await baixaFisicaService.list({ page: 2 })
            expect(api.get).toHaveBeenCalledWith(expect.stringContaining("page=2"))
        })

        it("passa parâmetro search", async () => {
            vi.mocked(api.get).mockResolvedValue(makePaginatedResponse())
            await baixaFisicaService.list({ search: "PROC" })
            expect(api.get).toHaveBeenCalledWith(expect.stringContaining("search=PROC"))
        })

        it("não passa search quando vazio", async () => {
            vi.mocked(api.get).mockResolvedValue(makePaginatedResponse())
            await baixaFisicaService.list({ search: "  " })
            expect(api.get).toHaveBeenCalledWith(expect.not.stringContaining("search"))
        })

        it("não passa status 'todos'", async () => {
            vi.mocked(api.get).mockResolvedValue(makePaginatedResponse())
            await baixaFisicaService.list({ status: "todos" })
            expect(api.get).toHaveBeenCalledWith(expect.not.stringContaining("status"))
        })

        it("passa status quando não é 'todos'", async () => {
            vi.mocked(api.get).mockResolvedValue(makePaginatedResponse())
            await baixaFisicaService.list({ status: "solicitada" })
            expect(api.get).toHaveBeenCalledWith(expect.stringContaining("status=solicitada"))
        })

        it("passa unidade_administrativa_origem", async () => {
            vi.mocked(api.get).mockResolvedValue(makePaginatedResponse())
            await baixaFisicaService.list({ unidade_administrativa_origem: 5 })
            expect(api.get).toHaveBeenCalledWith(expect.stringContaining("unidade_administrativa_origem=5"))
        })

        it("passa ordering", async () => {
            vi.mocked(api.get).mockResolvedValue(makePaginatedResponse())
            await baixaFisicaService.list({ ordering: "-data_criacao" })
            expect(api.get).toHaveBeenCalledWith(expect.stringContaining("ordering=-data_criacao"))
        })

        it("passa data_criacao__gte e data_criacao__lte", async () => {
            vi.mocked(api.get).mockResolvedValue(makePaginatedResponse())
            await baixaFisicaService.list({ data_criacao__gte: "2024-01-01", data_criacao__lte: "2024-12-31" })
            const url = vi.mocked(api.get).mock.calls[0][0] as string
            expect(url).toContain("data_criacao__gte=2024-01-01")
            expect(url).toContain("data_criacao__lte=2024-12-31")
        })

        it("lança erro de conexão", async () => {
            vi.mocked(api.get).mockRejectedValue(makeAxiosNetworkError())
            await expect(baixaFisicaService.list()).rejects.toThrow("Erro de conexão com o servidor.")
        })

        it("lança erro com detail da API", async () => {
            vi.mocked(api.get).mockRejectedValue(makeAxiosError(500, { detail: "Erro interno" }))
            await expect(baixaFisicaService.list()).rejects.toThrow("Erro interno")
        })

        it("lança erro padrão em outros status", async () => {
            vi.mocked(api.get).mockRejectedValue(makeAxiosError(500, {}))
            await expect(baixaFisicaService.list()).rejects.toThrow("Erro ao listar baixas físicas")
        })
    })

    // --------------------------------------------------------------- retrieve

    describe("retrieve", () => {
        it("retorna baixa pelo id", async () => {
            const detail = makeBaixaDetail()
            vi.mocked(api.get).mockResolvedValue({ data: detail })
            const result = await baixaFisicaService.retrieve(1)
            expect(result).toEqual(detail)
            expect(api.get).toHaveBeenCalledWith("/baixa-fisica/1/")
        })

        it("lança erro de conexão", async () => {
            vi.mocked(api.get).mockRejectedValue(makeAxiosNetworkError())
            await expect(baixaFisicaService.retrieve(1)).rejects.toThrow("Erro de conexão com o servidor.")
        })

        it("lança erro padrão", async () => {
            vi.mocked(api.get).mockRejectedValue(makeAxiosError(404, {}))
            await expect(baixaFisicaService.retrieve(1)).rejects.toThrow("Erro ao buscar baixa física")
        })
    })

    // ----------------------------------------------------------------- create

    describe("create", () => {
        it("cria baixa e retorna detalhe", async () => {
            const detail = makeBaixaDetail()
            vi.mocked(api.post).mockResolvedValue({ data: detail })

            const payload = { unidade_administrativa_origem: 1, numero_processo_baixa: "P-001", data_baixa: "2024-01-01", itens: [] }
            const result = await baixaFisicaService.create(payload)

            expect(result).toEqual(detail)
            expect(api.post).toHaveBeenCalledWith("/baixa-fisica/", payload)
        })

        it("lança AxiosError 400 diretamente", async () => {
            const axiosErr = makeAxiosError(400, { campo: ["Obrigatório"] })
            vi.mocked(api.post).mockRejectedValue(axiosErr)
            await expect(baixaFisicaService.create({ unidade_administrativa_origem: 1, numero_processo_baixa: "", data_baixa: "", itens: [] })).rejects.toThrow(AxiosError)
        })

        it("lança erro padrão", async () => {
            vi.mocked(api.post).mockRejectedValue(makeAxiosError(500, {}))
            await expect(baixaFisicaService.create({ unidade_administrativa_origem: 1, numero_processo_baixa: "", data_baixa: "", itens: [] })).rejects.toThrow("Erro ao criar baixa física")
        })
    })

    // ----------------------------------------------------------------- update

    describe("update", () => {
        it("atualiza baixa e retorna detalhe", async () => {
            const detail = makeBaixaDetail()
            vi.mocked(api.put).mockResolvedValue({ data: detail })

            const payload = { numero_processo_baixa: "P-002", data_baixa: "2024-02-01", itens: [] }
            const result = await baixaFisicaService.update(1, payload)

            expect(result).toEqual(detail)
            expect(api.put).toHaveBeenCalledWith("/baixa-fisica/1/", payload)
        })

        it("lança erro padrão", async () => {
            vi.mocked(api.put).mockRejectedValue(makeAxiosError(500, {}))
            await expect(baixaFisicaService.update(1, { numero_processo_baixa: "", data_baixa: "", itens: [] })).rejects.toThrow("Erro ao atualizar baixa física")
        })
    })

    // ---------------------------------------------------------- partialUpdate

    describe("partialUpdate", () => {
        it("faz patch e retorna detalhe", async () => {
            const detail = makeBaixaDetail()
            vi.mocked(api.patch).mockResolvedValue({ data: detail })

            const result = await baixaFisicaService.partialUpdate(1, { numero_processo_baixa: "P-003" })

            expect(result).toEqual(detail)
            expect(api.patch).toHaveBeenCalledWith("/baixa-fisica/1/", { numero_processo_baixa: "P-003" })
        })
    })

    // -------------------------------------------------------- enviarSolicitacao

    describe("enviarSolicitacao", () => {
        it("envia solicitação e retorna detalhe", async () => {
            const detail = makeBaixaDetail({ status: "solicitada" })
            vi.mocked(api.post).mockResolvedValue({ data: detail })

            const result = await baixaFisicaService.enviarSolicitacao(1)
            expect(result).toEqual(detail)
            expect(api.post).toHaveBeenCalledWith("/baixa-fisica/1/solicitar/")
        })

        it("lança erro padrão", async () => {
            vi.mocked(api.post).mockRejectedValue(makeAxiosError(500, {}))
            await expect(baixaFisicaService.enviarSolicitacao(1)).rejects.toThrow("Erro ao enviar solicitação de baixa física")
        })
    })

    // --------------------------------------------------------------- aprovar

    describe("aprovar", () => {
        it("aprova e retorna detalhe", async () => {
            const detail = makeBaixaDetail({ status: "aceita" })
            vi.mocked(api.post).mockResolvedValue({ data: detail })

            const result = await baixaFisicaService.aprovar(1)
            expect(result).toEqual(detail)
            expect(api.post).toHaveBeenCalledWith("/baixa-fisica/1/aprovar/")
        })

        it("lança erro padrão", async () => {
            vi.mocked(api.post).mockRejectedValue(makeAxiosError(500, {}))
            await expect(baixaFisicaService.aprovar(1)).rejects.toThrow("Erro ao aprovar baixa física")
        })
    })

    // ---------------------------------------------------------------- recusar

    describe("recusar", () => {
        it("recusa sem payload e retorna detalhe", async () => {
            const detail = makeBaixaDetail({ status: "recusada" })
            vi.mocked(api.post).mockResolvedValue({ data: detail })

            const result = await baixaFisicaService.recusar(1)
            expect(result).toEqual(detail)
            expect(api.post).toHaveBeenCalledWith("/baixa-fisica/1/recusar/", {})
        })

        it("recusa com motivo", async () => {
            vi.mocked(api.post).mockResolvedValue({ data: makeBaixaDetail() })
            await baixaFisicaService.recusar(1, { motivo: "Inválido" })
            expect(api.post).toHaveBeenCalledWith("/baixa-fisica/1/recusar/", { motivo: "Inválido" })
        })

        it("lança erro padrão", async () => {
            vi.mocked(api.post).mockRejectedValue(makeAxiosError(500, {}))
            await expect(baixaFisicaService.recusar(1)).rejects.toThrow("Erro ao recusar baixa física")
        })
    })

    // --------------------------------------------------------------- cancelar

    describe("cancelar", () => {
        it("cancela e retorna detalhe", async () => {
            const detail = makeBaixaDetail({ status: "cancelada" })
            vi.mocked(api.post).mockResolvedValue({ data: detail })

            const result = await baixaFisicaService.cancelar(1)
            expect(result).toEqual(detail)
            expect(api.post).toHaveBeenCalledWith("/baixa-fisica/1/cancelar/", {})
        })

        it("lança erro padrão", async () => {
            vi.mocked(api.post).mockRejectedValue(makeAxiosError(500, {}))
            await expect(baixaFisicaService.cancelar(1)).rejects.toThrow("Erro ao cancelar baixa física")
        })
    })

    // ------------------------------------------------------------- gerarNbbpm

    describe("gerarNbbpm", () => {
        it("retorna blob", async () => {
            const blob = new Blob(["pdf"], { type: "application/pdf" })
            vi.mocked(api.get).mockResolvedValue({ data: blob })

            const result = await baixaFisicaService.gerarNbbpm(1)
            expect(result).toBe(blob)
            expect(api.get).toHaveBeenCalledWith("/baixa-fisica/1/gerar-nbbpm/", { responseType: "blob" })
        })

        it("lança erro padrão", async () => {
            vi.mocked(api.get).mockRejectedValue(makeAxiosError(500, {}))
            await expect(baixaFisicaService.gerarNbbpm(1)).rejects.toThrow("Erro ao gerar NBBPM")
        })
    })

    // ---------------------------------------------------------- exportarExcel

    describe("exportarExcel", () => {
        it("retorna blob sem parâmetros", async () => {
            const blob = new Blob(["xlsx"])
            vi.mocked(api.get).mockResolvedValue({ data: blob })

            const result = await baixaFisicaService.exportarExcel()
            expect(result).toBe(blob)
            expect(api.get).toHaveBeenCalledWith("/baixa-fisica/exportar-excel/?", { responseType: "blob" })
        })

        it("passa ids e unidade_administrativa_origem", async () => {
            vi.mocked(api.get).mockResolvedValue({ data: new Blob() })
            await baixaFisicaService.exportarExcel({ ids: "1,2,3", unidade_administrativa_origem: 5 })
            const url = vi.mocked(api.get).mock.calls[0][0] as string
            expect(url).toContain("ids=1%2C2%2C3")
            expect(url).toContain("unidade_administrativa_origem=5")
        })

        it("não passa status 'todos'", async () => {
            vi.mocked(api.get).mockResolvedValue({ data: new Blob() })
            await baixaFisicaService.exportarExcel({ status: "todos" })
            expect(vi.mocked(api.get).mock.calls[0][0]).not.toContain("status")
        })

        it("lança erro padrão", async () => {
            vi.mocked(api.get).mockRejectedValue(makeAxiosError(500, {}))
            await expect(baixaFisicaService.exportarExcel()).rejects.toThrow("Erro ao exportar Excel")
        })
    })

    // --------------------------------------------------------------- historico

    describe("historico", () => {
        it("retorna dados do histórico", async () => {
            const entries = [{ id: 1, campo: "status", valor_antigo: "rascunho", valor_novo: "solicitada" }]
            vi.mocked(api.get).mockResolvedValue({ data: entries })

            const result = await baixaFisicaService.historico(1)
            expect(result).toEqual(entries)
            expect(api.get).toHaveBeenCalledWith("/baixa-fisica/1/historico/")
        })

        it("lança erro padrão", async () => {
            vi.mocked(api.get).mockRejectedValue(makeAxiosError(500, {}))
            await expect(baixaFisicaService.historico(1)).rejects.toThrow("Erro ao buscar histórico")
        })
    })

    // ---------------------------------------------------------- erro não-Axios

    describe("handleApiError — erro não-Axios", () => {
        it("relança erros que não são AxiosError", async () => {
            const genericError = new Error("Erro genérico")
            vi.mocked(api.get).mockRejectedValue(genericError)
            await expect(baixaFisicaService.retrieve(1)).rejects.toThrow("Erro genérico")
        })
    })
})

// ============================================================================
// downloadBlob
// ============================================================================

describe("downloadBlob", () => {
    it("cria link, faz click e revoga URL", () => {
        const createObjectURL = vi.fn(() => "blob:mock-url")
        const revokeObjectURL = vi.fn()
        const click = vi.fn()

        vi.stubGlobal("URL", { createObjectURL, revokeObjectURL })

        const linkEl = { href: "", download: "", click } as unknown as HTMLAnchorElement
        vi.spyOn(document, "createElement").mockReturnValue(linkEl)

        const blob = new Blob(["data"])
        downloadBlob(blob, "file.xlsx")

        expect(createObjectURL).toHaveBeenCalledWith(blob)
        expect(linkEl.href).toBe("blob:mock-url")
        expect(linkEl.download).toBe("file.xlsx")
        expect(click).toHaveBeenCalled()
        expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-url")
    })
})