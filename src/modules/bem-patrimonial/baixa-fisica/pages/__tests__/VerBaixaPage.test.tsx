// VerBaixaPage_test.tsx
//
// Cobertura completa do componente VerBaixaPage (documento 4):
// • loading / not-found
// • modo somente-leitura (aceita, recusada, cancelada)
// • modo edição (aguardando_envio): dropdown, adicionar/remover/limpar linhas, salvar
// • modo "Validar Baixa" (solicitada): filtro, checkboxes, contador,
//   "Solicitar correção", modal ConfirmarAceite, handleConfirmarAceite (sucesso/erro)
// • NBBPM download (sucesso, erro, numero_processo_baixa nulo)
// • Histórico modal
// • navegação (Voltar)
// • branch: unidade_administrativa sem id (dropdown não busca)
// • bem sem numero_patrimonial → SEM-NUMERO-{id}

import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { vi, describe, it, expect, beforeEach } from "vitest"

import VerBaixaPage from "../VerBaixaPage"
import { toast } from "sonner"
import { baixaFisicaService } from "../../service/baixas.service"
import { bemService } from "../../../bem/services/bem.service"

import type { BaixaFisicaDetail } from "../../types/baixas-fisicas.types"
import type { Bem } from "../../../bem/services/bem.service"

// ===================== MOCKS =====================

const mockNavigate = vi.fn()

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom")
    return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock("sonner", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
    },
}))

vi.mock("../../service/baixas.service", () => ({
    baixaFisicaService: {
        retrieve: vi.fn(),
        update: vi.fn(),
        aprovar: vi.fn(),
        gerarNbbpm: vi.fn(),
        gerarLaudo: vi.fn(),
        historico: vi.fn(),
    },
}))

vi.mock("../../../bem/services/bem.service", () => ({
    bemService: { list: vi.fn() },
}))

// CORRIGIDO: paths relativos ao arquivo de teste (pages/__tests__/)
vi.mock("../../modals/HistoricoModal", () => ({
    default: ({ onClose }: { onClose: () => void }) => (
        <div data-testid="historico-modal">
            <button onClick={onClose}>Fechar Histórico</button>
        </div>
    ),
}))

vi.mock("../../modals/ConfirmarAceiteModal", () => ({
    default: ({
        onConfirm,
        onCancel,
        loading,
    }: {
        onConfirm: () => void
        onCancel: () => void
        loading?: boolean
    }) => (
        <div data-testid="confirmar-aceite-modal">
            <button onClick={onConfirm} disabled={loading} data-testid="btn-confirmar">
                {loading ? "Confirmando..." : "Confirmar"}
            </button>
            <button onClick={onCancel} data-testid="btn-cancelar-modal">
                Cancelar
            </button>
        </div>
    ),
}))

vi.mock("@/components/AppBreadcrumb", () => ({
    AppBreadcrumb: () => <nav data-testid="breadcrumb" />,
}))

// ===================== FACTORIES =====================

function makeBem(overrides: Partial<Bem> = {}): Bem {
    // Mock de um bem patrimonial simples para testes
    return { // NOSONAR
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
        numero_formato_antigo: false,
        sem_numeracao: false,
        ...overrides,
    } as Bem
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
        url_solicitar: null,
        url_aprovar: null,
        url_recusar: null,
        url_solicitar_correcao: null,
        url_gerar_nbbpm: null,
        url_gerar_laudo: null,
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

// `editando` = true simula a chegada pela ação "Editar" da listagem
// (?editar=1), que já abre a tela com o modo de edição habilitado.
function renderPage(id = "1", editando = false) {
    const path = editando
        ? `/baixas-fisicas/${id}?editar=1`
        : `/baixas-fisicas/${id}`
    return render(
        <MemoryRouter initialEntries={[path]}>
            <Routes>
                <Route path="/baixas-fisicas/:id" element={<VerBaixaPage />} />
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
        vi.mocked(baixaFisicaService.historico).mockResolvedValue([])
    })

    // ─────────────────────────────────────────────────────────────
    // Loading / Error
    // ─────────────────────────────────────────────────────────────

    it("exibe loading inicialmente", () => {
        vi.mocked(baixaFisicaService.retrieve).mockReturnValue(new Promise(() => {}))
        renderPage()
        expect(screen.getByText("Carregando...")).toBeInTheDocument()
    })

    it("exibe 'Baixa não encontrada' quando retrieve rejeita", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockRejectedValue(new Error("Not found"))
        renderPage()
        await waitFor(() =>
            expect(screen.getByText("Baixa não encontrada")).toBeInTheDocument()
        )
    })

    // ─────────────────────────────────────────────────────────────
    // Renderização — modo leitura (aguardando_envio como base)
    // ─────────────────────────────────────────────────────────────

    it("renderiza título 'Visualizar' para status aguardando_envio", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(makeBaixaDetail())
        renderPage()
        await waitFor(() =>
            expect(screen.getByText("Visualizar Baixa Física de Bem Patrimonial")).toBeInTheDocument()
        )
    })

    it("renderiza breadcrumb", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(makeBaixaDetail())
        renderPage()
        await waitFor(() => expect(screen.getByTestId("breadcrumb")).toBeInTheDocument())
    })

    it("renderiza identificação da baixa com id e UA", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(makeBaixaDetail())
        renderPage()
        await waitFor(() => {
            expect(screen.getByText(/Baixa Física #001/)).toBeInTheDocument()
            expect(screen.getByText(/UA-01/)).toBeInTheDocument()
        })
    })

    it("renderiza status badge", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(makeBaixaDetail())
        renderPage()
        await waitFor(() =>
            expect(screen.getByText(/Aguardando Envio/)).toBeInTheDocument()
        )
    })

    it("renderiza nome do solicitante", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(makeBaixaDetail())
        renderPage()
        await waitFor(() => expect(screen.getByText("João Silva")).toBeInTheDocument())
    })

    it("renderiza '-' quando aprovado_por é nulo", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({ aprovado_por: null })
        )
        renderPage()
        await waitFor(() => expect(screen.getAllByText("-").length).toBeGreaterThan(0))
    })

    it("renderiza nome do aprovador quando preenchido", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({
                aprovado_por: { id: 2, nome_completo: "Maria Gestora", username: "maria", email: "maria@email.com" },
                data_aprovacao: "2024-01-16T14:00:00Z",
            })
        )
        renderPage()
        await waitFor(() => expect(screen.getByText("Maria Gestora")).toBeInTheDocument())
    })

    it("renderiza itens existentes no modo leitura (aceita)", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({
                status: "aceita",
                status_display: "Aceita",
                itens: [makeBaixaItem(1, { numero_patrimonial: "PAT-001", nome: "Cadeira" })],
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
            makeBaixaDetail({ data_baixa: "data-invalida" })
        )
        renderPage()
        await waitFor(() => expect(screen.getAllByText("-").length).toBeGreaterThan(0))
    })

    it("renderiza '-' para data_aprovacao inválida", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({ data_aprovacao: "data-invalida" })
        )
        renderPage()
        await waitFor(() => expect(screen.getAllByText("-").length).toBeGreaterThan(0))
    })

    it("renderiza numero_processo_baixa quando preenchido", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({ numero_processo_baixa: "PROC-XYZ" })
        )
        renderPage()
        await waitFor(() => expect(screen.getByText("PROC-XYZ")).toBeInTheDocument())
    })

    it("renderiza numero_nbbpm quando preenchido", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({ status: "aceita", status_display: "Aceita", numero_nbbpm: "NBBPM-999" })
        )
        renderPage()
        await waitFor(() => expect(screen.getByText("NBBPM-999")).toBeInTheDocument())
    })

    it("exibe mensagem 'Nenhum item vinculado' no modo leitura quando itens vazio", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({ status: "aceita", status_display: "Aceita", itens: [] })
        )
        renderPage()
        await waitFor(() =>
            expect(screen.getByText("Nenhum item vinculado")).toBeInTheDocument()
        )
    })

    // ─────────────────────────────────────────────────────────────
    // Botão Salvar Edição — só existe no status aguardando_envio
    // Para os demais status o botão não é renderizado pelo componente
    // ─────────────────────────────────────────────────────────────

    it("botão Salvar Edição presente e desabilitado sem alterações (em elaboração + modo edição)", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(makeBaixaDetail())
        renderPage("1", true)
        await waitFor(() => expect(screen.getByText("Salvar Edição")).toBeDisabled())
    })

    it("botão Salvar Edição não é renderizado para status aceita", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({ status: "aceita", status_display: "Aceita" })
        )
        renderPage()
        await waitFor(() => screen.getByText(/Aceita/))
        expect(screen.queryByText("Salvar Edição")).not.toBeInTheDocument()
    })

    it("botão Salvar Edição não é renderizado para status recusada", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({ status: "recusada", status_display: "Recusada" })
        )
        renderPage()
        await waitFor(() => screen.getByText(/Recusada/))
        expect(screen.queryByText("Salvar Edição")).not.toBeInTheDocument()
    })

    it("botão Salvar Edição não é renderizado para status cancelada", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({ status: "cancelada", status_display: "Cancelada" })
        )
        renderPage()
        await waitFor(() => screen.getByText(/Cancelada/))
        expect(screen.queryByText("Salvar Edição")).not.toBeInTheDocument()
    })

    it("botão Salvar Edição não é renderizado para status solicitada", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({ status: "solicitada", status_display: "Solicitada" })
        )
        renderPage()
        await waitFor(() => screen.getByText("Validar Baixa Física de Bem Patrimonial"))
        expect(screen.queryByText("Salvar Edição")).not.toBeInTheDocument()
    })

    // ─────────────────────────────────────────────────────────────
    // Dropdown BemSelector
    // ─────────────────────────────────────────────────────────────

    it("exibe input de busca para linha vazia (aguardando_envio)", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(makeBaixaDetail({ itens: [] }))
        renderPage("1", true)
        await waitFor(() =>
            expect(screen.getByPlaceholderText("Selecione um bem")).toBeInTheDocument()
        )
    })

    it("renderiza 'Buscando...' enquanto lista carrega", async () => {
        vi.mocked(bemService.list).mockReturnValue(new Promise(() => {}))
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(makeBaixaDetail({ itens: [] }))
        renderPage("1", true)
        await waitFor(() => screen.getByPlaceholderText("Selecione um bem"))
        fireEvent.focus(screen.getByPlaceholderText("Selecione um bem"))
        expect(screen.getByText("Buscando...")).toBeInTheDocument()
    })

    it("renderiza 'Nenhum bem encontrado.' quando lista retorna vazia", async () => {
        vi.mocked(bemService.list).mockResolvedValue({ results: [], count: 0, next: null, previous: null })
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(makeBaixaDetail({ itens: [] }))
        renderPage("1", true)
        await waitFor(() => screen.getByPlaceholderText("Selecione um bem"))
        fireEvent.focus(screen.getByPlaceholderText("Selecione um bem"))
        await waitFor(() =>
            expect(screen.getByText("Nenhum bem encontrado.")).toBeInTheDocument()
        )
    })

    it("seleciona bem no dropdown e exibe na linha", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(makeBaixaDetail({ itens: [] }))
        renderPage("1", true)
        await waitFor(() => screen.getByPlaceholderText("Selecione um bem"))
        fireEvent.focus(screen.getByPlaceholderText("Selecione um bem"))
        await waitFor(() => screen.getByText("Cadeira Escritório"))
        fireEvent.click(screen.getByText("Cadeira Escritório"))
        await waitFor(() => expect(screen.getByText(/Cadeira Escritório/)).toBeInTheDocument())
    })

    it("clicar fora do dropdown fecha o dropdown", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(makeBaixaDetail({ itens: [] }))
        renderPage("1", true)
        await waitFor(() => screen.getByPlaceholderText("Selecione um bem"))
        fireEvent.focus(screen.getByPlaceholderText("Selecione um bem"))
        await waitFor(() => screen.getByText("Cadeira Escritório"))
        fireEvent.mouseDown(document.body)
        await waitFor(() =>
            expect(screen.queryByText("Cadeira Escritório")).not.toBeInTheDocument()
        )
    })

    it("digitar no input dispara nova busca", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(makeBaixaDetail({ itens: [] }))
        renderPage("1", true)
        await waitFor(() => screen.getByPlaceholderText("Selecione um bem"))
        const callsBefore = vi.mocked(bemService.list).mock.calls.length
        fireEvent.focus(screen.getByPlaceholderText("Selecione um bem"))
        await waitFor(() =>
            expect(vi.mocked(bemService.list).mock.calls.length).toBeGreaterThan(callsBefore)
        )
    })

    it("dropdown não busca quando unidade_administrativa id é falsy", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({
                itens: [],
                unidade_administrativa_origem: { id: 0, sigla: "", codigo: "", nome: "", status: "active" },
            })
        )
        renderPage("1", true)
        await waitFor(() => screen.getByPlaceholderText("Selecione um bem"))
        vi.mocked(bemService.list).mockClear()
        fireEvent.focus(screen.getByPlaceholderText("Selecione um bem"))
        await waitFor(() => expect(bemService.list).not.toHaveBeenCalled())
    })

    it("bem sem numero_patrimonial usa SEM-NUMERO-{id}", async () => {
        vi.mocked(bemService.list).mockResolvedValue({
            results: [makeBem({ id: 99, numero_patrimonial: null as unknown as string, nome: "Bem Sem Número" })],
            count: 1,
            next: null,
            previous: null,
        })
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(makeBaixaDetail({ itens: [] }))
        renderPage("1", true)
        await waitFor(() => screen.getByPlaceholderText("Selecione um bem"))
        fireEvent.focus(screen.getByPlaceholderText("Selecione um bem"))
        await waitFor(() => screen.getByText("Bem Sem Número"))
        fireEvent.click(screen.getByText("Bem Sem Número"))
        await waitFor(() => expect(screen.getByText(/SEM-NUMERO-99/)).toBeInTheDocument())
    })

    it("item já selecionado aparece desabilitado no dropdown", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(makeBaixaDetail({ itens: [] }))
        renderPage("1", true)

        await waitFor(() => screen.getByPlaceholderText("Selecione um bem"))
        fireEvent.focus(screen.getByPlaceholderText("Selecione um bem"))
        await waitFor(() => screen.getByText("Cadeira Escritório"))
        fireEvent.click(screen.getByText("Cadeira Escritório"))

        await waitFor(() => screen.getByTitle("Adicionar item"))
        fireEvent.click(screen.getByTitle("Adicionar item"))
        await waitFor(() => screen.getAllByPlaceholderText("Selecione um bem"))

        const secondInput = screen.getAllByPlaceholderText("Selecione um bem")[0]
        fireEvent.focus(secondInput)

        await waitFor(() => {
            const btn = screen.getByRole("button", { name: /PAT-001/i })
            expect(btn).toBeDisabled()
        })
    })

    // ─────────────────────────────────────────────────────────────
    // Manipulação de linhas
    // ─────────────────────────────────────────────────────────────

    it("adiciona nova linha ao clicar em 'Adicionar item'", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(makeBaixaDetail({ itens: [] }))
        renderPage("1", true)
        await waitFor(() => screen.getByTitle("Adicionar item"))
        fireEvent.click(screen.getByTitle("Adicionar item"))
        await waitFor(() =>
            expect(screen.getAllByPlaceholderText("Selecione um bem")).toHaveLength(2)
        )
    })

    it("remove linha intermediária sem zerar lista", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(makeBaixaDetail({ itens: [] }))
        renderPage("1", true)
        await waitFor(() => screen.getByTitle("Adicionar item"))
        fireEvent.click(screen.getByTitle("Adicionar item"))
        await waitFor(() => screen.getAllByTitle("Excluir linha"))
        fireEvent.click(screen.getAllByTitle("Excluir linha")[0])
        await waitFor(() =>
            expect(screen.getAllByPlaceholderText("Selecione um bem")).toHaveLength(1)
        )
    })

    it("remover única linha cria nova linha vazia", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(makeBaixaDetail({ itens: [] }))
        renderPage("1", true)
        await waitFor(() => screen.getByTitle("Excluir linha"))
        fireEvent.click(screen.getByTitle("Excluir linha"))
        await waitFor(() =>
            expect(screen.getByPlaceholderText("Selecione um bem")).toBeInTheDocument()
        )
    })

    it("limpa item selecionado ao clicar em 'Remover'", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({ itens: [makeBaixaItem(1)] })
        )
        renderPage("1", true)
        await waitFor(() => screen.getByText(/PAT-001/))
        fireEvent.click(screen.getByTitle("Remover"))
        await waitFor(() =>
            expect(screen.getByPlaceholderText("Selecione um bem")).toBeInTheDocument()
        )
    })

    // ─────────────────────────────────────────────────────────────
    // Salvar edição
    // ─────────────────────────────────────────────────────────────

    it("habilita botão Salvar Edição após selecionar um bem", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(makeBaixaDetail({ itens: [] }))
        renderPage("1", true)
        await waitFor(() => screen.getByPlaceholderText("Selecione um bem"))
        fireEvent.focus(screen.getByPlaceholderText("Selecione um bem"))
        await waitFor(() => screen.getByText("Cadeira Escritório"))
        fireEvent.click(screen.getByText("Cadeira Escritório"))
        await waitFor(() => expect(screen.getByText("Salvar Edição")).not.toBeDisabled())
    })

    it("exibe 'Salvando...' enquanto update está pendente", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(makeBaixaDetail({ itens: [] }))
        vi.mocked(baixaFisicaService.update).mockReturnValue(new Promise(() => {}))
        renderPage("1", true)
        await waitFor(() => screen.getByPlaceholderText("Selecione um bem"))
        fireEvent.focus(screen.getByPlaceholderText("Selecione um bem"))
        await waitFor(() => screen.getByText("Cadeira Escritório"))
        fireEvent.click(screen.getByText("Cadeira Escritório"))
        fireEvent.click(screen.getByText("Salvar Edição"))
        expect(screen.getByText("Salvando...")).toBeInTheDocument()
    })

    it("chama update com payload correto ao salvar", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(makeBaixaDetail({ itens: [] }))
        vi.mocked(baixaFisicaService.update).mockResolvedValue(
            makeBaixaDetail({ itens: [makeBaixaItem(1)] })
        )
        renderPage("1", true)
        await waitFor(() => screen.getByPlaceholderText("Selecione um bem"))
        fireEvent.focus(screen.getByPlaceholderText("Selecione um bem"))
        await waitFor(() => screen.getByText("Cadeira Escritório"))
        fireEvent.click(screen.getByText("Cadeira Escritório"))
        fireEvent.click(screen.getByText("Salvar Edição"))
        await waitFor(() =>
            expect(baixaFisicaService.update).toHaveBeenCalledWith(
                1,
                expect.objectContaining({ itens: [{ bem: 1 }] })
            )
        )
    })

    it("após salvar com itens vazios volta ao modo visualização sem itens", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(makeBaixaDetail({ itens: [] }))
        vi.mocked(baixaFisicaService.update).mockResolvedValue(makeBaixaDetail({ itens: [] }))
        renderPage("1", true)
        await waitFor(() => screen.getByPlaceholderText("Selecione um bem"))
        fireEvent.focus(screen.getByPlaceholderText("Selecione um bem"))
        await waitFor(() => screen.getByText("Cadeira Escritório"))
        fireEvent.click(screen.getByText("Cadeira Escritório"))
        await waitFor(() => expect(screen.getByText("Salvar Edição")).not.toBeDisabled())
        fireEvent.click(screen.getByText("Salvar Edição"))
        await waitFor(() =>
            expect(screen.getByText("Nenhum item vinculado")).toBeInTheDocument()
        )
    })

    it("trata erro no update sem quebrar a UI", async () => {
        const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(makeBaixaDetail({ itens: [] }))
        vi.mocked(baixaFisicaService.update).mockRejectedValue(new Error("Erro"))
        renderPage("1", true)
        await waitFor(() => screen.getByPlaceholderText("Selecione um bem"))
        fireEvent.focus(screen.getByPlaceholderText("Selecione um bem"))
        await waitFor(() => screen.getByText("Cadeira Escritório"))
        fireEvent.click(screen.getByText("Cadeira Escritório"))
        fireEvent.click(screen.getByText("Salvar Edição"))
        await waitFor(() => expect(errorSpy).toHaveBeenCalled())
        errorSpy.mockRestore()
    })

    // ─────────────────────────────────────────────────────────────
    // Modo "Validar Baixa" (status solicitada)
    // ─────────────────────────────────────────────────────────────

    it("exibe título 'Validar Baixa' quando status é solicitada", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({ status: "solicitada", status_display: "Solicitada" })
        )
        renderPage()
        await waitFor(() =>
            expect(screen.getByText("Validar Baixa Física de Bem Patrimonial")).toBeInTheDocument()
        )
    })

    it("exibe label 'Unidade Administrativa' e valor no modo validar", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({ status: "solicitada", status_display: "Solicitada" })
        )
        renderPage()
        await waitFor(() => {
            expect(screen.getByText("Unidade Administrativa")).toBeInTheDocument()
            expect(screen.getByText(/001 - Unidade 01/)).toBeInTheDocument()
        })
    })

    it("oculta painel de metadados (criado_por, status) no modo validar", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({ status: "solicitada", status_display: "Solicitada" })
        )
        renderPage()
        await waitFor(() =>
            expect(screen.queryByText("Usuário que solicitou a baixa:")).not.toBeInTheDocument()
        )
    })

    it("exibe tabela de validação com colunas corretas", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({
                status: "solicitada",
                status_display: "Solicitada",
                itens: [makeBaixaItem(10, { numero_patrimonial: "PAT-010", nome: "Mesa" })],
            })
        )
        renderPage()
        await waitFor(() => {
            expect(screen.getByText("Validação")).toBeInTheDocument()
            expect(screen.getByText("Número Patrimonial")).toBeInTheDocument()
            expect(screen.getByText("Nome do Bem")).toBeInTheDocument()
            expect(screen.getByText("PAT-010")).toBeInTheDocument()
            expect(screen.getByText("Mesa")).toBeInTheDocument()
        })
    })

    it("usa descricao quando nome do item é falsy", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({
                status: "solicitada",
                status_display: "Solicitada",
                itens: [makeBaixaItem(10, { nome: "", descricao: "Descricao do bem" })],
            })
        )
        renderPage()
        await waitFor(() =>
            expect(screen.getByText("Descricao do bem")).toBeInTheDocument()
        )
    })

    it("exibe filtro de validação no modo solicitada", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({ status: "solicitada", status_display: "Solicitada" })
        )
        renderPage()
        await waitFor(() =>
            expect(
                screen.getByPlaceholderText("Digite Número Patrimonial ou Nome do Bem")
            ).toBeInTheDocument()
        )
    })

    it("filtro por nome oculta itens que não correspondem", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({
                status: "solicitada",
                status_display: "Solicitada",
                itens: [
                    makeBaixaItem(10, { numero_patrimonial: "PAT-010", nome: "Mesa" }),
                    makeBaixaItem(11, { numero_patrimonial: "PAT-011", nome: "Cadeira" }),
                ],
            })
        )
        renderPage()
        await waitFor(() => screen.getByText("Mesa"))
        fireEvent.change(
            screen.getByPlaceholderText("Digite Número Patrimonial ou Nome do Bem"),
            { target: { value: "Mesa" } }
        )
        await waitFor(() => {
            expect(screen.getByText("Mesa")).toBeInTheDocument()
            expect(screen.queryByText("Cadeira")).not.toBeInTheDocument()
        })
    })

    it("filtro por número patrimonial oculta itens que não correspondem", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({
                status: "solicitada",
                status_display: "Solicitada",
                itens: [
                    makeBaixaItem(10, { numero_patrimonial: "PAT-010", nome: "Mesa" }),
                    makeBaixaItem(11, { numero_patrimonial: "PAT-011", nome: "Cadeira" }),
                ],
            })
        )
        renderPage()
        await waitFor(() => screen.getByText("Mesa"))
        fireEvent.change(
            screen.getByPlaceholderText("Digite Número Patrimonial ou Nome do Bem"),
            { target: { value: "PAT-011" } }
        )
        await waitFor(() => {
            expect(screen.queryByText("Mesa")).not.toBeInTheDocument()
            expect(screen.getByText("Cadeira")).toBeInTheDocument()
        })
    })

    it("filtro sem correspondência exibe mensagem 'Nenhum item corresponde ao filtro.'", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({
                status: "solicitada",
                status_display: "Solicitada",
                itens: [makeBaixaItem(10, { nome: "Mesa" })],
            })
        )
        renderPage()
        await waitFor(() => screen.getByText("Mesa"))
        fireEvent.change(
            screen.getByPlaceholderText("Digite Número Patrimonial ou Nome do Bem"),
            { target: { value: "XXXXXX" } }
        )
        await waitFor(() =>
            expect(screen.getByText("Nenhum item corresponde ao filtro.")).toBeInTheDocument()
        )
    })

    it("exibe contador '0 de N' quando nenhum item está marcado", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({
                status: "solicitada",
                status_display: "Solicitada",
                itens: [makeBaixaItem(10), makeBaixaItem(11)],
            })
        )
        renderPage()
        await waitFor(() =>
            expect(screen.getByText(/0 de 2 item\(ns\) validado\(s\)/)).toBeInTheDocument()
        )
    })

    it("marcar checkbox atualiza contador", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({
                status: "solicitada",
                status_display: "Solicitada",
                itens: [
                    makeBaixaItem(10, { numero_patrimonial: "PAT-010", nome: "Mesa" }),
                    makeBaixaItem(11, { numero_patrimonial: "PAT-011", nome: "Cadeira" }),
                ],
            })
        )
        renderPage()
        await waitFor(() => screen.getByText("Mesa"))
        fireEvent.click(screen.getByRole("checkbox", { name: /Validar item PAT-010/ }))
        await waitFor(() =>
            expect(screen.getByText(/1 de 2 item\(ns\) validado\(s\)/)).toBeInTheDocument()
        )
    })

    it("clicar na linha da tabela também marca o checkbox", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({
                status: "solicitada",
                status_display: "Solicitada",
                itens: [makeBaixaItem(10, { numero_patrimonial: "PAT-010", nome: "Mesa" })],
            })
        )
        renderPage()
        await waitFor(() => screen.getByText("Mesa"))
        fireEvent.click(screen.getByText("Mesa"))
        await waitFor(() =>
            expect(screen.getByText(/1 de 1 item\(ns\) validado\(s\)/)).toBeInTheDocument()
        )
    })

    it("desmarcar checkbox decrementa o contador", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({
                status: "solicitada",
                status_display: "Solicitada",
                itens: [makeBaixaItem(10, { numero_patrimonial: "PAT-010", nome: "Mesa" })],
            })
        )
        renderPage()
        await waitFor(() => screen.getByText("Mesa"))
        const cb = screen.getByRole("checkbox", { name: /Validar item PAT-010/ })
        fireEvent.click(cb)
        await waitFor(() => expect(screen.getByText(/1 de 1/)).toBeInTheDocument())
        fireEvent.click(cb)
        await waitFor(() =>
            expect(screen.getByText(/0 de 1 item\(ns\) validado\(s\)/)).toBeInTheDocument()
        )
    })

    it("exibe 'Todos validados' quando todos os itens estão marcados", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({
                status: "solicitada",
                status_display: "Solicitada",
                itens: [makeBaixaItem(10, { nome: "Mesa" })],
            })
        )
        renderPage()
        await waitFor(() => screen.getByText("Mesa"))
        fireEvent.click(screen.getByRole("checkbox", { name: /Validar item/ }))
        await waitFor(() =>
            expect(screen.getByText(/Todos validados/)).toBeInTheDocument()
        )
    })

    it("botão Aceitar desabilitado quando itens existem mas nenhum está marcado", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({
                status: "solicitada",
                status_display: "Solicitada",
                itens: [makeBaixaItem(10)],
            })
        )
        renderPage()
        await waitFor(() => expect(screen.getByText("Aceitar")).toBeDisabled())
    })

    it("botão Aceitar habilitado quando todos os itens estão validados", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({
                status: "solicitada",
                status_display: "Solicitada",
                itens: [makeBaixaItem(10, { nome: "Mesa" })],
            })
        )
        renderPage()
        await waitFor(() => screen.getByText("Mesa"))
        fireEvent.click(screen.getByRole("checkbox", { name: /Validar item/ }))
        await waitFor(() => expect(screen.getByText("Aceitar")).not.toBeDisabled())
    })

    it("clicar em Aceitar (com todos validados) abre ConfirmarAceiteModal", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({
                status: "solicitada",
                status_display: "Solicitada",
                itens: [makeBaixaItem(10, { nome: "Mesa" })],
            })
        )
        renderPage()
        await waitFor(() => screen.getByText("Mesa"))
        fireEvent.click(screen.getByRole("checkbox", { name: /Validar item/ }))
        await waitFor(() => expect(screen.getByText("Aceitar")).not.toBeDisabled())
        fireEvent.click(screen.getByText("Aceitar"))
        await waitFor(() =>
            expect(screen.getByTestId("confirmar-aceite-modal")).toBeInTheDocument()
        )
    })

    it("cancelar no modal fecha sem chamar aprovar", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({
                status: "solicitada",
                status_display: "Solicitada",
                itens: [makeBaixaItem(10, { nome: "Mesa" })],
            })
        )
        renderPage()
        await waitFor(() => screen.getByText("Mesa"))
        fireEvent.click(screen.getByRole("checkbox", { name: /Validar item/ }))
        await waitFor(() => expect(screen.getByText("Aceitar")).not.toBeDisabled())
        fireEvent.click(screen.getByText("Aceitar"))
        await waitFor(() => screen.getByTestId("btn-cancelar-modal"))
        fireEvent.click(screen.getByTestId("btn-cancelar-modal"))
        await waitFor(() =>
            expect(screen.queryByTestId("confirmar-aceite-modal")).not.toBeInTheDocument()
        )
        expect(baixaFisicaService.aprovar).not.toHaveBeenCalled()
    })

    it("confirmar aceite chama aprovar e navega para detalhe (replace: true)", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({
                id: 7,
                status: "solicitada",
                status_display: "Solicitada",
                itens: [makeBaixaItem(10, { nome: "Mesa" })],
            })
        )
        vi.mocked(baixaFisicaService.aprovar).mockResolvedValue(
            makeBaixaDetail({ id: 7, status: "aceita" })
        )
        renderPage("7")
        await waitFor(() => screen.getByText("Mesa"))
        fireEvent.click(screen.getByRole("checkbox", { name: /Validar item/ }))
        await waitFor(() => expect(screen.getByText("Aceitar")).not.toBeDisabled())
        fireEvent.click(screen.getByText("Aceitar"))
        await waitFor(() => screen.getByTestId("btn-confirmar"))
        fireEvent.click(screen.getByTestId("btn-confirmar"))
        await waitFor(() => {
            expect(baixaFisicaService.aprovar).toHaveBeenCalledWith(7)
            expect(mockNavigate).toHaveBeenCalledWith(
                "/baixas-fisicas/7",
                expect.objectContaining({ replace: true })
            )
        })
    })

    it("erro no aprovar exibe mensagem de erro e fecha o modal", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({
                status: "solicitada",
                status_display: "Solicitada",
                itens: [makeBaixaItem(10, { nome: "Mesa" })],
            })
        )
        vi.mocked(baixaFisicaService.aprovar).mockRejectedValue(new Error("Sem permissão"))
        renderPage()
        await waitFor(() => screen.getByText("Mesa"))
        fireEvent.click(screen.getByRole("checkbox", { name: /Validar item/ }))
        await waitFor(() => expect(screen.getByText("Aceitar")).not.toBeDisabled())
        fireEvent.click(screen.getByText("Aceitar"))
        await waitFor(() => screen.getByTestId("btn-confirmar"))
        fireEvent.click(screen.getByTestId("btn-confirmar"))
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Sem permissão")
            expect(screen.queryByTestId("confirmar-aceite-modal")).not.toBeInTheDocument()
        })
    })

    it("erro genérico no aprovar exibe mensagem padrão", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({
                status: "solicitada",
                status_display: "Solicitada",
                itens: [makeBaixaItem(10, { nome: "Mesa" })],
            })
        )
        vi.mocked(baixaFisicaService.aprovar).mockRejectedValue("falha genérica")
        renderPage()
        await waitFor(() => screen.getByText("Mesa"))
        fireEvent.click(screen.getByRole("checkbox", { name: /Validar item/ }))
        await waitFor(() => expect(screen.getByText("Aceitar")).not.toBeDisabled())
        fireEvent.click(screen.getByText("Aceitar"))
        await waitFor(() => screen.getByTestId("btn-confirmar"))
        fireEvent.click(screen.getByTestId("btn-confirmar"))
        await waitFor(() =>
            expect(toast.error).toHaveBeenCalledWith("Erro ao confirmar aceite da baixa.")
        )
    })

    it("botão 'Solicitar correção' aparece quando nem todos validados", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({
                status: "solicitada",
                status_display: "Solicitada",
                itens: [makeBaixaItem(10)],
            })
        )
        renderPage()
        await waitFor(() =>
            expect(screen.getByText("Solicitar correção")).toBeInTheDocument()
        )
    })

    it("botão 'Solicitar correção' some quando todos os itens estão validados", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({
                status: "solicitada",
                status_display: "Solicitada",
                itens: [makeBaixaItem(10, { nome: "Mesa" })],
            })
        )
        renderPage()
        await waitFor(() => screen.getByText("Mesa"))
        fireEvent.click(screen.getByRole("checkbox", { name: /Validar item/ }))
        await waitFor(() =>
            expect(screen.queryByText("Solicitar correção")).not.toBeInTheDocument()
        )
    })

    it("clicar em 'Solicitar correção' navega para rota correta", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({ id: 5, status: "solicitada", status_display: "Solicitada", itens: [makeBaixaItem(10)] })
        )
        renderPage("5")
        await waitFor(() => screen.getByText("Solicitar correção"))
        fireEvent.click(screen.getByText("Solicitar correção"))
        expect(mockNavigate).toHaveBeenCalledWith("/baixas-fisicas/5/solicitar-correcao")
    })

    it("não exibe botão Histórico no modo validar", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({ status: "solicitada", status_display: "Solicitada" })
        )
        renderPage()
        await waitFor(() =>
            expect(screen.queryByText("Histórico")).not.toBeInTheDocument()
        )
    })

    it("não exibe contador de validação quando lista de itens está vazia", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({ status: "solicitada", status_display: "Solicitada", itens: [] })
        )
        renderPage()
        await waitFor(() =>
            expect(screen.queryByText(/item\(ns\) validado\(s\)/)).not.toBeInTheDocument()
        )
    })

    // ─────────────────────────────────────────────────────────────
    // Histórico modal
    // ─────────────────────────────────────────────────────────────

    it("abre modal de histórico ao clicar em Histórico", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(makeBaixaDetail())
        renderPage()
        await waitFor(() => screen.getByText("Histórico"))
        fireEvent.click(screen.getByText("Histórico"))
        await waitFor(() =>
            expect(screen.getByTestId("historico-modal")).toBeInTheDocument()
        )
    })

    it("fecha modal de histórico ao clicar em 'Fechar Histórico'", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(makeBaixaDetail())
        renderPage()
        await waitFor(() => screen.getByText("Histórico"))
        fireEvent.click(screen.getByText("Histórico"))
        await waitFor(() => screen.getByTestId("historico-modal"))
        fireEvent.click(screen.getByText("Fechar Histórico"))
        await waitFor(() =>
            expect(screen.queryByTestId("historico-modal")).not.toBeInTheDocument()
        )
    })

    // ─────────────────────────────────────────────────────────────
    // Download NBBPM
    // ─────────────────────────────────────────────────────────────

    it("exibe 'Baixar NBBPM' quando url_gerar_nbbpm está preenchida (status aceita)", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({ status: "aceita", status_display: "Aceita", url_gerar_nbbpm: "/dl" })
        )
        renderPage()
        await waitFor(() => expect(screen.getByText("Baixar NBBPM")).toBeInTheDocument())
    })

    it("não exibe 'Baixar NBBPM' quando url_gerar_nbbpm é null", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({ status: "aceita", status_display: "Aceita", url_gerar_nbbpm: null })
        )
        renderPage()
        await waitFor(() => screen.getByText(/Aceita/))
        expect(screen.queryByText("Baixar NBBPM")).not.toBeInTheDocument()
    })

    it("não exibe 'Baixar NBBPM' no modo validar (solicitada)", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({
                status: "solicitada",
                status_display: "Solicitada",
                url_gerar_nbbpm: "/dl",
            })
        )
        renderPage()
        await waitFor(() => screen.getByText("Validar Baixa Física de Bem Patrimonial"))
        expect(screen.queryByText("Baixar NBBPM")).not.toBeInTheDocument()
    })

    it("executa download do NBBPM com sucesso", async () => {
        const clickMock = vi.fn()
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({ status: "aceita", status_display: "Aceita", url_gerar_nbbpm: "/download" })
        )
        vi.mocked(baixaFisicaService.gerarNbbpm).mockResolvedValue(new Blob(["pdf"]))
        vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:url")
        vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {})
        const spy = vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
            const el = document.createElementNS("http://www.w3.org/1999/xhtml", tag)
            if (tag === "a") Object.defineProperty(el, "click", { value: clickMock })
            return el
        })
        renderPage()
        await waitFor(() => screen.getByText("Baixar NBBPM"))
        fireEvent.click(screen.getByText("Baixar NBBPM"))
        await waitFor(() => {
            expect(baixaFisicaService.gerarNbbpm).toHaveBeenCalledWith(1)
            expect(clickMock).toHaveBeenCalled()
        })
        spy.mockRestore()
    })

    it("download NBBPM usa id quando numero_processo_baixa é nulo", async () => {
        const clickMock = vi.fn()
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({ id: 42, status: "aceita", status_display: "Aceita", numero_processo_baixa: null, url_gerar_nbbpm: "/dl" })
        )
        vi.mocked(baixaFisicaService.gerarNbbpm).mockResolvedValue(new Blob(["pdf"]))
        vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:url")
        vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {})
        const spy = vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
            const el = document.createElementNS("http://www.w3.org/1999/xhtml", tag)
            if (tag === "a") Object.defineProperty(el, "click", { value: clickMock })
            return el
        })
        renderPage()
        await waitFor(() => screen.getByText("Baixar NBBPM"))
        fireEvent.click(screen.getByText("Baixar NBBPM"))
        await waitFor(() => expect(baixaFisicaService.gerarNbbpm).toHaveBeenCalledWith(42))
        spy.mockRestore()
    })

    it("trata erro ao gerar NBBPM sem quebrar a UI", async () => {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({ status: "aceita", status_display: "Aceita", url_gerar_nbbpm: "/download" })
        )
        vi.mocked(baixaFisicaService.gerarNbbpm).mockRejectedValue(new Error("Erro download"))
        renderPage()
        await waitFor(() => screen.getByText("Baixar NBBPM"))
        fireEvent.click(screen.getByText("Baixar NBBPM"))
        await waitFor(() => expect(consoleSpy).toHaveBeenCalled())
        consoleSpy.mockRestore()
    })

    // ─────────────────────────────────────────────────────────────
    // Download Laudo de Avaliação
    // ─────────────────────────────────────────────────────────────

    it("exibe 'Baixar Laudo de Avaliação' quando url_gerar_laudo está preenchida (status aceita)", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({ status: "aceita", status_display: "Aceita", url_gerar_laudo: "/dl-laudo" })
        )
        renderPage()
        await waitFor(() => expect(screen.getByText("Baixar Laudo de Avaliação")).toBeInTheDocument())
    })

    it("não exibe 'Baixar Laudo de Avaliação' quando url_gerar_laudo é null", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({ status: "aceita", status_display: "Aceita", url_gerar_laudo: null })
        )
        renderPage()
        await waitFor(() => screen.getByText(/Aceita/))
        expect(screen.queryByText("Baixar Laudo de Avaliação")).not.toBeInTheDocument()
    })

    it("não exibe 'Baixar Laudo de Avaliação' quando status é solicitada", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({
                status: "solicitada",
                status_display: "Solicitada",
                url_gerar_laudo: "/dl-laudo",
            })
        )
        renderPage()
        await waitFor(() => screen.getByText("Validar Baixa Física de Bem Patrimonial"))
        expect(screen.queryByText("Baixar Laudo de Avaliação")).not.toBeInTheDocument()
    })

    it("executa download do Laudo de Avaliação com sucesso", async () => {
        const clickMock = vi.fn()
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({ status: "aceita", status_display: "Aceita", url_gerar_laudo: "/dl-laudo" })
        )
        vi.mocked(baixaFisicaService.gerarLaudo).mockResolvedValue(new Blob(["pdf"]))
        vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:url")
        vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {})
        const spy = vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
            const el = document.createElementNS("http://www.w3.org/1999/xhtml", tag)
            if (tag === "a") Object.defineProperty(el, "click", { value: clickMock })
            return el
        })
        renderPage()
        await waitFor(() => screen.getByText("Baixar Laudo de Avaliação"))
        fireEvent.click(screen.getByText("Baixar Laudo de Avaliação"))
        await waitFor(() => {
            expect(baixaFisicaService.gerarLaudo).toHaveBeenCalledWith(1)
            expect(clickMock).toHaveBeenCalled()
        })
        spy.mockRestore()
    })

    it("download Laudo de Avaliação usa id quando numero_processo_baixa é nulo", async () => {
        const clickMock = vi.fn()
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({ id: 42, status: "aceita", status_display: "Aceita", numero_processo_baixa: null, url_gerar_laudo: "/dl-laudo" })
        )
        vi.mocked(baixaFisicaService.gerarLaudo).mockResolvedValue(new Blob(["pdf"]))
        vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:url")
        vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {})
        const spy = vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
            const el = document.createElementNS("http://www.w3.org/1999/xhtml", tag)
            if (tag === "a") Object.defineProperty(el, "click", { value: clickMock })
            return el
        })
        renderPage()
        await waitFor(() => screen.getByText("Baixar Laudo de Avaliação"))
        fireEvent.click(screen.getByText("Baixar Laudo de Avaliação"))
        await waitFor(() => expect(baixaFisicaService.gerarLaudo).toHaveBeenCalledWith(42))
        spy.mockRestore()
    })

    it("trata erro ao gerar Laudo de Avaliação sem quebrar a UI", async () => {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({ status: "aceita", status_display: "Aceita", url_gerar_laudo: "/dl-laudo" })
        )
        vi.mocked(baixaFisicaService.gerarLaudo).mockRejectedValue(new Error("Erro download laudo"))
        renderPage()
        await waitFor(() => screen.getByText("Baixar Laudo de Avaliação"))
        fireEvent.click(screen.getByText("Baixar Laudo de Avaliação"))
        await waitFor(() => expect(consoleSpy).toHaveBeenCalled())
        consoleSpy.mockRestore()
    })

    // ─────────────────────────────────────────────────────────────
    // Navegação
    // ─────────────────────────────────────────────────────────────

    it("navega -1 ao clicar em Voltar", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(makeBaixaDetail())
        renderPage()
        await waitFor(() => screen.getByText("Voltar"))
        fireEvent.click(screen.getByText("Voltar"))
        expect(mockNavigate).toHaveBeenCalledWith(-1)
    })

    // ─────────────────────────────────────────────────────────────
    // Modo visualização x modo edição (Em elaboração)
    // ─────────────────────────────────────────────────────────────

    describe("Em elaboração — visualização e edição", () => {

        it("abre em modo visualização: sem campos editáveis e com botão Editar", async () => {
            vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
                makeBaixaDetail({ itens: [makeBaixaItem(1)] })
            )
            renderPage()
            await waitFor(() => expect(screen.getByText("Editar")).toBeInTheDocument())
            expect(screen.queryByPlaceholderText("Selecione um bem")).not.toBeInTheDocument()
            expect(screen.queryByText("Salvar Edição")).not.toBeInTheDocument()
            expect(screen.queryByTitle("Adicionar item")).not.toBeInTheDocument()
        })

        it("exibe os itens em somente leitura no modo visualização", async () => {
            vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
                makeBaixaDetail({ itens: [makeBaixaItem(1, { numero_patrimonial: "PAT-777" })] })
            )
            renderPage()
            await waitFor(() => expect(screen.getByText(/PAT-777/)).toBeInTheDocument())
            expect(screen.queryByTitle("Remover")).not.toBeInTheDocument()
        })

        it("clicar em Editar habilita a alteração dos campos", async () => {
            vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(makeBaixaDetail({ itens: [] }))
            renderPage()
            await waitFor(() => screen.getByText("Editar"))
            fireEvent.click(screen.getByText("Editar"))
            await waitFor(() =>
                expect(screen.getByPlaceholderText("Selecione um bem")).toBeInTheDocument()
            )
            expect(screen.getByText("Salvar Edição")).toBeInTheDocument()
            expect(screen.getByText("Editar Baixa Física de Bem Patrimonial")).toBeInTheDocument()
        })

        it("Cancelar Edição volta para o modo visualização", async () => {
            vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(makeBaixaDetail({ itens: [] }))
            renderPage()
            await waitFor(() => screen.getByText("Editar"))
            fireEvent.click(screen.getByText("Editar"))
            await waitFor(() => screen.getByText("Cancelar Edição"))
            fireEvent.click(screen.getByText("Cancelar Edição"))
            await waitFor(() =>
                expect(screen.queryByPlaceholderText("Selecione um bem")).not.toBeInTheDocument()
            )
            expect(screen.getByText("Editar")).toBeInTheDocument()
        })

        it("query param ?editar=1 abre direto em modo de edição", async () => {
            vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(makeBaixaDetail({ itens: [] }))
            renderPage("1", true)
            await waitFor(() =>
                expect(screen.getByPlaceholderText("Selecione um bem")).toBeInTheDocument()
            )
        })

        it("não exibe botão Editar para status diferente de Em elaboração", async () => {
            vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
                makeBaixaDetail({ status: "aceita", status_display: "Aceita" })
            )
            renderPage()
            await waitFor(() => screen.getByText(/Aceita/))
            expect(screen.queryByText("Editar")).not.toBeInTheDocument()
        })

        it("salvar exibe toast de sucesso e retorna ao modo visualização", async () => {
            vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(makeBaixaDetail({ itens: [] }))
            vi.mocked(baixaFisicaService.update).mockResolvedValue(
                makeBaixaDetail({ itens: [makeBaixaItem(1)] })
            )
            renderPage("1", true)
            await waitFor(() => screen.getByPlaceholderText("Selecione um bem"))
            fireEvent.focus(screen.getByPlaceholderText("Selecione um bem"))
            await waitFor(() => screen.getByText("Cadeira Escritório"))
            fireEvent.click(screen.getByText("Cadeira Escritório"))
            fireEvent.click(screen.getByText("Salvar Edição"))
            await waitFor(() =>
                expect(toast.success).toHaveBeenCalledWith("Baixa Física atualizada com sucesso.")
            )
            await waitFor(() => expect(screen.getByText("Editar")).toBeInTheDocument())
        })

        it("erro ao salvar exibe toast de erro", async () => {
            const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
            vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(makeBaixaDetail({ itens: [] }))
            vi.mocked(baixaFisicaService.update).mockRejectedValue(new Error("Falha ao salvar"))
            renderPage("1", true)
            await waitFor(() => screen.getByPlaceholderText("Selecione um bem"))
            fireEvent.focus(screen.getByPlaceholderText("Selecione um bem"))
            await waitFor(() => screen.getByText("Cadeira Escritório"))
            fireEvent.click(screen.getByText("Cadeira Escritório"))
            fireEvent.click(screen.getByText("Salvar Edição"))
            await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Falha ao salvar"))
            errorSpy.mockRestore()
        })
    })
})
