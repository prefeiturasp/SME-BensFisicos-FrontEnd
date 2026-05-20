import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { MemoryRouter, Route, Routes } from "react-router-dom"

import EditarUsuarioPage from "../EditUsuarioPage"
import { usuarioService } from "../../service/usuario.service"
import { authService } from "../../../../../auth/auth.service"

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
        expect(screen.getByDisplayValue("João da Silva")).toBeInTheDocument()
    })
}

describe("EditarUsuarioPage", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(usuarioService.retrieve).mockResolvedValue(usuarioMock)
        vi.mocked(authService.getCurrentUser).mockResolvedValue(meMock)
        vi.mocked(usuarioService.partialUpdate).mockResolvedValue({})
    })

    it("exibe spinner de carregamento enquanto busca os dados", () => {
        vi.mocked(usuarioService.retrieve).mockReturnValue(new Promise(() => { }))
        renderPage()
        expect(screen.getByText("Carregando...")).toBeInTheDocument()
    })

    it("exibe mensagem de erro quando a requisição falha", async () => {
        vi.mocked(usuarioService.retrieve).mockRejectedValue(new Error("Erro de rede"))
        renderPage()

        await waitFor(() => {
            expect(
                screen.getByText("Erro ao carregar os dados do usuário.")
            ).toBeInTheDocument()
        })
    })

    it("preenche o formulário com os dados do usuário após carregamento", async () => {
        renderPage()
        await aguardarCarregamento()

        expect(screen.getByDisplayValue("João da Silva")).toBeInTheDocument()
        expect(screen.getByDisplayValue("123456")).toBeInTheDocument()
        expect(screen.getByDisplayValue("joao@example.com")).toBeInTheDocument()
    })

    it("exibe erros ao tentar salvar com campos obrigatórios vazios", async () => {
        renderPage()
        await aguardarCarregamento()

        const user = userEvent.setup()

        const nomeInput = screen.getByDisplayValue("João da Silva")
        const rfInput = screen.getByDisplayValue("123456")
        const emailInput = screen.getByDisplayValue("joao@example.com")

        await user.clear(nomeInput)
        await user.clear(rfInput)
        await user.clear(emailInput)

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
        const emailInput = screen.getByDisplayValue("joao@example.com")

        await user.clear(emailInput)
        await user.type(emailInput, "email-invalido")
        await user.click(screen.getByRole("button", { name: /salvar/i }))

        await waitFor(() => {
            expect(screen.getByText("E-mail inválido")).toBeInTheDocument()
        })
    })

    it("não exige senha quando os campos estão em branco", async () => {
        renderPage()
        await aguardarCarregamento()

        const user = userEvent.setup()
        await user.click(screen.getByRole("button", { name: /salvar/i }))

        await waitFor(() => {
            expect(usuarioService.partialUpdate).toHaveBeenCalled()
        })
    })

    it("exibe erro quando a senha tem menos de 6 caracteres", async () => {
        renderPage()
        await aguardarCarregamento()

        const user = userEvent.setup()
        const senhaInput = await screen.findByPlaceholderText("Cadastre uma senha")

        await user.type(senhaInput, "a1!")
        await user.click(screen.getByRole("button", { name: /salvar/i }))

        await waitFor(() => {
            expect(
                screen.getByText("A senha deve ter no mínimo 6 caracteres")
            ).toBeInTheDocument()
        })
    })

    it("exibe erro quando a senha não tem letra", async () => {
        renderPage()
        await aguardarCarregamento()

        const user = userEvent.setup()
        const senhaInput = await screen.findByPlaceholderText("Cadastre uma senha")

        await user.type(senhaInput, "123456!")
        await user.click(screen.getByRole("button", { name: /salvar/i }))

        await waitFor(() => {
            expect(
                screen.getByText("A senha deve conter letras")
            ).toBeInTheDocument()
        })
    })

    it("exibe erro quando a senha não tem número", async () => {
        renderPage()
        await aguardarCarregamento()

        const user = userEvent.setup()
        const senhaInput = await screen.findByPlaceholderText("Cadastre uma senha")

        await user.type(senhaInput, "abcdef!")
        await user.click(screen.getByRole("button", { name: /salvar/i }))

        await waitFor(() => {
            expect(
                screen.getByText("A senha deve conter números")
            ).toBeInTheDocument()
        })
    })

    it("exibe erro quando a senha não tem caractere especial", async () => {
        renderPage()
        await aguardarCarregamento()

        const user = userEvent.setup()
        const senhaInput = await screen.findByPlaceholderText("Cadastre uma senha")

        await user.type(senhaInput, "abc123")
        await user.click(screen.getByRole("button", { name: /salvar/i }))

        await waitFor(() => {
            expect(
                screen.getByText("A senha deve conter caracteres especiais")
            ).toBeInTheDocument()
        })
    })

    it("exibe erro quando as senhas não coincidem", async () => {
        renderPage()
        await aguardarCarregamento()

        const user = userEvent.setup()
        const senhaInput = await screen.findByPlaceholderText("Cadastre uma senha")
        const confirmarSenhaInput = await screen.findByPlaceholderText("Confirme a senha")

        await user.type(senhaInput, "abc123!")
        await user.type(confirmarSenhaInput, "xyz999!")
        await user.click(screen.getByRole("button", { name: /salvar/i }))

        await waitFor(() => {
            expect(screen.getByText("As senhas não coincidem")).toBeInTheDocument()
        })
    })

    it("não exibe erros de senha quando a senha é válida e coincide", async () => {
        renderPage()
        await aguardarCarregamento()

        const user = userEvent.setup()
        const senhaInput = await screen.findByPlaceholderText("Cadastre uma senha")
        const confirmarSenhaInput = await screen.findByPlaceholderText("Confirme a senha")

        await user.type(senhaInput, "abc123!")
        await user.type(confirmarSenhaInput, "abc123!")
        await user.click(screen.getByRole("button", { name: /salvar/i }))

        await waitFor(() => {
            expect(screen.queryByText("As senhas não coincidem")).not.toBeInTheDocument()
        })
    })

    it("inclui o campo 'password' no payload quando a senha é preenchida", async () => {
        renderPage()
        await aguardarCarregamento()

        const user = userEvent.setup()
        const senhaInput = await screen.findByPlaceholderText("Cadastre uma senha")
        const confirmarSenhaInput = await screen.findByPlaceholderText("Confirme a senha")

        await user.type(senhaInput, MOCK_PASSWORD)
        await user.type(confirmarSenhaInput, MOCK_PASSWORD)
        await user.click(screen.getByRole("button", { name: /salvar/i }))

        await waitFor(() => {
            expect(usuarioService.partialUpdate).toHaveBeenCalledWith(
                1,
                expect.objectContaining({
                    password: MOCK_PASSWORD,
                    password_confirm: MOCK_PASSWORD,
                })
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
            expect(
                screen.getByText(/erro ao salvar usuário|falha ao salvar/i)
            ).toBeInTheDocument()
        })
    })

    it("navega para '/usuarios' ao clicar em 'Cancelar'", async () => {
        renderPage()
        await aguardarCarregamento()

        const user = userEvent.setup()
        await user.click(screen.getByRole("button", { name: /cancelar/i }))

        expect(screen.getByText("Lista de Usuários")).toBeInTheDocument()
    })
})
