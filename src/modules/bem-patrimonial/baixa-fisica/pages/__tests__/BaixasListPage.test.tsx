import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest"

import BaixasListPage from "../BaixasListPage"
import { baixaFisicaService } from "../../service/baixas.service"

import type { BaixaFisica } from "../../types/baixas-fisicas.types"

// ===================== MOCKS =====================

const navigateMock = vi.fn()
const createObjectURLMock = vi.fn(() => "blob:excel")
const revokeObjectURLMock = vi.fn()

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual<typeof import("react-router-dom")>(
        "react-router-dom"
    )

    return {
        ...actual,
        useNavigate: () => navigateMock,
    }
})

vi.mock("../../service/baixas.service", () => ({
    baixaFisicaService: {
        list: vi.fn(),
        exportarExcel: vi.fn(),
        enviarSolicitacao: vi.fn(),
    },
}))

vi.mock("@/components/ui/DateRangePicker", () => ({
    DateRangePicker: ({ id }: { id?: string }) => (
        <input
            id={id}
            data-testid="date-range-picker"
            readOnly
            placeholder="Selecione o período"
        />
    ),
}))

vi.mock("@/components/AppBreadcrumb", () => ({
    AppBreadcrumb: () => <nav data-testid="breadcrumb" />,
}))

// ===================== FACTORIES =====================

function makeBaixa(overrides: Partial<BaixaFisica> = {}): BaixaFisica {
    return {
        id: 1,
        status: "aguardando_envio",
        status_display: "Em elaboração",
        numero_processo_baixa: "PROC-001",
        numero_nbbpm: null,
        total_itens: 1,
        data_criacao: "2024-01-15T10:00:00Z",
        data_baixa: "2024-01-15",
        aprovado_por: null,
        data_aprovacao: null,
        unidade_administrativa_origem: {
            id: 1,
            sigla: "UA-01",
            codigo: "001",
            nome: "Unidade 01",
            status: "active",
        },
        criado_por: {
            id: 1,
            nome_completo: "João Silva",
            username: "joao.silva",
            email: "joao.silva@email.com",
        },
        ...overrides,
    }
}

function makePaginatedResponse(results: BaixaFisica[], count = results.length) {
    return {
        results,
        count,
        next: null,
        previous: null,
    }
}

function renderPage() {
    return render(
        <MemoryRouter>
            <BaixasListPage />
        </MemoryRouter>
    )
}

// ===================== TESTS =====================

describe("BaixasListPage", () => {
    beforeEach(() => {
        vi.clearAllMocks()

        Object.defineProperty(URL, "createObjectURL", {
            writable: true,
            configurable: true,
            value: createObjectURLMock,
        })

        Object.defineProperty(URL, "revokeObjectURL", {
            writable: true,
            configurable: true,
            value: revokeObjectURLMock,
        })

        vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {})

        vi.mocked(baixaFisicaService.list).mockResolvedValue(
            makePaginatedResponse([])
        )
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe("renderização inicial", () => {
        it("exibe loading inicialmente", () => {
            vi.mocked(baixaFisicaService.list).mockReturnValue(new Promise(() => {}))

            renderPage()

            expect(screen.getByText("Carregando...")).toBeInTheDocument()
        })

        it("exibe mensagem de lista vazia após carregar sem resultados", async () => {
            renderPage()

            await waitFor(() => {
                expect(
                    screen.getByText("Nenhum resultado encontrado.")
                ).toBeInTheDocument()
            })
        })

        it("exibe título e breadcrumb", async () => {
            renderPage()

            expect(
                screen.getByText("Baixa Física de Bens Patrimoniais")
            ).toBeInTheDocument()
            expect(screen.getByTestId("breadcrumb")).toBeInTheDocument()
        })

        it("chama list ao montar com ordenação padrão e página 1", async () => {
            renderPage()

            await waitFor(() => {
                expect(baixaFisicaService.list).toHaveBeenCalledWith(
                    expect.objectContaining({
                        ordering: "-data_criacao",
                        page: 1,
                    })
                )
            })
        })
    })

    describe("listagem", () => {
        it("exibe dados da baixa na tabela", async () => {
            vi.mocked(baixaFisicaService.list).mockResolvedValue(
                makePaginatedResponse([makeBaixa()])
            )

            renderPage()

            await waitFor(() => {
                expect(screen.getByText("UA-01")).toBeInTheDocument()
                expect(screen.getByText("João Silva")).toBeInTheDocument()
                expect(
                    screen.getByText("Em elaboração", { selector: "span" })
                ).toBeInTheDocument()
            })
        })

        it("renderiza status solicitada", async () => {
            vi.mocked(baixaFisicaService.list).mockResolvedValue(
                makePaginatedResponse([
                    makeBaixa({ status: "solicitada", status_display: "Solicitada" }),
                ])
            )

            renderPage()

            await waitFor(() => {
                expect(screen.getByText("Solicitada")).toBeInTheDocument()
            })
        })

        it("desabilita checkbox para status não selecionável", async () => {
            vi.mocked(baixaFisicaService.list).mockResolvedValue(
                makePaginatedResponse([
                    makeBaixa({ status: "aceita", status_display: "Aceita" }),
                ])
            )

            renderPage()

            await waitFor(() => {
                expect(screen.getByText("Aceita")).toBeInTheDocument()
            })

            const checkboxes = screen.getAllByRole("checkbox")
            expect(checkboxes[1]).toBeDisabled()
        })
    })

    describe("seleção", () => {
        it("seleciona baixa em elaboração e exibe botão Solicitar", async () => {
            vi.mocked(baixaFisicaService.list).mockResolvedValue(
                makePaginatedResponse([
                    makeBaixa({ id: 5, status: "aguardando_envio" }),
                ])
            )

            renderPage()

            await waitFor(() => {
                expect(screen.getByText("UA-01")).toBeInTheDocument()
            })

            fireEvent.click(screen.getAllByRole("checkbox")[1])

            expect(screen.getByText("Solicitar (1)")).toBeInTheDocument()
        })

        it("select-all seleciona baixas em elaboração e solicitadas", async () => {
            vi.mocked(baixaFisicaService.list).mockResolvedValue(
                makePaginatedResponse([
                    makeBaixa({ id: 1, status: "aguardando_envio" }),
                    makeBaixa({ id: 2, status: "solicitada", status_display: "Solicitada" }),
                    makeBaixa({ id: 3, status: "aceita", status_display: "Aceita" }),
                ])
            )

            renderPage()

            await waitFor(() => {
                expect(screen.getAllByText("UA-01")).toHaveLength(3)
            })

            fireEvent.click(screen.getAllByRole("checkbox")[0])

            expect(screen.getByText("Solicitar (1)")).toBeInTheDocument()
            expect(screen.getByText("Aprovar")).toBeInTheDocument()
            expect(screen.getByText("Recusar")).toBeInTheDocument()
        })

        it("select-all desmarca todos quando todos já estão selecionados", async () => {
            vi.mocked(baixaFisicaService.list).mockResolvedValue(
                makePaginatedResponse([
                    makeBaixa({ id: 1, status: "aguardando_envio" }),
                ])
            )

            renderPage()

            await waitFor(() => {
                expect(screen.getByText("UA-01")).toBeInTheDocument()
            })

            const selectAll = screen.getAllByRole("checkbox")[0]
            fireEvent.click(selectAll)
            fireEvent.click(selectAll)

            expect(screen.queryByText(/Solicitar/)).not.toBeInTheDocument()
        })
    })

    describe("ações", () => {
        it("chama enviarSolicitacao ao clicar em Solicitar", async () => {
            vi.mocked(baixaFisicaService.list).mockResolvedValue(
                makePaginatedResponse([
                    makeBaixa({ id: 5, status: "aguardando_envio" }),
                ])
            )
            vi.mocked(baixaFisicaService.enviarSolicitacao).mockResolvedValue(
                makeBaixa({ id: 5, status: "solicitada" }) as never
            )

            renderPage()

            await waitFor(() => {
                expect(screen.getByText("UA-01")).toBeInTheDocument()
            })

            fireEvent.click(screen.getAllByRole("checkbox")[1])
            fireEvent.click(screen.getByText("Solicitar (1)"))

            await waitFor(() => {
                expect(baixaFisicaService.enviarSolicitacao).toHaveBeenCalledWith(5)
            })
        })

        it("Aprovar navega para a tela de validação da baixa solicitada", async () => {
            vi.mocked(baixaFisicaService.list).mockResolvedValue(
                makePaginatedResponse([
                    makeBaixa({ id: 7, status: "solicitada", status_display: "Solicitada" }),
                ])
            )

            renderPage()

            await waitFor(() => {
                expect(screen.getByText("Solicitada")).toBeInTheDocument()
            })

            fireEvent.click(screen.getAllByRole("checkbox")[1])
            fireEvent.click(screen.getByText("Aprovar"))

            expect(navigateMock).toHaveBeenCalledWith("/baixas-fisicas/7")
        })

        it("Recusar também navega para a tela de validação da baixa solicitada", async () => {
            vi.mocked(baixaFisicaService.list).mockResolvedValue(
                makePaginatedResponse([
                    makeBaixa({ id: 8, status: "solicitada", status_display: "Solicitada" }),
                ])
            )

            renderPage()

            await waitFor(() => {
                expect(screen.getByText("Solicitada")).toBeInTheDocument()
            })

            fireEvent.click(screen.getAllByRole("checkbox")[1])
            fireEvent.click(screen.getByText("Recusar"))

            expect(navigateMock).toHaveBeenCalledWith("/baixas-fisicas/8")
        })

        it("exporta Excel com os filtros aplicados", async () => {
            vi.mocked(baixaFisicaService.exportarExcel).mockResolvedValue(new Blob())

            renderPage()

            await waitFor(() => {
                expect(screen.getByText("Nenhum resultado encontrado.")).toBeInTheDocument()
            })

            fireEvent.click(screen.getByText("Exportar Excel"))

            await waitFor(() => {
                expect(baixaFisicaService.exportarExcel).toHaveBeenCalledWith({
                    unidade_administrativa_origem: undefined,
                    status: undefined,
                })
                expect(createObjectURLMock).toHaveBeenCalledWith(expect.any(Blob))
                expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled()
                expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:excel")
            })
        })

        it("navega para cadastro ao clicar em Adicionar Baixa", async () => {
            renderPage()

            await waitFor(() => {
                expect(screen.getByText("Nenhum resultado encontrado.")).toBeInTheDocument()
            })

            fireEvent.click(screen.getByText("Adicionar Baixa"))

            expect(navigateMock).toHaveBeenCalledWith("/baixas-fisicas/novo")
        })
    })

    describe("filtros e ordenação", () => {
        it("aplica filtros por busca e status", async () => {
            renderPage()

            await waitFor(() => {
                expect(screen.getByText("Nenhum resultado encontrado.")).toBeInTheDocument()
            })

            fireEvent.change(screen.getByLabelText("Buscar por Número/Nome do Bem ou NBBPM"), {
                target: { value: "PAT-001" },
            })
            fireEvent.change(screen.getByLabelText("Filtrar por status"), {
                target: { value: "solicitada" },
            })
            fireEvent.click(screen.getByText("Filtrar"))

            await waitFor(() => {
                expect(baixaFisicaService.list).toHaveBeenLastCalledWith(
                    expect.objectContaining({
                        page: 1,
                        search: "PAT-001",
                        status: "solicitada",
                    })
                )
            })
        })

        it("alterna ordenação ao clicar no cabeçalho", async () => {
            renderPage()

            await waitFor(() => {
                expect(screen.getByText("Nenhum resultado encontrado.")).toBeInTheDocument()
            })

            fireEvent.click(screen.getByText(/Unidade Administrativa/))

            await waitFor(() => {
                expect(baixaFisicaService.list).toHaveBeenLastCalledWith(
                    expect.objectContaining({
                        ordering: "unidade_administrativa_origem__sigla",
                    })
                )
            })
        })
    })
})
