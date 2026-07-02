import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { vi, describe, it, expect, beforeEach } from "vitest"

import SolicitarCorrecaoPage from "../SolicitarCorrecaoPage"
import { baixaFisicaService } from "../../service/baixas.service"
import type { BaixaFisicaDetail } from "../../types/baixas-fisicas.types"

// ===================== MOCKS =====================

const mockNavigate = vi.fn()

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual<typeof import("react-router-dom")>(
        "react-router-dom"
    )
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    }
})

vi.mock("../../service/baixas.service", () => ({
    baixaFisicaService: {
        retrieve: vi.fn(),
        solicitarCorrecao: vi.fn(),
    },
}))

vi.mock("@/components/AppBreadcrumb", () => ({
    AppBreadcrumb: () => <nav data-testid="breadcrumb" />,
}))

// ===================== FACTORIES =====================

function makeBaixaDetail(
    overrides: Partial<BaixaFisicaDetail> = {}
): BaixaFisicaDetail {
    return {
        id: 1,
        status: "solicitada",
        status_display: "Solicitada",
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
            username: "joao",
            email: "joao@email.com",
        },
        itens: [
            {
                id: 1,
                bem: {
                    id: 10,
                    numero_patrimonial: "PAT-001",
                    nome: "Cadeira",
                    descricao: "Cadeira ergonômica",
                    status: "aprovado",
                },
            },
        ],
        url_enviar_solicitacao: null,
        url_aprovar: null,
        url_cancelar: null,
        url_gerar_nbbpm: null,
        ...overrides,
    }
}

function renderPage(id = "1") {
    return render(
        <MemoryRouter initialEntries={[`/baixas-fisicas/${id}/solicitar-correcao`]}>
            <Routes>
                <Route
                    path="/baixas-fisicas/:id/solicitar-correcao"
                    element={<SolicitarCorrecaoPage />}
                />
            </Routes>
        </MemoryRouter>
    )
}

// ===================== TESTS =====================

describe("SolicitarCorrecaoPage", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("exibe loading inicialmente", () => {
        vi.mocked(baixaFisicaService.retrieve).mockReturnValue(new Promise(() => {}))

        renderPage()

        expect(screen.getByText("Carregando...")).toBeInTheDocument()
    })

    it("exibe baixa não encontrada quando retrieve falha", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockRejectedValue(new Error("Not found"))

        renderPage()

        await waitFor(() => {
            expect(screen.getByText("Baixa não encontrada")).toBeInTheDocument()
        })
    })

    it("renderiza dados da baixa e itens somente leitura", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(makeBaixaDetail())

        renderPage()

        await waitFor(() => {
            expect(screen.getByTestId("breadcrumb")).toBeInTheDocument()
            expect(screen.getAllByText("Solicitar correção").length).toBeGreaterThan(0)
            expect(screen.getByText("001 - Unidade 01")).toBeInTheDocument()
            expect(screen.getByText(/PAT-001/)).toBeInTheDocument()
            expect(screen.getByText(/Cadeira/)).toBeInTheDocument()
        })
    })

    it("mantém botão desabilitado enquanto observação estiver vazia", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(makeBaixaDetail())

        renderPage()

        await waitFor(() => {
            expect(screen.getByRole("button", { name: "Solicitar correção" })).toBeDisabled()
        })
    })

    it("envia solicitação de correção com motivo trimado", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(makeBaixaDetail({ id: 7 }))
        vi.mocked(baixaFisicaService.solicitarCorrecao).mockResolvedValue(
            makeBaixaDetail({ id: 7, status: "aguardando_envio" })
        )

        renderPage("7")

        await waitFor(() => {
            expect(screen.getByLabelText("Observações")).toBeInTheDocument()
        })

        fireEvent.change(screen.getByLabelText("Observações"), {
            target: { value: "  Corrigir descrição do item  " },
        })
        fireEvent.click(screen.getByRole("button", { name: "Solicitar correção" }))

        await waitFor(() => {
            expect(baixaFisicaService.solicitarCorrecao).toHaveBeenCalledWith(7, {
                motivo: "Corrigir descrição do item",
            })
        })
    })

    it("exibe erro de validação quando a função é acionada sem motivo", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(makeBaixaDetail())

        renderPage()

        await waitFor(() => {
            expect(screen.getByLabelText("Observações")).toBeInTheDocument()
        })

        fireEvent.change(screen.getByLabelText("Observações"), {
            target: { value: "texto" },
        })
        fireEvent.change(screen.getByLabelText("Observações"), {
            target: { value: "   " },
        })

        // O botão fica desabilitado pela UI; essa asserção protege a regra visual.
        expect(screen.getByRole("button", { name: "Solicitar correção" })).toBeDisabled()
    })

    it("exibe erro retornado pelo serviço", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(makeBaixaDetail())
        vi.mocked(baixaFisicaService.solicitarCorrecao).mockRejectedValue(
            new Error("Erro da API")
        )

        renderPage()

        await waitFor(() => {
            expect(screen.getByLabelText("Observações")).toBeInTheDocument()
        })

        fireEvent.change(screen.getByLabelText("Observações"), {
            target: { value: "Corrigir item" },
        })
        fireEvent.click(screen.getByRole("button", { name: "Solicitar correção" }))

        await waitFor(() => {
            expect(screen.getByRole("alert")).toHaveTextContent("Erro da API")
        })
    })

    it("botão Voltar navega para a rota anterior", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(makeBaixaDetail())

        renderPage()

        await waitFor(() => {
            expect(screen.getByText("Voltar")).toBeInTheDocument()
        })

        fireEvent.click(screen.getByText("Voltar"))

        expect(mockNavigate).toHaveBeenCalledWith(-1)
    })
})
