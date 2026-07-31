import { act, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { MemoryRouter, Route, Routes } from "react-router-dom"

import EditarUsuarioPage, { getIdsUsuario, mountPayload, resolveUoInicial } from "../EditUsuarioPage"
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
    unidade_orcamentaria: 20,
    unidades_administrativas: [10],
    unidade_codigo: "UA001",
    unidade_nome: "Unidade Central",
    status: "ativo",
    status_display: "Ativo",
}

const meMock = {
    data: {
        id: 1,
        username: "admin",
        nome: "Administrador",
        email: "admin@example.com",
        rf: "000000",
        is_superuser: false,
        is_gestor_patrimonio: false,
        is_operador_inventario: false,
        must_change_password: false,
        uo_ativa: null,
        ua_ativa: null,
        opcoes_escopo: {
            grupos: [
                {
                    uo: {
                        id: 20,
                        label: "20 - UO Central",
                    },
                    uas: [
                        {
                            unidade_administrativa_id: 10,
                            unidade_orcamentaria_id: 20,
                            codigo: "UA001",
                            nome: "Unidade Central",
                        },
                        {
                            unidade_administrativa_id: 11,
                            unidade_orcamentaria_id: 20,
                            codigo: "UA002",
                            nome: "Unidade Norte",
                        },
                    ],
                },
            ],
        },
    },
    status: 200,
    statusText: "OK",
    headers: {},
    config: {},
} as Awaited<ReturnType<typeof authService.getCurrentUser>>

const meMockSemUoInicial = {
    ...meMock,
    data: {
        ...meMock.data,
        opcoes_escopo: {
            grupos: [
                {
                    uo: {
                        id: 20,
                        label: "20 - UO Central",
                    },
                    uas: [
                        {
                            unidade_administrativa_id: 10,
                            unidade_orcamentaria_id: 20,
                            codigo: "UA001",
                            nome: "Unidade Central",
                        },
                    ],
                },
                {
                    uo: {
                        id: 30,
                        label: "30 - UO Alternativa",
                    },
                    uas: [
                        {
                            unidade_administrativa_id: 40,
                            unidade_orcamentaria_id: 30,
                            codigo: "UA040",
                            nome: "Unidade Alternativa",
                        },
                    ],
                },
            ],
        },
    },
} as Awaited<ReturnType<typeof authService.getCurrentUser>>

const MOCK_PASSWORD = ["S@", "nh4", "@123!"].join("")

function createDeferred<T>() {
    let resolve!: (value: T | PromiseLike<T>) => void
    let reject!: (reason?: unknown) => void
    const promise = new Promise<T>((res, rej) => {
        resolve = res
        reject = rej
    })
    return { promise, resolve, reject }
}

function renderPage(
    id = "1",
    initialEntries = [`/usuarios/${id}/editar`],
    initialIndex = 0
) {
    return render(
        <MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex}>
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
        vi.mocked(usuarioService.partialUpdate).mockResolvedValue(usuarioMock)
    })

    it("exibe spinner de carregamento enquanto busca os dados", async () => {
        const deferred = createDeferred<typeof usuarioMock>()
        vi.mocked(usuarioService.retrieve).mockReturnValue(deferred.promise)
        renderPage()
        expect(screen.getByText("Carregando...")).toBeInTheDocument()
        await act(async () => {
            deferred.resolve(usuarioMock)
            await deferred.promise
        })
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
        expect(screen.getByText("Notificações das UAs")).toBeInTheDocument()
        expect(screen.getByText("Gestor acessa todas UAs da UO")).toBeInTheDocument()
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

    it("quando Gestor marca Todas, envia todas as UAs no payload", async () => {
        renderPage()
        await aguardarCarregamento()

        const user = userEvent.setup()
        await user.click(screen.getByRole("checkbox"))
        await user.click(screen.getByRole("button", { name: /salvar/i }))

        await waitFor(() => {
            expect(usuarioService.partialUpdate).toHaveBeenCalledWith(
                1,
                expect.objectContaining({
                    unidades_administrativas: [10, 11],
                    unidade_administrativa: 10,
                    unidade_orcamentaria: 20,
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

    it("exibe o username como campo desabilitado", async () => {
        renderPage()
        await aguardarCarregamento()

        expect(screen.getByDisplayValue("joao.silva")).toBeInTheDocument()
        // O campo de username deve existir e estar desabilitado
        const usernameInput = screen.getByDisplayValue("joao.silva") as HTMLInputElement
        expect(usernameInput).toBeDisabled()
    })

    it("exibe mensagem de erro 'Corrija os campos destacados.' quando API retorna erros de campo", async () => {
        vi.mocked(usuarioService.partialUpdate).mockRejectedValue({ response: { data: { nome: ["Campo obrigatório"] } } })

        renderPage()
        await aguardarCarregamento()

        const user = userEvent.setup()
        await user.click(screen.getByRole("button", { name: /salvar/i }))

        await waitFor(() => {
            expect(screen.getByText("Corrija os campos destacados.")).toBeInTheDocument()
        })
    })

    it("exige unidade administrativa quando o grupo for OPERADOR_INVENTARIO", async () => {
        // Mocka retorno do usuário com grupo OPERADOR_INVENTARIO e sem unidades selecionadas
        vi.mocked(usuarioService.retrieve).mockResolvedValue({ ...usuarioMock, grupo_nome: "OPERADOR_INVENTARIO", unidades_administrativas: [] })

        renderPage()
        await aguardarCarregamento()

        const user = userEvent.setup()
        await user.click(screen.getByRole("button", { name: /salvar/i }))

        await waitFor(() => {
            expect(screen.getByText("Unidade Administrativa é obrigatória para Operador")).toBeInTheDocument()
        })
    })
})

describe("helpers do EditarUsuarioPage", () => {
    const ua10 = {
        unidade_administrativa_id: 10,
        unidade_orcamentaria_id: 20,
    } as any

    const ua11 = {
        unidade_administrativa_id: 11,
        unidade_orcamentaria_id: 20,
    } as any

    const baseFormData = {
        nome: "João da Silva",
        rf: "A123456",
        email: "joao@email.com",
        grupo: "GESTOR_PATRIMONIO",
        status: "ativo",
        senha: "",
        confirmarSenha: "",
    } as any

    const valoresOriginais = {
        nome: "João da Silva",
        rf: "A123456",
        email: "joao@email.com",
        grupo: "GESTOR_PATRIMONIO",
        status: "ativo",
        unidadeIds: [10],
        unidadeOrcamentariaId: 20,
    } as NonNullable<Parameters<typeof mountPayload>[1]>

    it("getIdsUsuario prioriza a lista de unidades quando existe", () => {
        expect(getIdsUsuario({ unidades_administrativas: [10, 11], unidade_administrativa: 99 })).toEqual([10, 11])
    })

    it("getIdsUsuario usa unidade_administrativa singular como fallback", () => {
        expect(getIdsUsuario({ unidade_administrativa: 7 })).toEqual([7])
    })

    it("getIdsUsuario retorna lista vazia quando não há unidades", () => {
        expect(getIdsUsuario({})).toEqual([])
    })

    it("mountPayload não envia campos quando nada mudou", () => {
        expect(
            mountPayload(
                baseFormData,
                valoresOriginais,
                [ua10],
                [ua10],
                false,
                20
            )
        ).toEqual({})
    })

    it("mountPayload envia alterações de cadastro, status e senha", () => {
        expect(
            mountPayload(
                {
                    ...baseFormData,
                    nome: "Maria da Silva",
                    rf: "B765432",
                    email: "maria@email.com",
                    grupo: "OPERADOR_INVENTARIO",
                    status: "inativo",
                    senha: MOCK_PASSWORD,
                    confirmarSenha: MOCK_PASSWORD,
                },
                valoresOriginais,
                [ua10],
                [ua10],
                false,
                20
            )
        ).toEqual({
            nome: "Maria da Silva",
            rf: "B765432",
            email: "maria@email.com",
            group_name: "OPERADOR_INVENTARIO",
            is_active: false,
            password: MOCK_PASSWORD,
            password_confirm: MOCK_PASSWORD,
        })
    })

    it("mountPayload funciona quando não há valores originais para comparação", () => {
        expect(
            mountPayload(
                {
                    ...baseFormData,
                    nome: "Maria da Silva",
                    rf: "B765432",
                    email: "maria@email.com",
                    grupo: "OPERADOR_INVENTARIO",
                    status: "inativo",
                },
                null,
                [],
                [],
                false,
                null
            )
        ).toEqual({
            nome: "Maria da Silva",
            rf: "B765432",
            email: "maria@email.com",
            group_name: "OPERADOR_INVENTARIO",
        })
    })

    it("mountPayload envia UO vazia quando o gestor não seleciona nenhuma UA", () => {
        expect(
            mountPayload(
                baseFormData,
                valoresOriginais,
                [],
                [],
                false,
                30
            )
        ).toEqual({
            unidades_administrativas: [],
            unidade_administrativa: null,
            unidade_orcamentaria: 30,
        })
    })

    it("mountPayload envia todas as UAs quando o gestor marca todas", () => {
        expect(
            mountPayload(
                baseFormData,
                valoresOriginais,
                [ua10, ua11],
                [ua10],
                true,
                20
            )
        ).toEqual({
            unidades_administrativas: [10, 11],
            unidade_administrativa: 10,
            unidade_orcamentaria: 20,
        })
    })

    it("usa a UO da primeira unidade selecionada quando o usuário não traz unidade_orcamentaria", async () => {
        vi.mocked(usuarioService.retrieve).mockResolvedValue({
            ...usuarioMock,
            unidade_orcamentaria: null,
            unidades_administrativas: [10],
        })
        vi.mocked(authService.getCurrentUser).mockResolvedValue(meMockSemUoInicial)

        renderPage()
        await aguardarCarregamento()

        expect(screen.getAllByRole("combobox")[2]).toHaveTextContent("20 - UO Central")
    })

    it("usa a UO do primeiro grupo quando o usuário não traz UO nem unidade selecionada", async () => {
        vi.mocked(usuarioService.retrieve).mockResolvedValue({
            ...usuarioMock,
            unidade_orcamentaria: null,
            unidades_administrativas: [],
        })
        vi.mocked(authService.getCurrentUser).mockResolvedValue(meMockSemUoInicial)

        renderPage()
        await aguardarCarregamento()

        expect(screen.getAllByRole("combobox")[2]).toHaveTextContent("20 - UO Central")
    })

    it("volta para a tela anterior ao clicar no botão de retorno", async () => {
        renderPage("1", ["/usuarios", "/usuarios/1/editar"], 1)
        await aguardarCarregamento()

        const user = userEvent.setup()
        await user.click(screen.getAllByRole("button")[0])

        expect(screen.getByText("Lista de Usuários")).toBeInTheDocument()
    })

    it("alterna a visibilidade das senhas ao clicar nos botões de olho", async () => {
        renderPage()
        await aguardarCarregamento()

        const user = userEvent.setup()

        const senhaInput = screen.getByPlaceholderText("Cadastre uma senha") as HTMLInputElement
        const confirmarSenhaInput = screen.getByPlaceholderText("Confirme a senha") as HTMLInputElement

        expect(senhaInput).toHaveAttribute("type", "password")
        expect(confirmarSenhaInput).toHaveAttribute("type", "password")

        const senhaContainer = senhaInput.closest("div")?.parentElement
        const confirmarContainer = confirmarSenhaInput.closest("div")?.parentElement

        await user.click(within(senhaContainer as HTMLElement).getByRole("button"))
        await user.click(within(confirmarContainer as HTMLElement).getByRole("button"))

        expect(senhaInput).toHaveAttribute("type", "text")
        expect(confirmarSenhaInput).toHaveAttribute("type", "text")
    })
})
