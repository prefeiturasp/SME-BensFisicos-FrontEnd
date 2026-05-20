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
const mockGetCurrentUser = vi.fn()

vi.mock("../../service/usuario.service", () => ({
    usuarioService: {
        create: (...args: unknown[]) => mockUsuarioCreate(...args),
    },
}))

vi.mock("../../../../../auth/auth.service", () => ({
    authService: {
        getCurrentUser: () => mockGetCurrentUser(),
    },
}))

// ─── Dados de fixture ─────────────────────────────────────────────────────────

const TEST_PWD = ["Senha", "@", "123"].join("")

const ME_RESPONSE = {
    data: {
        id: 1,
        username: "admin",
        nome: "Admin",
        email: "admin@email.com",
        rf: "F00001",
        is_gestor_patrimonio: true,
        is_operador_inventario: false,
        must_change_password: false,
        uo_ativa: null,
        ua_ativa: null,
        opcoes_escopo: {
            grupos: [
                {
                    uo: {
                        id: 2,
                        codigo: "02.17.20",
                        nome: "UO Teste",
                        label: "02.17.20 - UO Teste",
                        selecionavel: true,
                        unidade_administrativa_id: null,
                        unidade_orcamentaria_id: 2,
                    },
                    uas: [
                        {
                            id: 1,
                            codigo: "001",
                            nome: "Secretaria de Finanças",
                            label: "001 - Secretaria de Finanças",
                            unidade_administrativa_id: 1,
                            unidade_orcamentaria_id: 2,
                        },
                        {
                            id: 2,
                            codigo: "002",
                            nome: "Secretaria de Educação",
                            label: "002 - Secretaria de Educação",
                            unidade_administrativa_id: 2,
                            unidade_orcamentaria_id: 2,
                        },
                    ],
                },
            ],
        },
    },
}

const VALID_FORM_DATA = {
    nome: "João da Silva",
    rf: "A123456",
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
 * Ordem dos selects no DOM após refatoração do layout:
 *   [0] Grupo de Permissionamento
 *   [1] Unidade Orçamentária
 *   [2] Status
 */
async function fillForm(
    overrides: Partial<typeof VALID_FORM_DATA> = {},
    grupo = "GESTOR_PATRIMONIO",
    unidadeId = "1"
) {
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

    const selects = screen.getAllByRole("combobox")
    fireEvent.change(selects[0], { target: { value: grupo } })       // Grupo

    if (unidadeId) {
        fireEvent.change(selects[1], { target: { value: "2" } }) // Unidade Orçamentária

        await waitFor(() => {
            expect(screen.getByText("001 - Secretaria de Finanças")).toBeInTheDocument()
        })

        fireEvent.click(screen.getByText("001 - Secretaria de Finanças"))
    }
}

// ─── Testes ───────────────────────────────────────────────────────────────────

describe("AdicionarUsuarioPage", () => {

    beforeEach(() => {
        vi.clearAllMocks()
        mockGetCurrentUser.mockResolvedValue(ME_RESPONSE)
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
            expect(screen.getByText("Unidades Administrativas")).toBeInTheDocument()
            expect(screen.getByText("Cadastre uma Senha")).toBeInTheDocument()
            expect(screen.getByText("Confirme a Senha")).toBeInTheDocument()
            expect(screen.getByText("Status")).toBeInTheDocument()
        })

        it("não exibe mensagem de erro inicialmente", () => {
            renderComponent()

            expect(screen.queryByText(/erro/i)).not.toBeInTheDocument()
        })
    })

    // ── Obrigatoriedade condicional da Unidade Administrativa ─────────────────

    describe("unidade administrativa — obrigatoriedade condicional", () => {

        it("exibe asterisco na unidade quando grupo é Operador", () => {
            renderComponent()

            const selects = screen.getAllByRole("combobox")
            fireEvent.change(selects[0], { target: { value: "OPERADOR_INVENTARIO" } })

            const unidadeLabel = screen.getByText("Unidades Administrativas").closest("label")
            expect(unidadeLabel?.querySelector("span")?.textContent).toBe("*")
        })

        it("Gestor: aceita formulário sem unidade selecionada", async () => {
            renderComponent()
            await waitFor(() => expect(mockGetCurrentUser).toHaveBeenCalled())

            await fillForm({}, "GESTOR_PATRIMONIO", "")
            fireEvent.click(screen.getByText("Salvar"))

            await waitFor(() => {
                expect(mockUsuarioCreate).toHaveBeenCalled()
            })
        })

        it("Operador: exibe erro quando unidade não é selecionada", async () => {
            renderComponent()
            await waitFor(() => expect(mockGetCurrentUser).toHaveBeenCalled())

            await fillForm({}, "OPERADOR_INVENTARIO", "")
            fireEvent.click(screen.getByText("Salvar"))

            await waitFor(() => {
                expect(
                    screen.getByText("Unidade Administrativa é obrigatória para Operadores")
                ).toBeInTheDocument()
            })

            expect(mockUsuarioCreate).not.toHaveBeenCalled()
        })

        it("Operador: aceita formulário com unidade selecionada", async () => {
            renderComponent()
            await waitFor(() => expect(mockGetCurrentUser).toHaveBeenCalled())

            await fillForm({}, "OPERADOR_INVENTARIO", "1")
            fireEvent.click(screen.getByText("Salvar"))

            await waitFor(() => {
                expect(mockUsuarioCreate).toHaveBeenCalledWith(
                    expect.objectContaining({ group_name: "OPERADOR_INVENTARIO" })
                )
            })
        })

        it("limpa a unidade selecionada ao trocar o grupo", () => {
            renderComponent()

            const selects = screen.getAllByRole("combobox")

            // Seleciona operador e uma unidade orçamentária
            fireEvent.change(selects[0], { target: { value: "OPERADOR_INVENTARIO" } })
            fireEvent.change(selects[1], { target: { value: "2" } })

            return waitFor(() => {
                fireEvent.click(screen.getByText("001 - Secretaria de Finanças"))
                fireEvent.change(selects[0], { target: { value: "GESTOR_PATRIMONIO" } })
                expect(screen.getByText("Nenhuma selecionada")).toBeInTheDocument()
            })
        })
    })

    // ── Carregamento de unidades ──────────────────────────────────────────────

    describe("carregamento de unidades administrativas", () => {

        it("carrega e exibe as unidades do escopo na lista", async () => {
            renderComponent()
            const selects = screen.getAllByRole("combobox")
            fireEvent.change(selects[1], { target: { value: "2" } })

            await waitFor(() => {
                expect(
                    screen.getByText("001 - Secretaria de Finanças")
                ).toBeInTheDocument()
            })
        })

        it("exibe o código e nome da UA na opção", async () => {
            renderComponent()
            const selects = screen.getAllByRole("combobox")
            fireEvent.change(selects[1], { target: { value: "2" } })

            await waitFor(() => {
                expect(
                    screen.getByText("001 - Secretaria de Finanças")
                ).toBeInTheDocument()
            })
        })

        it("exibe todas as UAs retornadas pelo escopo", async () => {
            renderComponent()
            const selects = screen.getAllByRole("combobox")
            fireEvent.change(selects[1], { target: { value: "2" } })

            await waitFor(() => {
                expect(
                    screen.getByText("001 - Secretaria de Finanças")
                ).toBeInTheDocument()
                expect(
                    screen.getByText("002 - Secretaria de Educação")
                ).toBeInTheDocument()
            })
        })

        it("exibe select vazio quando o escopo não tem UAs", async () => {
            mockGetCurrentUser.mockResolvedValue({
                data: { ...ME_RESPONSE.data, opcoes_escopo: { grupos: [] } },
            })

            renderComponent()

            await waitFor(() => expect(mockGetCurrentUser).toHaveBeenCalled())

            const selects = screen.getAllByRole("combobox")
            const options = selects[1].querySelectorAll("option")
            expect(options).toHaveLength(1)
        })

        it("não lança erro quando o carregamento do escopo falha", async () => {
            mockGetCurrentUser.mockRejectedValue(new Error("Falha na API"))

            expect(() => renderComponent()).not.toThrow()
        })

        it("exibe select vazio quando opcoes_escopo é null", async () => {
            mockGetCurrentUser.mockResolvedValue({
                data: { ...ME_RESPONSE.data, opcoes_escopo: null },
            })

            renderComponent()

            await waitFor(() => expect(mockGetCurrentUser).toHaveBeenCalled())

            const selects = screen.getAllByRole("combobox")
            const options = selects[1].querySelectorAll("option")
            expect(options).toHaveLength(1)
        })
    })

    // ── Visibilidade da senha ─────────────────────────────────────────────────

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

        it("chama usuarioService.create com o payload correto (Gestor)", async () => {
            renderComponent()
            await waitFor(() => expect(mockGetCurrentUser).toHaveBeenCalled())

            await fillForm({}, "GESTOR_PATRIMONIO", "1")
            fireEvent.click(screen.getByText("Salvar"))

            await waitFor(() => {
                expect(mockUsuarioCreate).toHaveBeenCalledWith(
                    expect.objectContaining({
                        username: "joao.silva",
                        nome: "João da Silva",
                        email: "joao@email.com",
                        rf: "A123456",
                        unidade_administrativa: 1,
                        unidade_orcamentaria: 2,
                        group_name: "GESTOR_PATRIMONIO",
                        password: TEST_PWD,
                        password_confirm: TEST_PWD,
                        is_active: true,
                    })
                )
            })
        })

        it("chama usuarioService.create com o payload correto (Operador)", async () => {
            renderComponent()
            await waitFor(() => expect(mockGetCurrentUser).toHaveBeenCalled())

            await fillForm({}, "OPERADOR_INVENTARIO", "1")
            fireEvent.click(screen.getByText("Salvar"))

            await waitFor(() => {
                expect(mockUsuarioCreate).toHaveBeenCalledWith(
                    expect.objectContaining({
                        group_name: "OPERADOR_INVENTARIO",
                        unidade_administrativa: 1,
                    })
                )
            })
        })

        it("envia is_active=false quando status é 'inativo'", async () => {
            renderComponent()
            await waitFor(() => expect(mockGetCurrentUser).toHaveBeenCalled())

            await fillForm({}, "GESTOR_PATRIMONIO", "1")

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
            await waitFor(() => expect(mockGetCurrentUser).toHaveBeenCalled())

            await fillForm()
            fireEvent.click(screen.getByText("Salvar"))

            await waitFor(() => {
                expect(navigateMock).toHaveBeenCalledWith("/usuarios")
            })
        })

        it("exibe 'Salvando...' durante a requisição", async () => {
            mockUsuarioCreate.mockReturnValue(new Promise(() => {}))

            renderComponent()
            await waitFor(() => expect(mockGetCurrentUser).toHaveBeenCalled())

            await fillForm()
            fireEvent.click(screen.getByText("Salvar"))

            await waitFor(() => {
                expect(screen.getByText("Salvando...")).toBeInTheDocument()
            })
        })

        it("desabilita o botão Salvar durante a requisição", async () => {
            mockUsuarioCreate.mockReturnValue(new Promise(() => {}))

            renderComponent()
            await waitFor(() => expect(mockGetCurrentUser).toHaveBeenCalled())

            await fillForm()
            fireEvent.click(screen.getByText("Salvar"))

            await waitFor(() => {
                expect(screen.getByText("Salvando...")).toBeDisabled()
            })
        })

        it("reabilita o botão Salvar após a requisição concluir", async () => {
            renderComponent()
            await waitFor(() => expect(mockGetCurrentUser).toHaveBeenCalled())

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
            await waitFor(() => expect(mockGetCurrentUser).toHaveBeenCalled())

            await fillForm()
            fireEvent.click(screen.getByText("Salvar"))

            await waitFor(() => {
                expect(screen.getByText("Erro ao criar usuário")).toBeInTheDocument()
            })
        })

        it("exibe mensagem padrão quando há erro de validação da API (response.data)", async () => {
            const apiError = new Error("Erro de validação")
            ;(apiError as any).response = { data: { username: ["Já existe."] } }
            mockUsuarioCreate.mockRejectedValue(apiError)

            renderComponent()
            await waitFor(() => expect(mockGetCurrentUser).toHaveBeenCalled())

            await fillForm()
            fireEvent.click(screen.getByText("Salvar"))

            await waitFor(() => {
                expect(
                    screen.getByText("Corrija os campos destacados.")
                ).toBeInTheDocument()
            })
        })

        it("limpa a mensagem de erro ao resubmeter o formulário", async () => {
            mockUsuarioCreate
                .mockRejectedValueOnce(new Error("Erro ao criar usuário"))
                .mockResolvedValueOnce({ id: 1 })

            renderComponent()
            await waitFor(() => expect(mockGetCurrentUser).toHaveBeenCalled())

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
            await waitFor(() => expect(mockGetCurrentUser).toHaveBeenCalled())

            await fillForm()
            fireEvent.click(screen.getByText("Salvar"))

            await waitFor(() => {
                expect(screen.getByText("Salvar")).not.toBeDisabled()
            })
        })

        it("não navega quando o serviço retorna erro", async () => {
            mockUsuarioCreate.mockRejectedValue(new Error("Falha"))

            renderComponent()
            await waitFor(() => expect(mockGetCurrentUser).toHaveBeenCalled())

            await fillForm()
            fireEvent.click(screen.getByText("Salvar"))

            await waitFor(() => {
                expect(screen.getByText("Falha")).toBeInTheDocument()
            })

            expect(navigateMock).not.toHaveBeenCalledWith("/usuarios")
        })
    })
})
