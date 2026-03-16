import { act, renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { toast } from "sonner"

import { useUsuariosList } from "../useUsuariosList"

// ─── Mocks de serviços ────────────────────────────────────────────────────────

const mockUsuarioList = vi.fn()
const mockUnidadeList = vi.fn()

vi.mock("../../service/usuario.service", () => ({
    usuarioService: { list: (...args: unknown[]) => mockUsuarioList(...args) },
}))

vi.mock("../../../unidades-administrativas/service/unidadeAdministrativa.service", () => ({
    unidadeAdministrativaService: { list: (...args: unknown[]) => mockUnidadeList(...args) },
}))

vi.mock("sonner", () => ({
    toast: { error: vi.fn() },
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

const USUARIOS_RESPONSE = {
    results: [{ id: 1, username: "joao", nome: "João" }],
    count: 1,
}

const UNIDADES_RESPONSE = {
    results: [{ id: 1, codigo: "001", nome: "Secretaria" }],
}

function setupSuccessfulMocks() {
    mockUsuarioList.mockResolvedValue(USUARIOS_RESPONSE)
    mockUnidadeList.mockResolvedValue(UNIDADES_RESPONSE)
}

function renderUsuariosList(pageSize = 10) {
    return renderHook(() => useUsuariosList({ pageSize }))
}

// ─── Testes ───────────────────────────────────────────────────────────────────

describe("useUsuariosList", () => {

    // ⚠️ beforeEach global: apenas limpa mocks — SEM fake timers aqui
    beforeEach(() => {
        vi.clearAllMocks()
    })

    // ── Estado inicial ────────────────────────────────────────────────────────

    describe("estado inicial", () => {

        it("retorna valores iniciais corretos antes das chamadas resolverem", () => {
            setupSuccessfulMocks()
            const { result } = renderUsuariosList()

            expect(result.current.usuarios).toEqual([])
            expect(result.current.unidades).toEqual([])
            expect(result.current.page).toBe(1)
            expect(result.current.count).toBe(0)
            expect(result.current.loading).toBe(true)
            expect(result.current.searchInput).toBe("")
            expect(result.current.unidadeFilter).toBe("todas")
            expect(result.current.grupoFilter).toBe("todos")
            expect(result.current.statusFilter).toBe("todos")
            expect(result.current.ordering).toBe("")
        })

        it("expõe todos os setters esperados", () => {
            setupSuccessfulMocks()
            const { result } = renderUsuariosList()

            expect(typeof result.current.setPage).toBe("function")
            expect(typeof result.current.setSearchInput).toBe("function")
            expect(typeof result.current.setUnidadeFilter).toBe("function")
            expect(typeof result.current.setGrupoFilter).toBe("function")
            expect(typeof result.current.setStatusFilter).toBe("function")
            expect(typeof result.current.setOrdering).toBe("function")
        })
    })

    // ── fetchUsuarios ─────────────────────────────────────────────────────────

    describe("fetchUsuarios", () => {

        it("popula usuarios e count após sucesso", async () => {
            setupSuccessfulMocks()
            const { result } = renderUsuariosList()

            await waitFor(() => expect(result.current.loading).toBe(false))

            expect(result.current.usuarios).toEqual(USUARIOS_RESPONSE.results)
            expect(result.current.count).toBe(USUARIOS_RESPONSE.count)
        })

        it("exibe toast de erro quando o serviço falha", async () => {
            mockUsuarioList.mockRejectedValue(new Error("Falha"))
            mockUnidadeList.mockResolvedValue(UNIDADES_RESPONSE)

            const { result } = renderUsuariosList()

            await waitFor(() => expect(result.current.loading).toBe(false))

            expect(toast.error).toHaveBeenCalledWith("Erro ao listar usuários")
        })

        it("garante loading=false mesmo após erro", async () => {
            mockUsuarioList.mockRejectedValue(new Error("Falha"))
            mockUnidadeList.mockResolvedValue(UNIDADES_RESPONSE)

            const { result } = renderUsuariosList()

            await waitFor(() => expect(result.current.loading).toBe(false))
        })

        it("passa unidade=undefined quando filtro é 'todas'", async () => {
            setupSuccessfulMocks()
            const { result } = renderUsuariosList()

            await waitFor(() => expect(result.current.loading).toBe(false))

            expect(mockUsuarioList).toHaveBeenCalledWith(
                expect.objectContaining({ unidade: undefined })
            )
        })

        it("passa grupo=undefined quando filtro é 'todos'", async () => {
            setupSuccessfulMocks()
            const { result } = renderUsuariosList()

            await waitFor(() => expect(result.current.loading).toBe(false))

            expect(mockUsuarioList).toHaveBeenCalledWith(
                expect.objectContaining({ grupo: undefined })
            )
        })

        it("passa status=undefined quando filtro é 'todos'", async () => {
            setupSuccessfulMocks()
            const { result } = renderUsuariosList()

            await waitFor(() => expect(result.current.loading).toBe(false))

            expect(mockUsuarioList).toHaveBeenCalledWith(
                expect.objectContaining({ status: undefined })
            )
        })

        it("passa valor real de unidade quando filtro não é 'todas'", async () => {
            setupSuccessfulMocks()
            const { result } = renderUsuariosList()

            await waitFor(() => expect(result.current.loading).toBe(false))

            act(() => result.current.setUnidadeFilter("001"))

            await waitFor(() => expect(result.current.loading).toBe(false))

            expect(mockUsuarioList).toHaveBeenCalledWith(
                expect.objectContaining({ unidade: "001" })
            )
        })

        it("passa valor real de grupo quando filtro não é 'todos'", async () => {
            setupSuccessfulMocks()
            const { result } = renderUsuariosList()

            await waitFor(() => expect(result.current.loading).toBe(false))

            act(() => result.current.setGrupoFilter("GESTOR_PATRIMONIO"))

            await waitFor(() => expect(result.current.loading).toBe(false))

            expect(mockUsuarioList).toHaveBeenCalledWith(
                expect.objectContaining({ grupo: "GESTOR_PATRIMONIO" })
            )
        })

        it("passa valor real de status quando filtro não é 'todos'", async () => {
            setupSuccessfulMocks()
            const { result } = renderUsuariosList()

            await waitFor(() => expect(result.current.loading).toBe(false))

            act(() => result.current.setStatusFilter("ativo"))

            await waitFor(() => expect(result.current.loading).toBe(false))

            expect(mockUsuarioList).toHaveBeenCalledWith(
                expect.objectContaining({ status: "ativo" })
            )
        })

        it("re-executa ao mudar a página", async () => {
            setupSuccessfulMocks()
            const { result } = renderUsuariosList()

            await waitFor(() => expect(result.current.loading).toBe(false))

            const callsBefore = mockUsuarioList.mock.calls.length

            act(() => result.current.setPage(2))

            await waitFor(() => expect(result.current.loading).toBe(false))

            expect(mockUsuarioList.mock.calls.length).toBeGreaterThan(callsBefore)
            expect(mockUsuarioList).toHaveBeenCalledWith(
                expect.objectContaining({ page: 2 })
            )
        })

        it("re-executa ao mudar o ordering", async () => {
            setupSuccessfulMocks()
            const { result } = renderUsuariosList()

            await waitFor(() => expect(result.current.loading).toBe(false))

            act(() => result.current.setOrdering("nome"))

            await waitFor(() => expect(result.current.loading).toBe(false))

            expect(mockUsuarioList).toHaveBeenCalledWith(
                expect.objectContaining({ ordering: "nome" })
            )
        })
    })

    // ── fetchUnidades ─────────────────────────────────────────────────────────

    describe("fetchUnidades", () => {

        it("popula unidades após sucesso", async () => {
            setupSuccessfulMocks()
            const { result } = renderUsuariosList()

            await waitFor(() => {
                expect(result.current.unidades).toEqual(UNIDADES_RESPONSE.results)
            })
        })

        it("exibe toast de erro quando o serviço falha", async () => {
            mockUsuarioList.mockResolvedValue(USUARIOS_RESPONSE)
            mockUnidadeList.mockRejectedValue(new Error("Falha"))

            renderUsuariosList()

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith(
                    "Erro ao carregar unidades administrativas"
                )
            })
        })
    })

    // ── Debounce de busca ─────────────────────────────────────────────────────
    //
    // ✅ shouldAdvanceTime: true → o tempo real continua avançando,
    //    o que mantém o polling do waitFor funcionando. Ao mesmo tempo,
    //    vi.advanceTimersByTime() controla o setTimeout do debounce.

    describe("debounce do searchInput", () => {

        beforeEach(() => {
            vi.useFakeTimers({ shouldAdvanceTime: true })
        })

        afterEach(() => {
            vi.useRealTimers()
        })

        it("não dispara nova busca antes do debounce concluir", async () => {
            setupSuccessfulMocks()
            const { result } = renderUsuariosList()

            await waitFor(() => expect(result.current.loading).toBe(false))

            const callsBefore = mockUsuarioList.mock.calls.length

            act(() => result.current.setSearchInput("jo"))

            // Avança menos que o debounce (400ms) — timeout ainda não disparou
            act(() => vi.advanceTimersByTime(300))

            expect(mockUsuarioList.mock.calls.length).toBe(callsBefore)
        })

        it("dispara nova busca após o debounce (400ms)", async () => {
            setupSuccessfulMocks()
            const { result } = renderUsuariosList()

            await waitFor(() => expect(result.current.loading).toBe(false))

            act(() => result.current.setSearchInput("joao"))

            act(() => vi.advanceTimersByTime(400))

            await waitFor(() => {
                expect(mockUsuarioList).toHaveBeenCalledWith(
                    expect.objectContaining({ search: "joao" })
                )
            })
        })

        it("reseta a página para 1 após o debounce", async () => {
            setupSuccessfulMocks()
            const { result } = renderUsuariosList()

            await waitFor(() => expect(result.current.loading).toBe(false))

            act(() => result.current.setPage(2))
            await waitFor(() => expect(result.current.loading).toBe(false))

            act(() => result.current.setSearchInput("joao"))
            act(() => vi.advanceTimersByTime(400))

            await waitFor(() => expect(result.current.page).toBe(1))
        })

        it("cancela timeout anterior ao digitar rapidamente", async () => {
            setupSuccessfulMocks()
            const { result } = renderUsuariosList()

            await waitFor(() => expect(result.current.loading).toBe(false))

            const callsBefore = mockUsuarioList.mock.calls.length

            // Dois inputs com menos de 400ms de intervalo entre si
            act(() => result.current.setSearchInput("j"))
            act(() => vi.advanceTimersByTime(200))
            act(() => result.current.setSearchInput("jo"))
            act(() => vi.advanceTimersByTime(400))

            await waitFor(() => {
                expect(mockUsuarioList.mock.calls.length).toBeGreaterThan(callsBefore)
            })

            // Apenas UMA nova chamada — o primeiro timeout foi cancelado pelo cleanup
            expect(mockUsuarioList.mock.calls.length).toBe(callsBefore + 1)
        })
    })
})