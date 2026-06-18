import { describe, it, expect, vi, beforeEach } from "vitest"
import { AxiosError } from "axios"

import { api } from "@/api/http"
import { baixaFisicaService, downloadBlob } from "../baixas.service"

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
    error.response = {
        status,
        data,
        headers: {},
        config: {} as never,
        statusText: "",
    }
    return error
}

function makeAxiosNetworkError() {
    const error = new AxiosError("Network Error")
    error.response = undefined
    return error
}

function makePaginatedResponse(results: unknown[] = []) {
    return {
        data: {
            results,
            count: results.length,
            next: null,
            previous: null,
        },
    }
}

function makeBaixaDetail(overrides = {}) {
    return {
        id: 1,
        status: "aguardando_envio",
        status_display: "Em elaboração",
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

    describe("list", () => {
        it("retorna dados paginados", async () => {
            const mockData = makePaginatedResponse([makeBaixaDetail()])
            vi.mocked(api.get).mockResolvedValue(mockData)

            const result = await baixaFisicaService.list()

            expect(result).toEqual(mockData.data)
            expect(api.get).toHaveBeenCalledWith("/baixa-fisica/?")
        })

        it("monta query string com os filtros válidos", async () => {
            vi.mocked(api.get).mockResolvedValue(makePaginatedResponse())

            await baixaFisicaService.list({
                page: 2,
                search: " PROC-001 ",
                status: "solicitada",
                unidade_administrativa_origem: 5,
                ordering: "-data_criacao",
                data_criacao__gte: "2024-01-01",
                data_criacao__lte: "2024-12-31",
                data_aprovacao__gte: "2024-02-01",
                data_aprovacao__lte: "2024-02-28",
            })

            const url = vi.mocked(api.get).mock.calls[0][0] as string

            expect(url).toContain("page=2")
            expect(url).toContain("search=PROC-001")
            expect(url).toContain("status=solicitada")
            expect(url).toContain("unidade_administrativa_origem=5")
            expect(url).toContain("ordering=-data_criacao")
            expect(url).toContain("data_criacao__gte=2024-01-01")
            expect(url).toContain("data_criacao__lte=2024-12-31")
            expect(url).toContain("data_aprovacao__gte=2024-02-01")
            expect(url).toContain("data_aprovacao__lte=2024-02-28")
        })

        it("não envia search vazio nem status todos", async () => {
            vi.mocked(api.get).mockResolvedValue(makePaginatedResponse())

            await baixaFisicaService.list({ search: "   ", status: "todos" })

            const url = vi.mocked(api.get).mock.calls[0][0] as string
            expect(url).not.toContain("search")
            expect(url).not.toContain("status")
        })

        it("lança erro de conexão", async () => {
            vi.mocked(api.get).mockRejectedValue(makeAxiosNetworkError())

            await expect(baixaFisicaService.list()).rejects.toThrow(
                "Erro de conexão com o servidor."
            )
        })

        it("lança erro usando detail retornado pela API", async () => {
            vi.mocked(api.get).mockRejectedValue(
                makeAxiosError(500, { detail: "Erro interno" })
            )

            await expect(baixaFisicaService.list()).rejects.toThrow("Erro interno")
        })

        it("lança erro padrão quando API não retorna detail", async () => {
            vi.mocked(api.get).mockRejectedValue(makeAxiosError(500, {}))

            await expect(baixaFisicaService.list()).rejects.toThrow(
                "Erro ao listar baixas físicas"
            )
        })
    })

    describe("retrieve", () => {
        it("retorna baixa pelo id", async () => {
            const detail = makeBaixaDetail()
            vi.mocked(api.get).mockResolvedValue({ data: detail })

            const result = await baixaFisicaService.retrieve(1)

            expect(result).toEqual(detail)
            expect(api.get).toHaveBeenCalledWith("/baixa-fisica/1/")
        })

        it("lança erro padrão", async () => {
            vi.mocked(api.get).mockRejectedValue(makeAxiosError(404, {}))

            await expect(baixaFisicaService.retrieve(1)).rejects.toThrow(
                "Erro ao buscar baixa física"
            )
        })
    })

    describe("create", () => {
        it("cria baixa e retorna detalhe", async () => {
            const detail = makeBaixaDetail()
            const payload = {
                unidade_administrativa_origem: 1,
                numero_processo_baixa: "P-001",
                data_baixa: "2024-01-01",
                itens: [],
            }
            vi.mocked(api.post).mockResolvedValue({ data: detail })

            const result = await baixaFisicaService.create(payload)

            expect(result).toEqual(detail)
            expect(api.post).toHaveBeenCalledWith("/baixa-fisica/", payload)
        })

        it("relança AxiosError 400 para tratamento de validação no formulário", async () => {
            const axiosErr = makeAxiosError(400, { campo: ["Obrigatório"] })
            vi.mocked(api.post).mockRejectedValue(axiosErr)

            await expect(
                baixaFisicaService.create({
                    unidade_administrativa_origem: 1,
                    numero_processo_baixa: "",
                    data_baixa: "",
                    itens: [],
                })
            ).rejects.toThrow(AxiosError)
        })

        it("lança erro padrão", async () => {
            vi.mocked(api.post).mockRejectedValue(makeAxiosError(500, {}))

            await expect(
                baixaFisicaService.create({
                    unidade_administrativa_origem: 1,
                    numero_processo_baixa: "",
                    data_baixa: "",
                    itens: [],
                })
            ).rejects.toThrow("Erro ao criar baixa física")
        })
    })

    describe("update", () => {
        it("atualiza baixa e retorna detalhe", async () => {
            const detail = makeBaixaDetail()
            const payload = {
                numero_processo_baixa: "P-002",
                data_baixa: "2024-02-01",
                itens: [],
            }
            vi.mocked(api.put).mockResolvedValue({ data: detail })

            const result = await baixaFisicaService.update(1, payload)

            expect(result).toEqual(detail)
            expect(api.put).toHaveBeenCalledWith("/baixa-fisica/1/", payload)
        })

        it("lança erro padrão", async () => {
            vi.mocked(api.put).mockRejectedValue(makeAxiosError(500, {}))

            await expect(
                baixaFisicaService.update(1, {
                    numero_processo_baixa: "",
                    data_baixa: "",
                    itens: [],
                })
            ).rejects.toThrow("Erro ao atualizar baixa física")
        })
    })

    describe("partialUpdate", () => {
        it("faz patch e retorna detalhe", async () => {
            const detail = makeBaixaDetail()
            const payload = { numero_processo_baixa: "P-003" }
            vi.mocked(api.patch).mockResolvedValue({ data: detail })

            const result = await baixaFisicaService.partialUpdate(1, payload)

            expect(result).toEqual(detail)
            expect(api.patch).toHaveBeenCalledWith("/baixa-fisica/1/", payload)
        })
    })

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

            await expect(baixaFisicaService.enviarSolicitacao(1)).rejects.toThrow(
                "Erro ao enviar solicitação de baixa física"
            )
        })
    })

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

            await expect(baixaFisicaService.aprovar(1)).rejects.toThrow(
                "Erro ao aprovar baixa física"
            )
        })
    })

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

            expect(api.post).toHaveBeenCalledWith("/baixa-fisica/1/recusar/", {
                motivo: "Inválido",
            })
        })

        it("lança erro padrão", async () => {
            vi.mocked(api.post).mockRejectedValue(makeAxiosError(500, {}))

            await expect(baixaFisicaService.recusar(1)).rejects.toThrow(
                "Erro ao recusar baixa física"
            )
        })
    })

    describe("solicitarCorrecao", () => {
        it("solicita correção e retorna detalhe", async () => {
            const detail = makeBaixaDetail({ status: "aguardando_envio" })
            vi.mocked(api.post).mockResolvedValue({ data: detail })

            const result = await baixaFisicaService.solicitarCorrecao(1, {
                motivo: "Corrigir item PAT-001",
            })

            expect(result).toEqual(detail)
            expect(api.post).toHaveBeenCalledWith(
                "/baixa-fisica/1/solicitar-correcao/",
                { motivo: "Corrigir item PAT-001" }
            )
        })

        it("lança erro padrão", async () => {
            vi.mocked(api.post).mockRejectedValue(makeAxiosError(500, {}))

            await expect(
                baixaFisicaService.solicitarCorrecao(1, { motivo: "Corrigir" })
            ).rejects.toThrow("Erro ao solicitar correção da baixa física")
        })
    })

    describe("gerarNbbpm", () => {
        it("retorna blob", async () => {
            const blob = new Blob(["pdf"], { type: "application/pdf" })
            vi.mocked(api.get).mockResolvedValue({ data: blob })

            const result = await baixaFisicaService.gerarNbbpm(1)

            expect(result).toBe(blob)
            expect(api.get).toHaveBeenCalledWith("/baixa-fisica/1/gerar-nbbpm/", {
                responseType: "blob",
            })
        })

        it("lança erro padrão", async () => {
            vi.mocked(api.get).mockRejectedValue(makeAxiosError(500, {}))

            await expect(baixaFisicaService.gerarNbbpm(1)).rejects.toThrow(
                "Erro ao gerar NBBPM"
            )
        })
    })

    describe("exportarExcel", () => {
        it("retorna blob sem parâmetros", async () => {
            const blob = new Blob(["xlsx"])
            vi.mocked(api.get).mockResolvedValue({ data: blob })

            const result = await baixaFisicaService.exportarExcel()

            expect(result).toBe(blob)
            expect(api.get).toHaveBeenCalledWith("/baixa-fisica/exportar-excel/?", {
                responseType: "blob",
            })
        })

        it("monta query com ids, status e unidade administrativa", async () => {
            vi.mocked(api.get).mockResolvedValue({ data: new Blob() })

            await baixaFisicaService.exportarExcel({
                ids: "1,2,3",
                status: "aceita",
                unidade_administrativa_origem: 5,
            })

            const url = vi.mocked(api.get).mock.calls[0][0] as string
            expect(url).toContain("ids=1%2C2%2C3")
            expect(url).toContain("status=aceita")
            expect(url).toContain("unidade_administrativa_origem=5")
        })

        it("não envia status todos", async () => {
            vi.mocked(api.get).mockResolvedValue({ data: new Blob() })

            await baixaFisicaService.exportarExcel({ status: "todos" })

            expect(vi.mocked(api.get).mock.calls[0][0]).not.toContain("status")
        })

        it("lança erro padrão", async () => {
            vi.mocked(api.get).mockRejectedValue(makeAxiosError(500, {}))

            await expect(baixaFisicaService.exportarExcel()).rejects.toThrow(
                "Erro ao exportar Excel"
            )
        })
    })

    describe("historico", () => {
        it("retorna dados do histórico", async () => {
            const entries = [
                {
                    id: 1,
                    campo: "status",
                    valor_antigo: "aguardando_envio",
                    valor_novo: "solicitada",
                },
            ]
            vi.mocked(api.get).mockResolvedValue({ data: entries })

            const result = await baixaFisicaService.historico(1)

            expect(result).toEqual(entries)
            expect(api.get).toHaveBeenCalledWith("/baixa-fisica/1/historico/")
        })

        it("lança erro padrão", async () => {
            vi.mocked(api.get).mockRejectedValue(makeAxiosError(500, {}))

            await expect(baixaFisicaService.historico(1)).rejects.toThrow(
                "Erro ao buscar histórico"
            )
        })
    })

    describe("erro não-Axios", () => {
        it("relança erros que não são AxiosError", async () => {
            const genericError = new Error("Erro genérico")
            vi.mocked(api.get).mockRejectedValue(genericError)

            await expect(baixaFisicaService.retrieve(1)).rejects.toThrow(
                "Erro genérico"
            )
        })
    })
})

describe("downloadBlob", () => {
    it("cria link, faz click e revoga URL", () => {
        const createObjectURL = vi.fn(() => "blob:mock-url")
        const revokeObjectURL = vi.fn()
        const click = vi.fn()

        vi.stubGlobal("URL", { createObjectURL, revokeObjectURL })

        const linkEl = {
            href: "",
            download: "",
            click,
        } as unknown as HTMLAnchorElement
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
