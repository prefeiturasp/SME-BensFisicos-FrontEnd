import { describe, it, expect, vi, beforeEach } from "vitest"
import { unidadeAdministrativaService } from "../unidadeAdministrativa.service"
import { api } from "@/api/http"

// ─── Mock ─────────────────────────────────────────────────────────────────────

vi.mock("@/api/http", () => ({
    api: {
        get: vi.fn(),
    },
}))

const mockGet = vi.mocked(api.get)

// ─── Helpers ──────────────────────────────────────────────────────────────────

const UNIDADES_RESPONSE = {
    results: [
        { id: 1, codigo: "001", nome: "Secretaria de Finanças", sigla: "SF" },
        { id: 2, codigo: "002", nome: "Secretaria de Educação", sigla: "SE" },
    ],
    count: 2,
}

// ─── Testes ───────────────────────────────────────────────────────────────────

describe("unidadeAdministrativaService", () => {

    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("list", () => {

        it("chama o endpoint correto", async () => {
            mockGet.mockResolvedValueOnce({ data: UNIDADES_RESPONSE })

            await unidadeAdministrativaService.list()

            expect(mockGet).toHaveBeenCalledWith("/unidades-administrativas/")
        })

        it("chama o endpoint exatamente uma vez", async () => {
            mockGet.mockResolvedValueOnce({ data: UNIDADES_RESPONSE })

            await unidadeAdministrativaService.list()

            expect(mockGet).toHaveBeenCalledTimes(1)
        })

        it("retorna os dados da resposta da API", async () => {
            mockGet.mockResolvedValueOnce({ data: UNIDADES_RESPONSE })

            const result = await unidadeAdministrativaService.list()

            expect(result).toEqual(UNIDADES_RESPONSE)
        })

        it("retorna resposta com lista vazia quando não há unidades", async () => {
            const emptyResponse = { results: [], count: 0 }
            mockGet.mockResolvedValueOnce({ data: emptyResponse })

            const result = await unidadeAdministrativaService.list()

            expect(result).toEqual(emptyResponse)
        })

        it("propaga o erro quando a API falha", async () => {
            const apiError = new Error("Network Error")
            mockGet.mockRejectedValueOnce(apiError)

            await expect(unidadeAdministrativaService.list()).rejects.toThrow(
                "Network Error"
            )
        })

        it("propaga erro de status 500", async () => {
            const serverError = new Error("Request failed with status code 500")
            mockGet.mockRejectedValueOnce(serverError)

            await expect(unidadeAdministrativaService.list()).rejects.toThrow(
                "Request failed with status code 500"
            )
        })

        it("propaga erro de status 401", async () => {
            const authError = new Error("Request failed with status code 401")
            mockGet.mockRejectedValueOnce(authError)

            await expect(unidadeAdministrativaService.list()).rejects.toThrow(
                "Request failed with status code 401"
            )
        })
    })
})