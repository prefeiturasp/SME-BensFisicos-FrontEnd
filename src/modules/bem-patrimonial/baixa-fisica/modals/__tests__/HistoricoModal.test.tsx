import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { vi, describe, it, expect, beforeEach } from "vitest"
import HistoricoModal from "../HistoricoModal"
import { baixaFisicaService } from "../../service/baixas.service"
import type { HistoricoEntry } from "../../types/baixas-fisicas.types"

// ===================== MOCKS =====================

vi.mock("../../service/baixas.service", () => ({
    baixaFisicaService: {
        historico: vi.fn(),
    },
}))

// ===================== FACTORIES =====================

function makeEntry(overrides: Partial<HistoricoEntry> = {}): HistoricoEntry {
    return {
        id: 1,
        campo: "status",
        valor_antigo: "rascunho",
        valor_novo: "Solicitada",
        alterado_por: "joao.silva",
        data_alteracao: "2024-01-15T10:00:00Z",
        justificativa: null,
        ...overrides,
    }
}

// ===================== HELPERS =====================

function renderModal(props: Partial<{ baixaId: number; onClose: () => void }> = {}) {
    const onClose = vi.fn()
    const result = render(
        <HistoricoModal baixaId={1} onClose={onClose} {...props} />
    )
    return { ...result, onClose }
}

// ===================== TESTS =====================

describe("HistoricoModal", () => {

    beforeEach(() => {
        vi.clearAllMocks()
    })

    // --- Loading ---

    it("exibe 'Carregando...' inicialmente", () => {
        vi.mocked(baixaFisicaService.historico).mockReturnValue(new Promise(() => {}))
        renderModal()
        expect(screen.getByText("Carregando...")).toBeInTheDocument()
    })

    // --- Empty state ---

    it("exibe 'Nenhum histórico encontrado.' quando lista vazia", async () => {
        vi.mocked(baixaFisicaService.historico).mockResolvedValue([])
        renderModal()
        await waitFor(() => {
            expect(screen.getByText("Nenhum histórico encontrado.")).toBeInTheDocument()
        })
    })

    // --- Renderização com dados ---

    it("renderiza título 'Histórico'", async () => {
        vi.mocked(baixaFisicaService.historico).mockResolvedValue([makeEntry()])
        renderModal()
        await waitFor(() => {
            expect(screen.getByText("Histórico")).toBeInTheDocument()
        })
    })

    it("chama historico com o baixaId correto", async () => {
        vi.mocked(baixaFisicaService.historico).mockResolvedValue([])
        renderModal({ baixaId: 42 })
        await waitFor(() => {
            expect(baixaFisicaService.historico).toHaveBeenCalledWith(42)
        })
    })

    it("seleciona o primeiro grupo automaticamente e exibe detalhe", async () => {
        vi.mocked(baixaFisicaService.historico).mockResolvedValue([makeEntry()])
        renderModal()
        await waitFor(() => {
            expect(screen.getByText("Ações:")).toBeInTheDocument()
        })
    })

    it("exibe texto de ação com campo quando justificativa é nula", async () => {
        vi.mocked(baixaFisicaService.historico).mockResolvedValue([
            makeEntry({ campo: "status", valor_antigo: "rascunho", valor_novo: "Solicitada", justificativa: null }),
        ])
        renderModal()
        await waitFor(() => {
            expect(screen.getByText(/Campo "status": rascunho → Solicitada/)).toBeInTheDocument()
        })
    })

    it("exibe justificativa quando preenchida", async () => {
        vi.mocked(baixaFisicaService.historico).mockResolvedValue([
            makeEntry({ justificativa: "Cadastro inicial realizado" }),
        ])
        renderModal()
        await waitFor(() => {
            expect(screen.getByText("Cadastro inicial realizado")).toBeInTheDocument()
        })
    })

    it("exibe 'vazio' quando valor_antigo ou valor_novo é null", async () => {
        vi.mocked(baixaFisicaService.historico).mockResolvedValue([
            makeEntry({ valor_antigo: null, valor_novo: null, justificativa: null }),
        ])
        renderModal()
        await waitFor(() => {
            expect(screen.getByText(/vazio → vazio/)).toBeInTheDocument()
        })
    })

    // --- getGroupLabel ---

    it("exibe label 'Cadastro aceito' para status Aceita", async () => {
        vi.mocked(baixaFisicaService.historico).mockResolvedValue([
            makeEntry({ valor_novo: "Aceita" }),
        ])
        renderModal()
        await waitFor(() => {
            expect(screen.getByText("Cadastro aceito")).toBeInTheDocument()
        })
    })

    it("exibe label 'Cadastro recusado' para status Recusada", async () => {
        vi.mocked(baixaFisicaService.historico).mockResolvedValue([
            makeEntry({ valor_novo: "Recusada" }),
        ])
        renderModal()
        await waitFor(() => {
            expect(screen.getByText("Cadastro recusado")).toBeInTheDocument()
        })
    })

    it("exibe label 'Cadastro cancelado' para status Cancelada", async () => {
        vi.mocked(baixaFisicaService.historico).mockResolvedValue([
            makeEntry({ valor_novo: "Cancelada" }),
        ])
        renderModal()
        await waitFor(() => {
            expect(screen.getByText("Cadastro cancelado")).toBeInTheDocument()
        })
    })

    it("exibe label 'Cadastro realizado' quando justificativa contém 'cadastro'", async () => {
        vi.mocked(baixaFisicaService.historico).mockResolvedValue([
            makeEntry({ campo: "outro", justificativa: "Cadastro inicial" }),
        ])
        renderModal()
        await waitFor(() => {
            expect(screen.getByText("Cadastro realizado")).toBeInTheDocument()
        })
    })

    it("exibe label 'Cadastro alterado' para entradas genéricas", async () => {
        vi.mocked(baixaFisicaService.historico).mockResolvedValue([
            makeEntry({ campo: "numero_processo_baixa", valor_novo: "P-002", justificativa: null }),
        ])
        renderModal()
        await waitFor(() => {
            expect(screen.getByText("Cadastro alterado")).toBeInTheDocument()
        })
    })

    // --- Agrupamento por usuário e timestamp ---

    it("agrupa entradas do mesmo usuário e timestamp em um único grupo", async () => {
        const entries = [
            makeEntry({ id: 1, campo: "status", data_alteracao: "2024-01-15T10:00:00Z" }),
            makeEntry({ id: 2, campo: "numero_processo_baixa", data_alteracao: "2024-01-15T10:00:00Z", justificativa: null }),
        ]
        vi.mocked(baixaFisicaService.historico).mockResolvedValue(entries)
        renderModal()
        await waitFor(() => {
            // Apenas 1 botão de grupo na coluna esquerda
            const groupBtns = screen.getAllByRole("button", { name: /Solicitação enviada|Cadastro alterado|Cadastro realizado|Cadastro aceito|Cadastro recusado|Cadastro cancelado/ })
            expect(groupBtns).toHaveLength(1)
        })
    })

    it("cria grupos separados para timestamps diferentes", async () => {
        const entries = [
            makeEntry({ id: 1, data_alteracao: "2024-01-15T10:00:00Z" }),
            makeEntry({ id: 2, valor_novo: "Aceita", data_alteracao: "2024-01-16T12:00:00Z" }),
        ]
        vi.mocked(baixaFisicaService.historico).mockResolvedValue(entries)
        renderModal()
        await waitFor(() => {
            expect(screen.getByText("Solicitação enviada")).toBeInTheDocument()
            expect(screen.getByText("Cadastro aceito")).toBeInTheDocument()
        })
    })

    // --- Seleção de grupo ---

    it("seleciona outro grupo ao clicar nele", async () => {
        const entries = [
            makeEntry({ id: 1, valor_novo: "Solicitada", data_alteracao: "2024-01-15T10:00:00Z" }),
            makeEntry({ id: 2, valor_novo: "Aceita", data_alteracao: "2024-01-16T12:00:00Z" }),
        ]
        vi.mocked(baixaFisicaService.historico).mockResolvedValue(entries)
        renderModal()
        await waitFor(() => screen.getByText("Cadastro aceito"))
        fireEvent.click(screen.getByText("Cadastro aceito"))
        await waitFor(() => {
            expect(screen.getAllByText("Ações:").length).toBeGreaterThan(0)
        })
    })

    // --- getInitial ---

    it("exibe inicial do usuário no avatar", async () => {
        vi.mocked(baixaFisicaService.historico).mockResolvedValue([
            makeEntry({ alterado_por: "maria.silva" }),
        ])
        renderModal()
        await waitFor(() => {
            expect(screen.getAllByText("M").length).toBeGreaterThan(0)
        })
    })

    it("exibe '?' quando alterado_por é null", async () => {
        vi.mocked(baixaFisicaService.historico).mockResolvedValue([
            makeEntry({ alterado_por: null }),
        ])
        renderModal()
        await waitFor(() => {
            expect(screen.getAllByText("?").length).toBeGreaterThan(0)
        })
    })

    // --- Fechar modal ---

    it("chama onClose ao clicar no botão fechar", async () => {
        vi.mocked(baixaFisicaService.historico).mockResolvedValue([])
        const { onClose } = renderModal()
        await waitFor(() => screen.getByLabelText("Fechar histórico"))
        fireEvent.click(screen.getByLabelText("Fechar histórico"))
        expect(onClose).toHaveBeenCalledTimes(1)
    })
})