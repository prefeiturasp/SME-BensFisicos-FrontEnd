import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { vi, describe, it, expect, beforeEach } from "vitest"
import AdicionarBaixaPage from "../AdicionarBaixaPage"
import { baixaFisicaService } from "../../service/baixas.service"
import { bemService } from "../../../bem/services/bem.service"
import type { Bem } from "../../../bem/services/bem.service"

// ===================== MOCKS =====================

const mockNavigate = vi.fn()

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom")
    return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock("../../service/baixas.service", () => ({
    baixaFisicaService: {
        create: vi.fn(),
    },
}))

vi.mock("../../../bem/services/bem.service", () => ({
    bemService: {
        list: vi.fn(),
    },
}))

vi.mock("../../components/UnidadeAdministrativaSelect", () => ({
    UnidadeAdministrativaSelect: ({ onChange, value }: { onChange: (v: string) => void; value: string }) => (
        <select
            data-testid="unidade-select"
            value={value}
            onChange={e => onChange(e.target.value)}
        >
            <option value="">Selecione</option>
            <option value="1">UA-01</option>
        </select>
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

function makeBemListResponse(results: Bem[]) {
    return { results, count: results.length, next: null, previous: null }
}

// ===================== HELPERS =====================

function renderPage() {
    return render(
        <MemoryRouter>
            <AdicionarBaixaPage />
        </MemoryRouter>
    )
}

async function selectUA() {
    fireEvent.change(screen.getByTestId("unidade-select"), { target: { value: "1" } })
}

async function selectBem() {
    await selectUA()
    fireEvent.focus(screen.getByPlaceholderText("Selecione um bem"))
    await waitFor(() => screen.getByText("Cadeira Escritório"))
    fireEvent.click(screen.getByText("Cadeira Escritório"))
}

// ===================== TESTS =====================

describe("AdicionarBaixaPage", () => {

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(bemService.list).mockResolvedValue(makeBemListResponse([makeBem()]))
    })

    // --- Renderização ---

    it("renderiza o título da página", () => {
        renderPage()
        expect(screen.getByText("Adicionar Baixa Física de Bem Patrimonial")).toBeInTheDocument()
    })

    it("renderiza o campo de unidade administrativa", () => {
        renderPage()
        expect(screen.getByTestId("unidade-select")).toBeInTheDocument()
    })

    it("renderiza linha inicial de bem vazia após selecionar UA", async () => {
        renderPage()
        await selectUA()
        expect(screen.getByPlaceholderText("Selecione um bem")).toBeInTheDocument()
    })

    it("renderiza botões Solicitar e Cancelar", () => {
        renderPage()
        expect(screen.getByText("Solicitar")).toBeInTheDocument()
        expect(screen.getByText("Cancelar")).toBeInTheDocument()
    })

    it("não renderiza campo de número do processo", () => {
        renderPage()
        expect(screen.queryByPlaceholderText("Digite o número do processo")).not.toBeInTheDocument()
    })

    it("não renderiza campo de data da baixa", () => {
        renderPage()
        expect(screen.queryByLabelText("Data da Baixa")).not.toBeInTheDocument()
    })

    // --- Validações ---

    it("exibe erro se tentar solicitar sem unidade", async () => {
        renderPage()
        fireEvent.click(screen.getByText("Solicitar"))
        await waitFor(() => {
            expect(screen.getByText("Selecione a unidade administrativa.")).toBeInTheDocument()
        })
    })

    it("exibe erro se tentar solicitar sem itens", async () => {
        renderPage()
        await selectUA()
        fireEvent.click(screen.getByText("Solicitar"))
        await waitFor(() => {
            expect(screen.getByText("Adicione ao menos um item.")).toBeInTheDocument()
        })
    })

    // --- Dropdown de bem ---

    it("abre dropdown ao focar no input de bem", async () => {
        renderPage()
        await selectUA()
        fireEvent.focus(screen.getByPlaceholderText("Selecione um bem"))
        await waitFor(() => {
            expect(bemService.list).toHaveBeenCalledWith({
                search: "",
                status: "aprovado",
                unidade_administrativa: 1,
            })
        })
    })

    it("exibe resultados no dropdown", async () => {
        renderPage()
        await selectUA()
        fireEvent.focus(screen.getByPlaceholderText("Selecione um bem"))
        await waitFor(() => {
            expect(screen.getByText("Cadeira Escritório")).toBeInTheDocument()
        })
    })

    it("exibe 'Buscando...' enquanto carrega", async () => {
        vi.mocked(bemService.list).mockReturnValue(new Promise(() => {}))
        renderPage()
        await selectUA()
        fireEvent.focus(screen.getByPlaceholderText("Selecione um bem"))
        await waitFor(() => {
            expect(screen.getByText("Buscando...")).toBeInTheDocument()
        })
    })

    it("exibe 'Nenhum bem encontrado.' quando lista vazia", async () => {
        vi.mocked(bemService.list).mockResolvedValue(makeBemListResponse([]))
        renderPage()
        await selectUA()
        fireEvent.focus(screen.getByPlaceholderText("Selecione um bem"))
        await waitFor(() => {
            expect(screen.getByText("Nenhum bem encontrado.")).toBeInTheDocument()
        })
    })

    it("seleciona bem ao clicar no dropdown", async () => {
        renderPage()
        await selectUA()
        fireEvent.focus(screen.getByPlaceholderText("Selecione um bem"))
        await waitFor(() => screen.getByText("Cadeira Escritório"))
        fireEvent.click(screen.getByText("Cadeira Escritório"))
        await waitFor(() => {
            expect(screen.getByText("Cadeira Escritório")).toBeInTheDocument()
            expect(screen.queryByPlaceholderText("Selecione um bem")).not.toBeInTheDocument()
        })
    })

    it("limpa bem selecionado ao clicar no X", async () => {
        renderPage()
        await selectBem()
        await waitFor(() => screen.getByLabelText("Limpar bem selecionado"))
        fireEvent.click(screen.getByLabelText("Limpar bem selecionado"))
        await waitFor(() => {
            expect(screen.getByPlaceholderText("Selecione um bem")).toBeInTheDocument()
        })
    })

    // --- Linhas de itens ---

    it("adiciona nova linha ao clicar em Adicionar item", async () => {
        renderPage()
        await selectUA()
        fireEvent.click(screen.getByLabelText("Adicionar item"))
        await waitFor(() => {
            expect(screen.getAllByPlaceholderText("Selecione um bem")).toHaveLength(2)
        })
    })

    it("remove linha ao clicar em Remover item", async () => {
        renderPage()
        await selectUA()
        fireEvent.click(screen.getByLabelText("Adicionar item"))
        await waitFor(() => screen.getAllByPlaceholderText("Selecione um bem"))
        const removeButtons = screen.getAllByLabelText("Remover item")
        fireEvent.click(removeButtons[0])
        await waitFor(() => {
            expect(screen.getAllByPlaceholderText("Selecione um bem")).toHaveLength(1)
        })
    })

    it("ao remover a única linha, reseta com linha vazia", async () => {
        renderPage()
        await selectUA()
        fireEvent.click(screen.getByLabelText("Remover item"))
        await waitFor(() => {
            expect(screen.getByPlaceholderText("Selecione um bem")).toBeInTheDocument()
        })
    })

    // --- Submit ---

    it("chama baixaFisicaService.create com dados corretos (sem processo e data)", async () => {
        vi.mocked(baixaFisicaService.create).mockResolvedValue(undefined as never)

        renderPage()
        await selectBem()

        fireEvent.click(screen.getByText("Solicitar"))

        await waitFor(() => {
            expect(baixaFisicaService.create).toHaveBeenCalledWith({
                unidade_administrativa_origem: 1,
                itens: [{ bem: 1 }],
            })
        })
    })

    it("navega para trás após solicitar com sucesso", async () => {
        vi.mocked(baixaFisicaService.create).mockResolvedValue(undefined as never)

        renderPage()
        await selectBem()
        fireEvent.click(screen.getByText("Solicitar"))

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith(-1)
        })
    })

    it("exibe erro ao falhar no create", async () => {
        vi.mocked(baixaFisicaService.create).mockRejectedValue(new Error("Erro de servidor"))

        renderPage()
        await selectBem()
        fireEvent.click(screen.getByText("Solicitar"))

        await waitFor(() => {
            expect(screen.getByText("Erro de servidor")).toBeInTheDocument()
        })
    })

    it("exibe 'Solicitando...' durante o submit", async () => {
        vi.mocked(baixaFisicaService.create).mockReturnValue(new Promise(() => {}))

        renderPage()
        await selectBem()
        fireEvent.click(screen.getByText("Solicitar"))

        await waitFor(() => {
            expect(screen.getByText("Solicitando...")).toBeInTheDocument()
        })
    })

    it("navega para trás ao clicar em Cancelar", () => {
        renderPage()
        fireEvent.click(screen.getByText("Cancelar"))
        expect(mockNavigate).toHaveBeenCalledWith(-1)
    })

    it("placeholder muda quando nenhuma unidade está selecionada", () => {
        renderPage()
        expect(
            screen.getByPlaceholderText("Selecione uma unidade administrativa primeiro")
        ).toBeInTheDocument()
    })

    it("input de bem fica desabilitado sem unidade selecionada", () => {
        renderPage()
        const input = screen.getByPlaceholderText("Selecione uma unidade administrativa primeiro")
        expect(input).toBeDisabled()
    })

    it("troca de unidade administrativa reseta os itens", async () => {
        renderPage()
        await selectBem()
        await waitFor(() => screen.getByText("Cadeira Escritório"))

        // Troca a UA — deve resetar os itens
        fireEvent.change(screen.getByTestId("unidade-select"), { target: { value: "" } })
        fireEvent.change(screen.getByTestId("unidade-select"), { target: { value: "1" } })

        await waitFor(() => {
            expect(screen.getByPlaceholderText("Selecione um bem")).toBeInTheDocument()
        })
    })
})