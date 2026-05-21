
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { MemoryRouter, Route, Routes } from "react-router-dom"

import ViewUsuarioPage from "../ViewUsuarioPage"
import { usuarioService } from "../../service/usuario.service"
import { authService } from "../../../../../auth/auth.service"

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("../../service/usuario.service", () => ({
    usuarioService: {
        retrieve: vi.fn(),
    },
}))

vi.mock("../../../../../auth/auth.service", () => ({
    authService: {
        getCurrentUser: vi.fn(),
    },
}))

vi.mock("@/components/AppBreadcrumb", () => ({
    AppBreadcrumb: () => <nav data-testid="breadcrumb" />,
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

const usuarioMock = {
    id: 1,
    nome: "João da Silva",
    rf: "F123456",
    username: "joao.silva",
    email: "joao@example.com",
    grupo_nome: "GESTOR_PATRIMONIO",
    unidade_codigo: "UA001",
    unidade_nome: "Unidade Central",
    status: "ativo",
    status_display: "Ativo",
}

function renderPage(id = "1") {
    return render(
        <MemoryRouter initialEntries={[`/usuarios/${id}`]}>
            <Routes>
                <Route path="/usuarios/:id" element={<ViewUsuarioPage />} />
                <Route path="/usuarios/:id/editar" element={<div>Página de Edição</div>} />
            </Routes>
        </MemoryRouter>
    )
}

// ─── Testes ───────────────────────────────────────────────────────────────────

describe("ViewUsuarioPage", () => {

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(authService.getCurrentUser).mockResolvedValue({ data: { opcoes_escopo: { grupos: [] } } } as any)
    })

    // ── Estado de carregamento ─────────────────────────────────────────────────

    it("exibe spinner de carregamento enquanto busca os dados", () => {
        vi.mocked(usuarioService.retrieve).mockReturnValue(new Promise(() => {}))

        renderPage()

        expect(screen.getByText("Carregando...")).toBeInTheDocument()
    })

    // ── Estado de erro ─────────────────────────────────────────────────────────

    it("exibe mensagem de erro quando a requisição falha", async () => {
        vi.mocked(usuarioService.retrieve).mockRejectedValue(new Error("Erro de rede"))

        renderPage()

        await waitFor(() => {
            expect(
                screen.getByText("Erro ao carregar os dados do usuário.")
            ).toBeInTheDocument()
        })
    })

    // ── Renderização dos dados ─────────────────────────────────────────────────

    it("exibe texto de todas as UAs quando gestor não tem seleção explícita", async () => {
        vi.mocked(usuarioService.retrieve).mockResolvedValue(usuarioMock)

        renderPage()

        await waitFor(() => {
            expect(screen.getByDisplayValue("Todas as UAs da Unidade Orçamentária selecionada")).toBeInTheDocument()
        })
    })

    it("todos os campos estão como somente leitura", async () => {
        vi.mocked(usuarioService.retrieve).mockResolvedValue(usuarioMock)

        renderPage()

        await waitFor(() => {
            expect(screen.getByDisplayValue("João da Silva")).toBeInTheDocument()
        })

        const inputs = screen.getAllByRole("textbox")
        inputs.forEach((input) => {
            expect(input).toHaveAttribute("readonly")
        })
    })

    // ── Navegação ─────────────────────────────────────────────────────────────

    it("navega para a página de edição ao clicar em 'Editar'", async () => {
        vi.mocked(usuarioService.retrieve).mockResolvedValue(usuarioMock)
        const user = userEvent.setup()

        renderPage()

        await waitFor(() => {
            expect(screen.getByDisplayValue("João da Silva")).toBeInTheDocument()
        })

        await user.click(screen.getByRole("button", { name: /editar/i }))

        expect(screen.getByText("Página de Edição")).toBeInTheDocument()
    })

    it("exibe o título 'Detalhar Usuário'", async () => {
        vi.mocked(usuarioService.retrieve).mockResolvedValue(usuarioMock)

        renderPage()

        await waitFor(() => {
            expect(
                screen.getByRole("heading", { name: /detalhar usuário/i })
            ).toBeInTheDocument()
        })
    })

    it("chama usuarioService.retrieve com o id correto da URL", async () => {
        vi.mocked(usuarioService.retrieve).mockResolvedValue(usuarioMock)

        renderPage("42")

        await waitFor(() => {
            expect(usuarioService.retrieve).toHaveBeenCalledWith(42)
        })
    })
})
