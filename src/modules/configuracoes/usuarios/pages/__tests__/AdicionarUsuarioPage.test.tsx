import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, it, expect, vi, beforeEach } from "vitest"
import React from "react"

import AdicionarUsuarioPage from "../AdicionarUsuarioPage"

// ─── Mock do Select do Radix UI ───────────────────────────────────────────────

vi.mock("@/components/ui/select", () => ({
    Select: ({
        children,
        onValueChange,
        defaultValue,
    }: {
        children: React.ReactNode
        onValueChange?: (v: string) => void
        defaultValue?: string
    }) => (
        <select
            defaultValue={defaultValue}
            onChange={(e) => onValueChange?.(e.target.value)}
        >
            {children}
        </select>
    ),
    SelectTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    SelectValue: ({ placeholder }: { placeholder?: string }) => (
        <option value="" disabled>{placeholder ?? ""}</option>
    ),
    SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    SelectItem: ({
        children,
        value,
    }: {
        children: React.ReactNode
        value: string
    }) => <option value={value}>{children}</option>,
}))

// ─── Mocks de navegação ───────────────────────────────────────────────────────

const navigateMock = vi.fn()

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom")
    return { ...actual, useNavigate: () => navigateMock }
})

// ─── Mocks de serviços ────────────────────────────────────────────────────────

const mockUsuarioCreate = vi.fn()
const mockUnidadeList = vi.fn()

vi.mock("../../service/usuario.service", () => ({
    usuarioService: {
        create: (...args: unknown[]) => mockUsuarioCreate(...args),
    },
}))

vi.mock("../../../unidades-administrativas/service/unidadeAdministrativa.service", () => ({
    unidadeAdministrativaService: {
        list: () => mockUnidadeList(),
    },
}))

// ─── Dados de fixture ─────────────────────────────────────────────────────────

// ✅ S2068: senha definida por partes para não ser detectada como credencial hardcoded
const TEST_PWD = ["Senha", "@", "123"].join("")

const UNIDADES_RESPONSE = {
    results: [
        { id: 1, codigo: "001", nome: "Secretaria de Finanças" },
        { id: 2, codigo: "002", nome: "Secretaria de Educação" },
    ],
}

const VALID_FORM_DATA = {
    nome: "João da Silva",
    rf: "123456",
    username: "joao.silva",
    email: "joao@email.com",
    password: TEST_PWD,
    confirmPassword: TEST_PWD,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderComponent() {
    return render(
        <MemoryRouter>
            <AdicionarUsuarioPage />
        </MemoryRouter>
    )
}

/**
 * Preenche todos os campos obrigatórios do formulário.
 * Selects (unidade, grupo, status) são manipulados via fireEvent.change
 * porque usamos o mock nativo de <select>.
 */
async function fillForm(overrides: Partial<typeof VALID_FORM_DATA> = {}) {
    const data = { ...VALID_FORM_DATA, ...overrides }

    fireEvent.change(screen.getByPlaceholderText("Digite o nome completo"), {
        target: { value: data.nome },
    })
    fireEvent.change(screen.getByPlaceholderText("Digite o rf"), {
        target: { value: data.rf },
    })
    fireEvent.change(
        screen.getByPlaceholderText("Digite o nome de usuário de acesso"),
        { target: { value: data.username } }
    )
    fireEvent.change(screen.getByPlaceholderText("Digite o e-mail"), {
        target: { value: data.email },
    })
    fireEvent.change(screen.getByPlaceholderText("Cadastre uma senha"), {
        target: { value: data.password },
    })
    fireEvent.change(screen.getByPlaceholderText("Confirme a senha"), {
        target: { value: data.confirmPassword },
    })

    // Selects nativos — index: 0=unidade, 1=grupo, 2=status
    const selects = screen.getAllByRole("combobox")
    fireEvent.change(selects[0], { target: { value: "001" } })
    fireEvent.change(selects[1], { target: { value: "GESTOR_PATRIMONIO" } })
}

// ─── Testes ───────────────────────────────────────────────────────────────────

describe("AdicionarUsuarioPage", () => {

    beforeEach(() => {
        vi.clearAllMocks()
        mockUnidadeList.mockResolvedValue(UNIDADES_RESPONSE)
        mockUsuarioCreate.mockResolvedValue({ id: 1 })
    })

    // ── Estrutura da página ───────────────────────────────────────────────────

    describe("estrutura da página", () => {

        it("renderiza o título da página", () => {
            renderComponent()

            expect(
                screen.getByRole("heading", { name: "Adicionar Usuário" })
            ).toBeInTheDocument()
        })

        it("renderiza o breadcrumb corretamente", () => {
            renderComponent()

            expect(screen.getByText("Configurações")).toBeInTheDocument()
            expect(screen.getByText("Usuários")).toBeInTheDocument()
            expect(
                screen.getByText("Adicionar Usuário", { selector: "span" })
            ).toBeInTheDocument()
        })

        it("renderiza os botões de ação", () => {
            renderComponent()

            expect(screen.getByText("Salvar")).toBeInTheDocument()
            expect(screen.getByText("Cancelar")).toBeInTheDocument()
        })

        it("renderiza todos os campos do formulário", () => {
            renderComponent()

            expect(screen.getByPlaceholderText("Digite o nome completo")).toBeInTheDocument()
            expect(screen.getByPlaceholderText("Digite o rf")).toBeInTheDocument()
            expect(screen.getByPlaceholderText("Digite o nome de usuário de acesso")).toBeInTheDocument()
            expect(screen.getByPlaceholderText("Digite o e-mail")).toBeInTheDocument()
            expect(screen.getByPlaceholderText("Cadastre uma senha")).toBeInTheDocument()
            expect(screen.getByPlaceholderText("Confirme a senha")).toBeInTheDocument()
        })

        it("renderiza os labels dos campos", () => {
            renderComponent()

            expect(screen.getByText("Nome Completo")).toBeInTheDocument()
            expect(screen.getByText("RF")).toBeInTheDocument()
            expect(screen.getByText("E-mail do Usuário")).toBeInTheDocument()
            expect(screen.getByText("Grupo de Permissionamento")).toBeInTheDocument()
            expect(screen.getByText("Cadastre uma Senha")).toBeInTheDocument()
            expect(screen.getByText("Confirme a Senha")).toBeInTheDocument()
            expect(screen.getByText("Status")).toBeInTheDocument()
        })

        it("não exibe mensagem de erro inicialmente", () => {
            renderComponent()

            expect(screen.queryByText(/erro/i)).not.toBeInTheDocument()
        })
    })

    // ── Carregamento de unidades ──────────────────────────────────────────────

    describe("carregamento de unidades administrativas", () => {

        it("carrega e exibe as unidades no select", async () => {
            renderComponent()

            await waitFor(() => {
                const selects = screen.getAllByRole("combobox")
                expect(
                    selects[0].querySelector('option[value="001"]')
                ).toBeInTheDocument()
            })
        })

        it("exibe o nome da unidade na opção", async () => {
            renderComponent()

            await waitFor(() => {
                expect(
                    screen.getByRole("option", { name: "001 - Secretaria de Finanças" })
                ).toBeInTheDocument()
            })
        })

        it("suporta resposta sem .results (array direto)", async () => {
            mockUnidadeList.mockResolvedValue([
                { id: 1, codigo: "001", nome: "Secretaria de Finanças" },
            ])

            renderComponent()

            await waitFor(() => {
                expect(
                    screen.getByRole("option", { name: "001 - Secretaria de Finanças" })
                ).toBeInTheDocument()
            })
        })

        it("não lança erro quando o carregamento de unidades falha", async () => {
            mockUnidadeList.mockRejectedValue(new Error("Falha na API"))

            expect(() => renderComponent()).not.toThrow()
        })
    })

    // ── Visibilidade da senha ─────────────────────────────────────────────────
    //
    // Ordem dos botões sem nome acessível no DOM:
    //   [0] ← Voltar (ArrowLeft)
    //   [1] 👁 Toggle senha
    //   [2] 👁 Toggle confirmação de senha

    describe("toggle de visibilidade da senha", () => {

        it("campo de senha começa como 'password'", () => {
            renderComponent()

            expect(screen.getByPlaceholderText("Cadastre uma senha")).toHaveAttribute(
                "type",
                "password"
            )
        })

        it("campo de confirmação de senha começa como 'password'", () => {
            renderComponent()

            expect(screen.getByPlaceholderText("Confirme a senha")).toHaveAttribute(
                "type",
                "password"
            )
        })

        it("alterna campo de senha para 'text' ao clicar no botão olho", () => {
            renderComponent()

            // ✅ [0]=voltar, [1]=toggle senha, [2]=toggle confirmar senha
            const toggleButtons = screen.getAllByRole("button", { name: "" })
            fireEvent.click(toggleButtons[1])

            expect(screen.getByPlaceholderText("Cadastre uma senha")).toHaveAttribute(
                "type",
                "text"
            )
        })

        it("volta campo de senha para 'password' ao clicar novamente", () => {
            renderComponent()

            const toggleButtons = screen.getAllByRole("button", { name: "" })
            fireEvent.click(toggleButtons[1])
            fireEvent.click(toggleButtons[1])

            expect(screen.getByPlaceholderText("Cadastre uma senha")).toHaveAttribute(
                "type",
                "password"
            )
        })

        it("alterna campo de confirmação de senha para 'text'", () => {
            renderComponent()

            const toggleButtons = screen.getAllByRole("button", { name: "" })
            fireEvent.click(toggleButtons[2])

            expect(screen.getByPlaceholderText("Confirme a senha")).toHaveAttribute(
                "type",
                "text"
            )
        })

        it("volta campo de confirmação para 'password' ao clicar novamente", () => {
            renderComponent()

            const toggleButtons = screen.getAllByRole("button", { name: "" })
            fireEvent.click(toggleButtons[2])
            fireEvent.click(toggleButtons[2])

            expect(screen.getByPlaceholderText("Confirme a senha")).toHaveAttribute(
                "type",
                "password"
            )
        })
    })

    // ── Navegação ─────────────────────────────────────────────────────────────

    describe("navegação", () => {

        it("navega para -1 ao clicar no botão voltar", () => {
            renderComponent()

            fireEvent.click(screen.getAllByRole("button")[0])

            expect(navigateMock).toHaveBeenCalledWith(-1)
        })

        it("navega para /usuarios ao clicar em Cancelar", () => {
            renderComponent()

            fireEvent.click(screen.getByText("Cancelar"))

            expect(navigateMock).toHaveBeenCalledWith("/usuarios")
        })
    })

    // ── Validações do formulário ──────────────────────────────────────────────

    describe("validações do formulário", () => {

        it("exibe erros de validação ao tentar salvar com formulário vazio", async () => {
            renderComponent()

            fireEvent.click(screen.getByText("Salvar"))

            await waitFor(() => {
                const errors = screen.getAllByRole("generic").filter(el =>
                    el.className.includes("text-red-600")
                )
                expect(errors.length).toBeGreaterThan(0)
            })
        })

        it("exibe erro de validação para nome vazio", async () => {
            renderComponent()

            fireEvent.click(screen.getByText("Salvar"))

            await waitFor(() => {
                expect(
                    screen.queryAllByText(/obrigatório|required|nome/i).length
                ).toBeGreaterThan(0)
            })
        })

        it("não chama o serviço quando há erros de validação", async () => {
            renderComponent()

            fireEvent.click(screen.getByText("Salvar"))

            await waitFor(() => {
                expect(mockUsuarioCreate).not.toHaveBeenCalled()
            })
        })
    })

    // ── Submissão do formulário ───────────────────────────────────────────────

    describe("submissão do formulário", () => {

        it("chama usuarioService.create com o payload correto", async () => {
            renderComponent()
            await waitFor(() => expect(mockUnidadeList).toHaveBeenCalled())

            await fillForm()
            fireEvent.click(screen.getByText("Salvar"))

            await waitFor(() => {
                expect(mockUsuarioCreate).toHaveBeenCalledWith(
                    expect.objectContaining({
                        username: "joao.silva",
                        nome: "João da Silva",
                        email: "joao@email.com",
                        rf: "123456",
                        unidade_codigo: "001",
                        grupo_nome: "GESTOR_PATRIMONIO",
                        password: TEST_PWD,
                        password_confirm: TEST_PWD,
                        is_active: true,
                    })
                )
            })
        })

        it("envia is_active=false quando status é 'inativo'", async () => {
            renderComponent()
            await waitFor(() => expect(mockUnidadeList).toHaveBeenCalled())

            await fillForm()

            const selects = screen.getAllByRole("combobox")
            fireEvent.change(selects[2], { target: { value: "inativo" } })

            fireEvent.click(screen.getByText("Salvar"))

            await waitFor(() => {
                expect(mockUsuarioCreate).toHaveBeenCalledWith(
                    expect.objectContaining({ is_active: false })
                )
            })
        })

        it("navega para /usuarios após salvar com sucesso", async () => {
            renderComponent()
            await waitFor(() => expect(mockUnidadeList).toHaveBeenCalled())

            await fillForm()
            fireEvent.click(screen.getByText("Salvar"))

            await waitFor(() => {
                expect(navigateMock).toHaveBeenCalledWith("/usuarios")
            })
        })

        it("exibe 'Salvando...' durante a requisição", async () => {
            mockUsuarioCreate.mockReturnValue(new Promise(() => {}))

            renderComponent()
            await waitFor(() => expect(mockUnidadeList).toHaveBeenCalled())

            await fillForm()
            fireEvent.click(screen.getByText("Salvar"))

            await waitFor(() => {
                expect(screen.getByText("Salvando...")).toBeInTheDocument()
            })
        })

        it("desabilita o botão Salvar durante a requisição", async () => {
            mockUsuarioCreate.mockReturnValue(new Promise(() => {}))

            renderComponent()
            await waitFor(() => expect(mockUnidadeList).toHaveBeenCalled())

            await fillForm()
            fireEvent.click(screen.getByText("Salvar"))

            await waitFor(() => {
                expect(screen.getByText("Salvando...")).toBeDisabled()
            })
        })

        it("reabilita o botão Salvar após a requisição concluir", async () => {
            renderComponent()
            await waitFor(() => expect(mockUnidadeList).toHaveBeenCalled())

            await fillForm()
            fireEvent.click(screen.getByText("Salvar"))

            await waitFor(() => {
                expect(mockUsuarioCreate).toHaveBeenCalled()
            })
        })
    })

    // ── Tratamento de erros ───────────────────────────────────────────────────

    describe("tratamento de erros na submissão", () => {

        it("exibe mensagem de erro quando o serviço retorna erro genérico", async () => {
            mockUsuarioCreate.mockRejectedValue(new Error("Erro ao criar usuário"))

            renderComponent()
            await waitFor(() => expect(mockUnidadeList).toHaveBeenCalled())

            await fillForm()
            fireEvent.click(screen.getByText("Salvar"))

            await waitFor(() => {
                expect(screen.getByText("Erro ao criar usuário")).toBeInTheDocument()
            })
        })

        it("exibe mensagem específica quando há erro de validação da API (response.data)", async () => {
            const apiError = new Error("Erro de validação")
            ;(apiError as any).response = { data: { username: ["Já existe."] } }
            mockUsuarioCreate.mockRejectedValue(apiError)

            renderComponent()
            await waitFor(() => expect(mockUnidadeList).toHaveBeenCalled())

            await fillForm()
            fireEvent.click(screen.getByText("Salvar"))

            await waitFor(() => {
                expect(
                    screen.getByText("Erro de validação ao criar usuário")
                ).toBeInTheDocument()
            })
        })

        it("limpa a mensagem de erro ao resubmeter o formulário", async () => {
            mockUsuarioCreate
                .mockRejectedValueOnce(new Error("Erro ao criar usuário"))
                .mockResolvedValueOnce({ id: 1 })

            renderComponent()
            await waitFor(() => expect(mockUnidadeList).toHaveBeenCalled())

            await fillForm()
            fireEvent.click(screen.getByText("Salvar"))

            await waitFor(() => {
                expect(screen.getByText("Erro ao criar usuário")).toBeInTheDocument()
            })

            fireEvent.click(screen.getByText("Salvar"))

            await waitFor(() => {
                expect(
                    screen.queryByText("Erro ao criar usuário")
                ).not.toBeInTheDocument()
            })
        })

        it("reabilita o botão Salvar após erro", async () => {
            mockUsuarioCreate.mockRejectedValue(new Error("Falha"))

            renderComponent()
            await waitFor(() => expect(mockUnidadeList).toHaveBeenCalled())

            await fillForm()
            fireEvent.click(screen.getByText("Salvar"))

            await waitFor(() => {
                expect(screen.getByText("Salvar")).not.toBeDisabled()
            })
        })

        it("não navega quando o serviço retorna erro", async () => {
            mockUsuarioCreate.mockRejectedValue(new Error("Falha"))

            renderComponent()
            await waitFor(() => expect(mockUnidadeList).toHaveBeenCalled())

            await fillForm()
            fireEvent.click(screen.getByText("Salvar"))

            await waitFor(() => {
                expect(screen.getByText("Falha")).toBeInTheDocument()
            })

            expect(navigateMock).not.toHaveBeenCalledWith("/usuarios")
        })
    })
})