
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { MemoryRouter, Route, Routes } from "react-router-dom"

import EditarUsuarioPage from "../EditUsuarioPage"
import { usuarioService } from "../../service/usuario.service"
import { authService } from "../../../../../auth/auth.service"

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("../../service/usuario.service", () => ({
    usuarioService: {
        retrieve: vi.fn(),
        partialUpdate: vi.fn(),
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
    rf: "123456",
    username: "joao.silva",
    email: "joao@example.com",
    grupo_nome: "GESTOR_PATRIMONIO",
    unidade_codigo: "UA001",
    unidade_nome: "Unidade Central",
    status: "ativo",
    status_display: "Ativo",
}

const meMock = {
    data: {
        is_superuser: false,
        opcoes_escopo: {
            grupos: [
                {
                    uas: [
                        {
                            unidade_administrativa_id: 10,
                            unidade_orcamentaria_id: 20,
                            codigo: "UA001",
                            nome: "Unidade Central",
                        },
                        {
                            unidade_administrativa_id: 11,
                            unidade_orcamentaria_id: 21,
                            codigo: "UA002",
                            nome: "Unidade Norte",
                        },
                    ],
                },
            ],
        },
    },
}

const MOCK_PASSWORD = ["S@", "nh4", "@123!"].join("")

function renderPage(id = "1") {
    return render(
        <MemoryRouter initialEntries={[`/usuarios/${id}/editar`]}>
            <Routes>
                <Route path="/usuarios/:id/editar" element={<EditarUsuarioPage />} />
                <Route path="/usuarios/:id" element={<div>Página de Detalhes</div>} />
                <Route path="/usuarios" element={<div>Lista de Usuários</div>} />
            </Routes>
        </MemoryRouter>
    )
}

async function aguardarCarregamento() {
    await waitFor(() => {
        expect(screen.queryByText("Carregando...")).not.toBeInTheDocument()
    })
}

// ─── Testes ───────────────────────────────────────────────────────────────────

describe("EditarUsuarioPage", () => {

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(usuarioService.retrieve).mockResolvedValue(usuarioMock)
        vi.mocked(authService.getCurrentUser).mockResolvedValue(meMock)
        vi.mocked(usuarioService.partialUpdate).mockResolvedValue({})
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

    it("preenche o formulário com os dados do usuário após carregamento", async () => {
        renderPage()
        await aguardarCarregamento()

        expect(screen.getByDisplayValue("João da Silva")).toBeInTheDocument()
        expect(screen.getByDisplayValue("123456")).toBeInTheDocument()
        expect(screen.getByDisplayValue("joao@example.com")).toBeInTheDocument()
    })

    it("exibe o campo username como somente leitura", async () => {
        renderPage()
        await aguardarCarregamento()

        const usernameInput = screen.getByDisplayValue("joao.silva")
        expect(usernameInput).toHaveAttribute("readonly")
    })

    it("exibe a nota informando que o nome de acesso não pode ser alterado", async () => {
        renderPage()
        await aguardarCarregamento()

        expect(
            screen.getByText("O nome de acesso não pode ser alterado.")
        ).toBeInTheDocument()
    })

    it("não exibe o campo 'É Superusuário?' para usuários comuns", async () => {
        renderPage()
        await aguardarCarregamento()

        expect(screen.queryByLabelText(/é superusuário/i)).not.toBeInTheDocument()
    })

    // ── Validações de campos obrigatórios ─────────────────────────────────────

    it("exibe erros ao tentar salvar com campos obrigatórios vazios", async () => {
        renderPage()
        await aguardarCarregamento()

        const user = userEvent.setup()

        // Limpa os campos obrigatórios
        await user.clear(screen.getByPlaceholderText("Digite o nome completo"))
        await user.clear(screen.getByPlaceholderText("Digite o RF"))
        await user.clear(screen.getByPlaceholderText("Digite o e-mail"))

        await user.click(screen.getByRole("button", { name: /salvar/i }))

        await waitFor(() => {
            expect(screen.getByText("Nome é obrigatório")).toBeInTheDocument()
            expect(screen.getByText("RF é obrigatório")).toBeInTheDocument()
        })
    })

    it("exibe erro de e-mail inválido", async () => {
        renderPage()
        await aguardarCarregamento()

        const user = userEvent.setup()
        const emailInput = screen.getByPlaceholderText("Digite o e-mail")

        await user.clear(emailInput)
        await user.type(emailInput, "email-invalido")
        await user.click(screen.getByRole("button", { name: /salvar/i }))

        await waitFor(() => {
            expect(screen.getByText("E-mail inválido")).toBeInTheDocument()
        })
    })

    // ── Validações de senha ────────────────────────────────────────────────────

    it("não exige senha quando os campos estão em branco", async () => {
        renderPage()
        await aguardarCarregamento()

        const user = userEvent.setup()
        await user.click(screen.getByRole("button", { name: /salvar/i }))

        await waitFor(() => {
            expect(screen.queryByText(/senha/i)).not.toBeInTheDocument()
            expect(usuarioService.partialUpdate).toHaveBeenCalled()
        })
    })

    it("exibe erro quando a senha tem menos de 6 caracteres", async () => {
        renderPage()
        await aguardarCarregamento()

        const user = userEvent.setup()
        await user.type(screen.getByPlaceholderText("Digite a nova senha"), "Ab1!")
        await user.click(screen.getByRole("button", { name: /salvar/i }))

        await waitFor(() => {
            expect(
                screen.getByText("A senha deve ter no mínimo 6 caracteres")
            ).toBeInTheDocument()
        })
    })

    it("exibe erro quando a senha não tem letra maiúscula", async () => {
        renderPage()
        await aguardarCarregamento()

        const user = userEvent.setup()
        await user.type(screen.getByPlaceholderText("Digite a nova senha"), "abcde1!")
        await user.click(screen.getByRole("button", { name: /salvar/i }))

        await waitFor(() => {
            expect(
                screen.getByText("A senha deve conter pelo menos 1 letra maiúscula")
            ).toBeInTheDocument()
        })
    })

    it("exibe erro quando a senha não tem letra minúscula", async () => {
        renderPage()
        await aguardarCarregamento()

        const user = userEvent.setup()
        await user.type(screen.getByPlaceholderText("Digite a nova senha"), "ABCDE1!")
        await user.click(screen.getByRole("button", { name: /salvar/i }))

        await waitFor(() => {
            expect(
                screen.getByText("A senha deve conter pelo menos 1 letra minúscula")
            ).toBeInTheDocument()
        })
    })

    it("exibe erro quando a senha não tem número", async () => {
        renderPage()
        await aguardarCarregamento()

        const user = userEvent.setup()
        await user.type(screen.getByPlaceholderText("Digite a nova senha"), "AbcDef!")
        await user.click(screen.getByRole("button", { name: /salvar/i }))

        await waitFor(() => {
            expect(
                screen.getByText("A senha deve conter pelo menos 1 número")
            ).toBeInTheDocument()
        })
    })

    it("exibe erro quando a senha não tem caractere especial", async () => {
        renderPage()
        await aguardarCarregamento()

        const user = userEvent.setup()
        await user.type(screen.getByPlaceholderText("Digite a nova senha"), "Abcde1")
        await user.click(screen.getByRole("button", { name: /salvar/i }))

        await waitFor(() => {
            expect(
                screen.getByText("A senha deve conter pelo menos 1 caractere especial")
            ).toBeInTheDocument()
        })
    })

    it("exibe erro quando as senhas não coincidem", async () => {
        renderPage()
        await aguardarCarregamento()

        const user = userEvent.setup()
        await user.type(screen.getByPlaceholderText("Digite a nova senha"), "Abc123!")
        await user.type(screen.getByPlaceholderText("Confirme a nova senha"), "Xyz999@")
        await user.click(screen.getByRole("button", { name: /salvar/i }))

        await waitFor(() => {
            expect(screen.getByText("As senhas não coincidem")).toBeInTheDocument()
        })
    })

    it("não exibe erros de senha quando a senha é válida e coincide", async () => {
        renderPage()
        await aguardarCarregamento()

        const user = userEvent.setup()
        await user.type(screen.getByPlaceholderText("Digite a nova senha"), "Abc123!")
        await user.type(screen.getByPlaceholderText("Confirme a nova senha"), "Abc123!")
        await user.click(screen.getByRole("button", { name: /salvar/i }))

        await waitFor(() => {
            expect(screen.queryByText("As senhas não coincidem")).not.toBeInTheDocument()
            expect(
                screen.queryByText("A senha deve ter no mínimo 6 caracteres")
            ).not.toBeInTheDocument()
        })
    })

    // ── Submissão ─────────────────────────────────────────────────────────────

    it("envia o payload correto ao salvar sem alterar a senha", async () => {
        renderPage()
        await aguardarCarregamento()

        const user = userEvent.setup()
        await user.click(screen.getByRole("button", { name: /salvar/i }))

        await waitFor(() => {
            expect(usuarioService.partialUpdate).toHaveBeenCalledWith(
                1,
                expect.objectContaining({
                    nome: "João da Silva",
                    rf: "123456",
                    email: "joao@example.com",
                    group_name: "GESTOR_PATRIMONIO",
                    is_active: true,
                })
            )
            // Não deve enviar password
            expect(usuarioService.partialUpdate).toHaveBeenCalledWith(
                1,
                expect.not.objectContaining({ password: expect.anything() })
            )
        })
    })

    it("inclui o campo 'password' no payload quando a senha é preenchida", async () => {
        renderPage()
        await aguardarCarregamento()

        const user = userEvent.setup()
        await user.type(screen.getByPlaceholderText("Digite a nova senha"), MOCK_PASSWORD)
        await user.type(screen.getByPlaceholderText("Confirme a nova senha"), MOCK_PASSWORD)
        await user.click(screen.getByRole("button", { name: /salvar/i }))

        await waitFor(() => {
            expect(usuarioService.partialUpdate).toHaveBeenCalledWith(
                1,
                expect.objectContaining({ password: MOCK_PASSWORD })
            )
        })
    })

    it("navega para a página de detalhes após salvar com sucesso", async () => {
        renderPage()
        await aguardarCarregamento()

        const user = userEvent.setup()
        await user.click(screen.getByRole("button", { name: /salvar/i }))

        await waitFor(() => {
            expect(screen.getByText("Página de Detalhes")).toBeInTheDocument()
        })
    })

    it("exibe mensagem de erro quando o salvamento falha", async () => {
        vi.mocked(usuarioService.partialUpdate).mockRejectedValue(
            new Error("Falha ao salvar")
        )

        renderPage()
        await aguardarCarregamento()

        const user = userEvent.setup()
        await user.click(screen.getByRole("button", { name: /salvar/i }))

        await waitFor(() => {
            expect(screen.getByText("Falha ao salvar")).toBeInTheDocument()
        })
    })

    it("exibe mensagem genérica quando o erro de salvamento tem response.data", async () => {
        vi.mocked(usuarioService.partialUpdate).mockRejectedValue({
            response: { data: { email: ["Já existe um usuário com este e-mail."] } },
        })

        renderPage()
        await aguardarCarregamento()

        const user = userEvent.setup()
        await user.click(screen.getByRole("button", { name: /salvar/i }))

        await waitFor(() => {
            expect(
                screen.getByText("Erro de validação ao salvar usuário.")
            ).toBeInTheDocument()
        })
    })

    // ── Navegação ─────────────────────────────────────────────────────────────

    it("navega para '/usuarios' ao clicar em 'Cancelar'", async () => {
        renderPage()
        await aguardarCarregamento()

        const user = userEvent.setup()
        await user.click(screen.getByRole("button", { name: /cancelar/i }))

        expect(screen.getByText("Lista de Usuários")).toBeInTheDocument()
    })

    // ── Requisitos visuais de senha ────────────────────────────────────────────

    it("exibe a lista de requisitos de senha na tela", async () => {
        renderPage()
        await aguardarCarregamento()

        expect(screen.getByText("Mínimo de 6 caracteres")).toBeInTheDocument()
        expect(screen.getByText("Pelo menos 1 letra maiúscula")).toBeInTheDocument()
        expect(screen.getByText("Pelo menos 1 letra minúscula")).toBeInTheDocument()
        expect(screen.getByText("Pelo menos 1 número")).toBeInTheDocument()
        expect(screen.getByText(/pelo menos 1 caractere especial/i)).toBeInTheDocument()
    })
})