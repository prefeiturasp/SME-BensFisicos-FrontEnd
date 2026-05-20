import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { vi, describe, it, expect, beforeEach } from "vitest"

import VerBaixaPage from "../VerBaixaPage"

import { baixaFisicaService } from "../../service/baixas.service"
import { bemService } from "../../../bem/services/bem.service"

import type { BaixaFisicaDetail } from "../../types/baixas-fisicas.types"
import type { Bem } from "../../../bem/services/bem.service"

// ===================== MOCKS =====================

const mockNavigate = vi.fn()

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom")
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    }
})

vi.mock("../../service/baixas.service", () => ({
    baixaFisicaService: {
        retrieve: vi.fn(),
        update: vi.fn(),
        gerarNbbpm: vi.fn(),
        historico: vi.fn(),
    },
}))

vi.mock("../../../bem/services/bem.service", () => ({
    bemService: {
        list: vi.fn(),
    },
}))

vi.mock("../modals/HistoricoModal", () => ({
    default: ({ onClose }: { onClose: () => void }) => (
        <div data-testid="historico-modal">
            <button onClick={onClose}>Fechar Histórico</button>
        </div>
    ),
}))

vi.mock("@/components/AppBreadcrumb", () => ({
    AppBreadcrumb: () => <nav data-testid="breadcrumb" />,
}))

// ===================== FACTORIES =====================

function makeBem(overrides: Partial<Bem> = {}): Bem {
    return {
        id: 1,
        status: "aprovado",
        status_display: "Aprovado",
        nome: "Cadeira Escritório",
        descricao: "Cadeira ergonômica",
        numero_patrimonial: "PAT-001",
        localizacao: "Sala 01",
        unidade_administrativa_codigo: "001",
        unidade_administrativa_nome: "Unidade 01",
        unidade_orcamentaria_nome: "UO-01",
        ...overrides,
    }
}

function makeBaixaDetail(overrides: Partial<BaixaFisicaDetail> = {}): BaixaFisicaDetail {
    return {
        id: 1,
        status: "aguardando_envio",
        status_display: "Aguardando Envio",
        numero_processo_baixa: "PROC-001",
        numero_nbbpm: null,
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
            email: "joao@email.com",
        },
        itens: [],
        url_enviar_solicitacao: null,
        url_aprovar: null,
        url_cancelar: null,
        url_gerar_nbbpm: null,
        ...overrides,
    }
}

function makeBaixaItem(id: number, bemOverrides: Partial<Bem> = {}) {
    const bem = makeBem(bemOverrides)

    return {
        id,
        bem: {
            id: bem.id,
            numero_patrimonial: bem.numero_patrimonial as string,
            nome: bem.nome,
            descricao: bem.descricao,
            status: bem.status,
        },
    }
}

// ===================== HELPERS =====================

function renderPage(id = "1") {
    return render(
        <MemoryRouter initialEntries={[`/baixas-fisicas/${id}`]}>
            <Routes>
                <Route
                    path="/baixas-fisicas/:id"
                    element={<VerBaixaPage />}
                />
            </Routes>
        </MemoryRouter>
    )
}

// ===================== TESTS =====================

describe("VerBaixaPage", () => {

    beforeEach(() => {
        vi.clearAllMocks()

        vi.mocked(bemService.list).mockResolvedValue({
            results: [makeBem()],
            count: 1,
            next: null,
            previous: null,
        })
    })

    // =====================
    // Loading / Error
    // =====================

    it("exibe loading inicialmente", () => {
        vi.mocked(baixaFisicaService.retrieve).mockReturnValue(
            new Promise(() => { })
        )

        renderPage()

        expect(screen.getByText("Carregando...")).toBeInTheDocument()
    })

    it("exibe baixa não encontrada quando retrieve falha", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockRejectedValue(
            new Error("Not found")
        )

        renderPage()

        await waitFor(() => {
            expect(
                screen.getByText("Baixa não encontrada")
            ).toBeInTheDocument()
        })
    })

    // =====================
    // Renderização
    // =====================

    it("renderiza título da página", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail()
        )

        renderPage()

        await waitFor(() => {
            expect(
                screen.getByText("Visualizar Baixa Física de Bem Patrimonial")
            ).toBeInTheDocument()
        })
    })

    it("renderiza breadcrumb", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail()
        )

        renderPage()

        await waitFor(() => {
            expect(screen.getByTestId("breadcrumb")).toBeInTheDocument()
        })
    })

    it("renderiza identificação da baixa", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail()
        )

        renderPage()

        await waitFor(() => {
            expect(
                screen.getByText(/Baixa Física #001/)
            ).toBeInTheDocument()

            expect(
                screen.getByText(/UA-01/)
            ).toBeInTheDocument()
        })
    })

    it("renderiza status badge", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail()
        )

        renderPage()

        await waitFor(() => {
            expect(
                screen.getByText(/Aguardando Envio/)
            ).toBeInTheDocument()
        })
    })

    it("renderiza dados do solicitante", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail()
        )

        renderPage()

        await waitFor(() => {
            expect(
                screen.getByText("João Silva")
            ).toBeInTheDocument()
        })
    })

    it("renderiza '-' quando gestor aprovador é nulo", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({
                aprovado_por: null,
            })
        )

        renderPage()

        await waitFor(() => {
            expect(screen.getAllByText("-").length).toBeGreaterThan(0)
        })
    })

    it("renderiza nome do aprovador quando preenchido", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({
                aprovado_por: {
                    id: 2,
                    nome_completo: "Maria Gestora",
                    username: "maria",
                    email: "maria@email.com",
                },
                data_aprovacao: "2024-01-16T14:00:00Z",
            })
        )

        renderPage()

        await waitFor(() => {
            expect(
                screen.getByText("Maria Gestora")
            ).toBeInTheDocument()
        })
    })

    it("renderiza itens existentes", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({
                itens: [
                    makeBaixaItem(1, {
                        numero_patrimonial: "PAT-001",
                        nome: "Cadeira",
                    }),
                ],
            })
        )

        renderPage()

        await waitFor(() => {
            expect(screen.getByText(/PAT-001/)).toBeInTheDocument()
            expect(screen.getByText(/Cadeira/)).toBeInTheDocument()
        })
    })

    it("renderiza '-' para data_baixa inválida", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({
                data_baixa: "data-invalida",
            })
        )

        renderPage()

        await waitFor(() => {
            expect(screen.getAllByText("-").length).toBeGreaterThan(0)
        })
    })

    it("renderiza '-' para data_aprovacao inválida", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({
                data_aprovacao: "data-invalida",
            })
        )

        renderPage()

        await waitFor(() => {
            expect(screen.getAllByText("-").length).toBeGreaterThan(0)
        })
    })

    // =====================
    // Status / edição
    // =====================

    it("botão Salvar Edição desabilitado para status aceita", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({
                status: "aceita",
                status_display: "Aceita",
            })
        )

        renderPage()

        await waitFor(() => {
            expect(screen.getByText("Salvar Edição")).toBeDisabled()
        })
    })

    it("botão Salvar Edição desabilitado para status recusada", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({
                status: "recusada",
                status_display: "Recusada",
            })
        )

        renderPage()

        await waitFor(() => {
            expect(screen.getByText("Salvar Edição")).toBeDisabled()
        })
    })

    it("botão Salvar Edição desabilitado para status cancelada", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({
                status: "cancelada",
                status_display: "Cancelada",
            })
        )

        renderPage()

        await waitFor(() => {
            expect(screen.getByText("Salvar Edição")).toBeDisabled()
        })
    })

    it("botão Salvar Edição desabilitado para status solicitada", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({
                status: "solicitada",
                status_display: "Solicitada",
            })
        )

        renderPage()

        await waitFor(() => {
            expect(screen.getByText("Salvar Edição")).toBeDisabled()
        })
    })

    // =====================
    // Dropdown
    // =====================

    it("exibe input de busca para linha vazia", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({
                itens: [],
            })
        )

        renderPage()

        await waitFor(() => {
            expect(
                screen.getByPlaceholderText("Selecione um bem")
            ).toBeInTheDocument()
        })
    })

    it("renderiza loading no dropdown", async () => {
        vi.mocked(bemService.list).mockReturnValue(
            new Promise(() => { })
        )

        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({
                itens: [],
            })
        )

        renderPage()

        await waitFor(() =>
            screen.getByPlaceholderText("Selecione um bem")
        )

        fireEvent.focus(
            screen.getByPlaceholderText("Selecione um bem")
        )

        expect(screen.getByText("Buscando...")).toBeInTheDocument()
    })

    it("renderiza mensagem quando nenhum bem é encontrado", async () => {
        vi.mocked(bemService.list).mockResolvedValue({
            results: [],
            count: 0,
            next: null,
            previous: null,
        })

        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({
                itens: [],
            })
        )

        renderPage()

        await waitFor(() =>
            screen.getByPlaceholderText("Selecione um bem")
        )

        fireEvent.focus(
            screen.getByPlaceholderText("Selecione um bem")
        )

        await waitFor(() => {
            expect(
                screen.getByText("Nenhum bem encontrado.")
            ).toBeInTheDocument()
        })
    })

    it("seleciona bem no dropdown", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({
                itens: [],
            })
        )

        renderPage()

        await waitFor(() =>
            screen.getByPlaceholderText("Selecione um bem")
        )

        fireEvent.focus(
            screen.getByPlaceholderText("Selecione um bem")
        )

        await waitFor(() =>
            screen.getByText("Cadeira Escritório")
        )

        fireEvent.click(
            screen.getByText("Cadeira Escritório")
        )

        await waitFor(() => {
            expect(
                screen.getByText(/Cadeira Escritório/)
            ).toBeInTheDocument()
        })
    })

    it("desabilita item já selecionado no dropdown", async () => {
        vi.mocked(bemService.list).mockResolvedValue({
            results: [
                makeBem({
                    id: 1,
                    nome: "Cadeira Escritório",
                    numero_patrimonial: "PAT-001",
                }),
            ],
            count: 1,
            next: null,
            previous: null,
        })

        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({
                itens: [],
            })
        )

        renderPage()

        await waitFor(() => {
            expect(
                screen.getByPlaceholderText("Selecione um bem")
            ).toBeInTheDocument()
        })

        const addButton = screen.getByTitle("Adicionar item")

        fireEvent.click(addButton)

        await waitFor(() => {
            expect(
                screen.getAllByPlaceholderText("Selecione um bem")
            ).toHaveLength(2)
        })

        const firstInput =
            screen.getAllByPlaceholderText("Selecione um bem")[0]

        fireEvent.focus(firstInput)

        await waitFor(() => {
            expect(
                screen.getByText("Cadeira Escritório")
            ).toBeInTheDocument()
        })

        fireEvent.click(screen.getByText("Cadeira Escritório"))

        await waitFor(() => {
            expect(
                screen.getAllByPlaceholderText("Selecione um bem")
            ).toHaveLength(1)
        })

        const remainingInput =
            screen.getByPlaceholderText("Selecione um bem")

        fireEvent.focus(remainingInput)

        await waitFor(() => {
            const disabledButton = screen.getByRole("button", {
                name: /PAT-001/i,
            })

            expect(disabledButton).toBeDisabled()
        })
    })

    // =====================
    // Manipulação de linhas
    // =====================

    it("adiciona nova linha", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({
                itens: [],
            })
        )

        renderPage()

        await waitFor(() =>
            screen.getByTitle("Adicionar item")
        )

        fireEvent.click(
            screen.getByTitle("Adicionar item")
        )

        await waitFor(() => {
            expect(
                screen.getAllByPlaceholderText("Selecione um bem")
            ).toHaveLength(2)
        })
    })

    it("remove linha", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({
                itens: [],
            })
        )

        renderPage()

        await waitFor(() =>
            screen.getByTitle("Adicionar item")
        )

        fireEvent.click(
            screen.getByTitle("Adicionar item")
        )

        const excluirBtns = screen.getAllByTitle("Excluir linha")

        fireEvent.click(excluirBtns[0])

        await waitFor(() => {
            expect(
                screen.getAllByPlaceholderText("Selecione um bem")
            ).toHaveLength(1)
        })
    })

    it("limpa item selecionado", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({
                itens: [makeBaixaItem(1)],
            })
        )

        renderPage()

        await waitFor(() =>
            screen.getByText(/PAT-001/)
        )

        fireEvent.click(
            screen.getByTitle("Remover")
        )

        await waitFor(() => {
            expect(
                screen.getByPlaceholderText("Selecione um bem")
            ).toBeInTheDocument()
        })
    })

    // =====================
    // Save
    // =====================

    it("habilita botão salvar após alteração", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({
                itens: [],
            })
        )

        renderPage()

        await waitFor(() =>
            screen.getByPlaceholderText("Selecione um bem")
        )

        fireEvent.focus(
            screen.getByPlaceholderText("Selecione um bem")
        )

        await waitFor(() =>
            screen.getByText("Cadeira Escritório")
        )

        fireEvent.click(
            screen.getByText("Cadeira Escritório")
        )

        await waitFor(() => {
            expect(
                screen.getByText("Salvar Edição")
            ).not.toBeDisabled()
        })
    })

    it("exibe salvando durante update", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({
                itens: [],
            })
        )

        vi.mocked(baixaFisicaService.update).mockReturnValue(
            new Promise(() => { })
        )

        renderPage()

        await waitFor(() =>
            screen.getByPlaceholderText("Selecione um bem")
        )

        fireEvent.focus(
            screen.getByPlaceholderText("Selecione um bem")
        )

        await waitFor(() =>
            screen.getByText("Cadeira Escritório")
        )

        fireEvent.click(
            screen.getByText("Cadeira Escritório")
        )

        fireEvent.click(
            screen.getByText("Salvar Edição")
        )

        expect(
            screen.getByText("Salvando...")
        ).toBeInTheDocument()
    })

    it("chama update ao salvar edição", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({
                itens: [],
            })
        )

        vi.mocked(baixaFisicaService.update).mockResolvedValue(
            makeBaixaDetail({
                itens: [makeBaixaItem(1)],
            })
        )

        renderPage()

        await waitFor(() =>
            screen.getByPlaceholderText("Selecione um bem")
        )

        fireEvent.focus(
            screen.getByPlaceholderText("Selecione um bem")
        )

        await waitFor(() =>
            screen.getByText("Cadeira Escritório")
        )

        fireEvent.click(
            screen.getByText("Cadeira Escritório")
        )

        fireEvent.click(
            screen.getByText("Salvar Edição")
        )

        await waitFor(() => {
            expect(
                baixaFisicaService.update
            ).toHaveBeenCalledWith(
                1,
                expect.objectContaining({
                    itens: [{ bem: 1 }],
                })
            )
        })
    })

    it("trata erro no update", async () => {
        const errorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => { })

        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({
                itens: [],
            })
        )

        vi.mocked(baixaFisicaService.update).mockRejectedValue(
            new Error("Erro")
        )

        renderPage()

        await waitFor(() =>
            screen.getByPlaceholderText("Selecione um bem")
        )

        fireEvent.focus(
            screen.getByPlaceholderText("Selecione um bem")
        )

        await waitFor(() =>
            screen.getByText("Cadeira Escritório")
        )

        fireEvent.click(
            screen.getByText("Cadeira Escritório")
        )

        fireEvent.click(
            screen.getByText("Salvar Edição")
        )

        await waitFor(() => {
            expect(errorSpy).toHaveBeenCalled()
        })

        errorSpy.mockRestore()
    })

    // =====================
    // Download NBBPM
    // =====================

    it("executa download do NBBPM", async () => {
        const clickMock = vi.fn()

        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({
                url_gerar_nbbpm: "/download",
            })
        )

        vi.mocked(baixaFisicaService.gerarNbbpm).mockResolvedValue(
            new Blob(["pdf"])
        )

        const createObjectURLMock = vi
            .spyOn(URL, "createObjectURL")
            .mockReturnValue("blob:url")

        const revokeObjectURLMock = vi
            .spyOn(URL, "revokeObjectURL")
            .mockImplementation(() => { })

        const createElementSpy = vi.spyOn(document, "createElement")

        createElementSpy.mockImplementation((tagName: string) => {
            const element = document
                .createElementNS("http://www.w3.org/1999/xhtml", tagName)

            if (tagName === "a") {
                Object.defineProperty(element, "click", {
                    value: clickMock,
                })
            }

            return element
        })

        renderPage()

        await waitFor(() => {
            expect(
                screen.getByText("Baixar NBBPM")
            ).toBeInTheDocument()
        })

        fireEvent.click(screen.getByText("Baixar NBBPM"))

        await waitFor(() => {
            expect(
                baixaFisicaService.gerarNbbpm
            ).toHaveBeenCalledWith(1)

            expect(clickMock).toHaveBeenCalled()
            expect(createObjectURLMock).toHaveBeenCalled()
            expect(revokeObjectURLMock).toHaveBeenCalled()
        })

        createElementSpy.mockRestore()
    })

    it("trata erro ao gerar NBBPM", async () => {
        const consoleSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => { })

        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({
                url_gerar_nbbpm: "/download",
            })
        )

        vi.mocked(baixaFisicaService.gerarNbbpm).mockRejectedValue(
            new Error("Erro download")
        )

        renderPage()

        await waitFor(() => {
            expect(
                screen.getByText("Baixar NBBPM")
            ).toBeInTheDocument()
        })

        fireEvent.click(screen.getByText("Baixar NBBPM"))

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalled()
        })

        consoleSpy.mockRestore()
    })

    // =====================
    // Navegação
    // =====================

    it("navega para trás ao clicar em voltar", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail()
        )

        renderPage()

        await waitFor(() =>
            screen.getByText("Voltar")
        )

        fireEvent.click(
            screen.getByText("Voltar")
        )

        expect(mockNavigate).toHaveBeenCalledWith(-1)
    })
})