import { render, screen, fireEvent, within, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, it, expect, vi, beforeEach } from "vitest"
import React from "react"

import UsuariosListPage from "../UsuariosListPage"
import type { Usuario } from "../../service/usuario.service"

// ─── Mock do Select do Radix UI ───────────────────────────────────────────────

vi.mock("@/components/ui/select", () => ({
    Select: ({
        children,
        value,
        onValueChange,
    }: {
        children: React.ReactNode
        value: string
        onValueChange: (v: string) => void
    }) => (
        <select
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
        >
            {children}
        </select>
    ),
    SelectTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    SelectValue: () => null,
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

// ─── Mocks dos hooks e serviços ───────────────────────────────────────────────

const setPageMock = vi.fn()
const setSearchInputMock = vi.fn()
const setUnidadeFilterMock = vi.fn()
const setUoFilterMock = vi.fn()
const setGrupoFilterMock = vi.fn()
const setStatusFilterMock = vi.fn()
const setOrderingMock = vi.fn()
const mockGetCurrentUser = vi.fn()

const DEFAULT_HOOK_VALUES = {
    usuarios: [] as Usuario[],
    page: 1,
    count: 0,
    loading: false,
    searchInput: "",
    unidadeFilter: "todas",
    uoFilter: "todas",
    grupoFilter: "todos",
    statusFilter: "todos",
    setPage: setPageMock,
    setSearchInput: setSearchInputMock,
    setUnidadeFilter: setUnidadeFilterMock,
    setUoFilter: setUoFilterMock,
    setGrupoFilter: setGrupoFilterMock,
    setStatusFilter: setStatusFilterMock,
    setOrdering: setOrderingMock,
}

let hookOverrides: Partial<typeof DEFAULT_HOOK_VALUES> = {}

vi.mock("../../hooks/useUsuariosList", () => ({
    useUsuariosList: () => ({ ...DEFAULT_HOOK_VALUES, ...hookOverrides }),
}))

vi.mock("../../hooks/usePagination", () => ({
    usePagination: vi.fn(() => ({
        pages: [{ type: "page", value: 1, id: "page-1" }],
        totalPages: 1,
    })),
}))

vi.mock("../../../../../auth/auth.service", () => ({
    authService: {
        getCurrentUser: () => mockGetCurrentUser(),
    },
}))

// ─── Dados de fixture ─────────────────────────────────────────────────────────

const USUARIO_FIXTURE: Usuario = {
    id: 1,
    username: "joao",
    nome: "João da Silva",
    rf: "F123456",
    email: "joao@example.com",
    unidade_codigo: "001",
    unidade_nome: "Secretaria Teste",
    unidade_orcamentaria: 2,
    unidade_orcamentaria_codigo: "02.17.20",
    unidade_orcamentaria_nome: "UO Teste",
    grupo_nome: "GESTOR_PATRIMONIO",
    status: "ativo",
    status_display: "Ativo",
}

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
                            nome: "Secretaria Teste",
                            label: "001 - Secretaria Teste",
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderComponent() {
    return render(
        <MemoryRouter>
            <UsuariosListPage />
        </MemoryRouter>
    )
}

function resolveOrdering(previousValue: string): string {
    const updaterFn: (prev: string) => string = setOrderingMock.mock.calls[0][0]
    return updaterFn(previousValue)
}

async function overridePagination(
    pages: { type: string; value?: number; id: string }[],
    totalPages: number
) {
    const { usePagination } = vi.mocked(await import("../../hooks/usePagination"))
    usePagination.mockReturnValue({ pages: pages as any, totalPages })
}

// ─── Testes ───────────────────────────────────────────────────────────────────

describe("UsuariosListPage", () => {

    beforeEach(() => {
        vi.clearAllMocks()
        hookOverrides = {}
        mockGetCurrentUser.mockResolvedValue(ME_RESPONSE)
    })

    // ── Estrutura da página ───────────────────────────────────────────────────

    describe("estrutura da página", () => {

        it("renderiza o título da página", () => {
            renderComponent()

            expect(
                screen.getByRole("heading", { name: "Usuários" })
            ).toBeInTheDocument()
        })

        it("renderiza o breadcrumb com 'Configurações' e 'Usuários'", () => {
            renderComponent()

            expect(screen.getByText("Configurações")).toBeInTheDocument()
            expect(
                screen.getByText("Usuários", { selector: "span" })
            ).toBeInTheDocument()
        })

        it("renderiza os botões principais", () => {
            renderComponent()

            expect(screen.getByText("Relatório")).toBeInTheDocument()
            expect(screen.getByText("Adicionar Usuário")).toBeInTheDocument()
        })

        it("renderiza os campos de filtro", () => {
            renderComponent()

            expect(
                screen.getByPlaceholderText("Digite o nome do usuário")
            ).toBeInTheDocument()
            expect(
                screen.getByText("Filtrar por Unidade Administrativa")
            ).toBeInTheDocument()
            expect(
                screen.getByText("Filtrar por Grupo de Permissionamento")
            ).toBeInTheDocument()
            expect(screen.getByText("Filtrar por Status")).toBeInTheDocument()
        })

        it("renderiza os cabeçalhos da tabela", () => {
            renderComponent()

            expect(screen.getByText("ID")).toBeInTheDocument()
            expect(screen.getByText("Usuário")).toBeInTheDocument()
            expect(screen.getByText("Nome do Usuário")).toBeInTheDocument()
            expect(screen.getByText("Unidade Orçamentária")).toBeInTheDocument()
            expect(screen.getByText("Grupo de Permissionamento")).toBeInTheDocument()
            expect(screen.getByText("Status")).toBeInTheDocument()
            expect(screen.getByText("Ações")).toBeInTheDocument()
        })
    })

    // ── Estado de loading ─────────────────────────────────────────────────────

    describe("estado de loading", () => {

        it("exibe 'Carregando...' quando loading é true", () => {
            hookOverrides = { loading: true }

            renderComponent()

            expect(screen.getByText("Carregando...")).toBeInTheDocument()
        })

        it("não exibe 'Carregando...' quando loading é false", () => {
            hookOverrides = { loading: false }

            renderComponent()

            expect(screen.queryByText("Carregando...")).not.toBeInTheDocument()
        })
    })

    // ── Tabela de usuários ────────────────────────────────────────────────────

    describe("tabela de usuários", () => {

        beforeEach(() => {
            hookOverrides = { usuarios: [USUARIO_FIXTURE] }
        })

        it("renderiza o username do usuário", () => {
            renderComponent()

            expect(screen.getByText("joao")).toBeInTheDocument()
        })

        it("renderiza o nome completo do usuário", () => {
            renderComponent()

            expect(screen.getByText("João da Silva")).toBeInTheDocument()
        })

        it("renderiza a unidade no formato 'codigo - nome'", () => {
            renderComponent()

            expect(screen.getByText("02.17.20 - UO Teste")).toBeInTheDocument()
        })

        it("renderiza o nome do grupo", () => {
            renderComponent()

            expect(screen.getByText("GESTOR_PATRIMONIO")).toBeInTheDocument()
        })

        it("renderiza o status_display do usuário", () => {
            renderComponent()

            const rows = screen.getAllByRole("row")
            expect(within(rows[1]).getByText("Ativo")).toBeInTheDocument()
        })

        it("renderiza o botão de detalhar para cada usuário", () => {
            renderComponent()

            const rows = screen.getAllByRole("row")
            const actionCell = within(rows[1]).getByRole("button")
            expect(actionCell).toBeInTheDocument()
        })

        it("renderiza lista vazia quando não há usuários", () => {
            hookOverrides = { usuarios: [] }
            renderComponent()

            const rows = screen.getAllByRole("row")
            expect(rows).toHaveLength(1)
        })

        it("renderiza múltiplos usuários", () => {
            hookOverrides = {
                usuarios: [
                    USUARIO_FIXTURE,
                    { ...USUARIO_FIXTURE, id: 2, username: "maria", nome: "Maria Souza" },
                ],
            }
            renderComponent()

            expect(screen.getByText("joao")).toBeInTheDocument()
            expect(screen.getByText("maria")).toBeInTheDocument()
        })

        it("navega para /usuarios/:id ao clicar no botão de detalhar", () => {
            renderComponent()

            const rows = screen.getAllByRole("row")
            const actionButton = within(rows[1]).getByRole("button")
            fireEvent.click(actionButton)

            expect(navigateMock).toHaveBeenCalledWith("/usuarios/1")
        })
    })

    // ── Navegação ─────────────────────────────────────────────────────────────

    describe("navegação", () => {

        it("navega para -1 ao clicar no botão voltar", () => {
            renderComponent()

            fireEvent.click(screen.getAllByRole("button")[0])

            expect(navigateMock).toHaveBeenCalledWith(-1)
        })

        it("navega para /usuarios/novo ao clicar em 'Adicionar Usuário'", () => {
            renderComponent()

            fireEvent.click(screen.getByText("Adicionar Usuário"))

            expect(navigateMock).toHaveBeenCalledWith("/usuarios/novo")
        })
    })

    // ── Campo de busca ────────────────────────────────────────────────────────

    describe("campo de busca", () => {

        it("chama setSearchInput ao digitar no campo", () => {
            renderComponent()

            const input = screen.getByPlaceholderText("Digite o nome do usuário")
            fireEvent.change(input, { target: { value: "joao" } })

            expect(setSearchInputMock).toHaveBeenCalledTimes(1)
            expect(setSearchInputMock).toHaveBeenCalledWith("joao")
        })

        it("exibe o valor atual de searchInput no campo", () => {
            hookOverrides = { searchInput: "teste" }
            renderComponent()

            expect(
                screen.getByPlaceholderText("Digite o nome do usuário")
            ).toHaveValue("teste")
        })
    })

    // ── Filtros via Select ────────────────────────────────────────────────────

    describe("filtros", () => {

        it("carrega e exibe as unidades do escopo no select", async () => {
            renderComponent()

            await waitFor(() => {
                expect(
                    screen.getByRole("option", { name: "001 - Secretaria Teste" })
                ).toBeInTheDocument()
            })
        })

        it("exibe todas as UAs do escopo como opções", async () => {
            renderComponent()

            await waitFor(() => {
                expect(
                    screen.getByRole("option", { name: "001 - Secretaria Teste" })
                ).toBeInTheDocument()
                expect(
                    screen.getByRole("option", { name: "002 - Secretaria de Educação" })
                ).toBeInTheDocument()
            })
        })

        it("exibe apenas a opção 'Todas' quando escopo não tem UAs", async () => {
            mockGetCurrentUser.mockResolvedValue({
                data: { ...ME_RESPONSE.data, opcoes_escopo: { grupos: [] } },
            })

            renderComponent()

            await waitFor(() => expect(mockGetCurrentUser).toHaveBeenCalled())

            const selects = screen.getAllByRole("combobox")
            const options = selects[0].querySelectorAll("option")
            // Apenas "Todas" deve existir
            expect(options).toHaveLength(1)
            expect(options[0]).toHaveValue("todas")
        })

        it("não lança erro quando o carregamento do escopo falha", async () => {
            mockGetCurrentUser.mockRejectedValue(new Error("Falha na API"))

            expect(() => renderComponent()).not.toThrow()
        })

        it("chama setUnidadeFilter e setPage ao selecionar unidade", async () => {
            renderComponent()

            await waitFor(() => expect(mockGetCurrentUser).toHaveBeenCalled())

            const selects = screen.getAllByRole("combobox")
            fireEvent.change(selects[1], { target: { value: "001" } })

            expect(setUnidadeFilterMock).toHaveBeenCalledWith("001")
            expect(setPageMock).toHaveBeenCalledWith(1)
        })

        it("chama setGrupoFilter e setPage ao selecionar grupo 'Gestor'", () => {
            renderComponent()

            const selects = screen.getAllByRole("combobox")
            fireEvent.change(selects[2], { target: { value: "GESTOR_PATRIMONIO" } })

            expect(setGrupoFilterMock).toHaveBeenCalledWith("GESTOR_PATRIMONIO")
            expect(setPageMock).toHaveBeenCalledWith(1)
        })

        it("chama setGrupoFilter com 'OPERADOR_INVENTARIO' ao selecionar Operador", () => {
            renderComponent()

            const selects = screen.getAllByRole("combobox")
            fireEvent.change(selects[2], { target: { value: "OPERADOR_INVENTARIO" } })

            expect(setGrupoFilterMock).toHaveBeenCalledWith("OPERADOR_INVENTARIO")
        })

        it("chama setStatusFilter e setPage ao selecionar status 'ativo'", () => {
            renderComponent()

            const selects = screen.getAllByRole("combobox")
            fireEvent.change(selects[3], { target: { value: "ativo" } })

            expect(setStatusFilterMock).toHaveBeenCalledWith("ativo")
            expect(setPageMock).toHaveBeenCalledWith(1)
        })

        it("chama setStatusFilter com 'inativo' ao selecionar Inativo", () => {
            renderComponent()

            const selects = screen.getAllByRole("combobox")
            fireEvent.change(selects[3], { target: { value: "inativo" } })

            expect(setStatusFilterMock).toHaveBeenCalledWith("inativo")
        })

        it("renderiza a opção 'Todas' no select de unidades", () => {
            renderComponent()

            const selects = screen.getAllByRole("combobox")
            expect(within(selects[1]).getByRole("option", { name: "Todas" })).toBeInTheDocument()
        })

        it("renderiza as opções 'Todos', 'Gestor' e 'Operador' no select de grupos", () => {
            renderComponent()

            const selects = screen.getAllByRole("combobox")
            expect(within(selects[2]).getByRole("option", { name: "Todos" })).toBeInTheDocument()
            expect(within(selects[2]).getByRole("option", { name: "Gestor" })).toBeInTheDocument()
            expect(within(selects[2]).getByRole("option", { name: "Operador" })).toBeInTheDocument()
        })

        it("renderiza as opções 'Todos', 'Ativo' e 'Inativo' no select de status", () => {
            renderComponent()

            const selects = screen.getAllByRole("combobox")
            expect(within(selects[3]).getByRole("option", { name: "Todos" })).toBeInTheDocument()
            expect(within(selects[3]).getByRole("option", { name: "Ativo" })).toBeInTheDocument()
            expect(within(selects[3]).getByRole("option", { name: "Inativo" })).toBeInTheDocument()
        })
    })

    // ── Ordenação ─────────────────────────────────────────────────────────────

    describe("ordenação (handleSort)", () => {

        it("chama setPage(1) ao clicar em qualquer coluna", () => {
            renderComponent()

            fireEvent.click(screen.getByText("Usuário"))

            expect(setPageMock).toHaveBeenCalledWith(1)
        })

        it("chama setOrdering com uma função ao clicar em coluna", () => {
            renderComponent()

            fireEvent.click(screen.getByText("Usuário"))

            expect(setOrderingMock).toHaveBeenCalledTimes(1)
            expect(typeof setOrderingMock.mock.calls[0][0]).toBe("function")
        })

        it("aplica o campo mapeado 'username' ao ordenar por Usuário", () => {
            renderComponent()

            fireEvent.click(screen.getByText("Usuário"))

            expect(resolveOrdering("")).toBe("username")
        })

        it("aplica o campo mapeado 'nome' ao ordenar por Nome do Usuário", () => {
            renderComponent()

            fireEvent.click(screen.getByText("Nome do Usuário"))

            expect(resolveOrdering("")).toBe("nome")
        })

        it("aplica 'unidade_orcamentaria__nome' ao ordenar por Unidade Orçamentaria", () => {
            renderComponent()

            fireEvent.click(screen.getByText("Unidade Orçamentária"))

            expect(resolveOrdering("")).toBe("unidade_orcamentaria__nome")
        })

        it("aplica 'grupo__nome' ao ordenar por Grupo de Permissionamento", () => {
            renderComponent()

            fireEvent.click(screen.getByText("Grupo de Permissionamento"))

            expect(resolveOrdering("")).toBe("grupo__nome")
        })

        it("inverte para '-username' ao ordenar coluna já ativa", () => {
            renderComponent()

            fireEvent.click(screen.getByText("Usuário"))

            expect(resolveOrdering("username")).toBe("-username")
        })

        it("limpa ordenação ao clicar em coluna com ordenação invertida", () => {
            renderComponent()

            fireEvent.click(screen.getByText("Usuário"))

            expect(resolveOrdering("-username")).toBe("")
        })

        it("aplica nova coluna quando a anterior era diferente", () => {
            renderComponent()

            fireEvent.click(screen.getByText("Status"))

            expect(resolveOrdering("username")).toBe("status")
        })
    })

    // ── Paginação ─────────────────────────────────────────────────────────────

    describe("paginação", () => {

        it("botão anterior fica desabilitado na página 1", () => {
            hookOverrides = { page: 1 }
            renderComponent()

            expect(screen.getByRole("button", { name: "‹" })).toBeDisabled()
        })

        it("botão próximo fica desabilitado na última página", () => {
            renderComponent()

            expect(screen.getByRole("button", { name: "›" })).toBeDisabled()
        })

        it("chama setPage(page - 1) ao clicar no botão anterior", async () => {
            hookOverrides = { page: 3, count: 30 }

            await overridePagination(
                [
                    { type: "page", value: 1, id: "p1" },
                    { type: "page", value: 2, id: "p2" },
                    { type: "page", value: 3, id: "p3" },
                ],
                3
            )

            renderComponent()

            fireEvent.click(screen.getByRole("button", { name: "‹" }))

            expect(setPageMock).toHaveBeenCalledWith(2)
        })

        it("chama setPage(page + 1) ao clicar no botão próximo", async () => {
            hookOverrides = { page: 1, count: 20 }

            await overridePagination(
                [
                    { type: "page", value: 1, id: "p1" },
                    { type: "page", value: 2, id: "p2" },
                ],
                2
            )

            renderComponent()

            fireEvent.click(screen.getByRole("button", { name: "›" }))

            expect(setPageMock).toHaveBeenCalledWith(2)
        })

        it("chama setPage com o valor correto ao clicar em número de página", async () => {
            await overridePagination(
                [
                    { type: "page", value: 1, id: "p1" },
                    { type: "page", value: 2, id: "p2" },
                ],
                2
            )

            renderComponent()

            fireEvent.click(screen.getByRole("button", { name: "2" }))

            expect(setPageMock).toHaveBeenCalledWith(2)
        })

        it("renderiza '...' para itens do tipo ellipsis", async () => {
            await overridePagination(
                [
                    { type: "page", value: 1, id: "p1" },
                    { type: "ellipsis", id: "ellipsis-1" },
                    { type: "page", value: 5, id: "p5" },
                ],
                5
            )

            renderComponent()

            expect(screen.getByText("...")).toBeInTheDocument()
        })

        it("destaca visualmente a página atual", () => {
            hookOverrides = { page: 1 }
            renderComponent()

            expect(
                screen.getByRole("button", { name: "1" }).className
            ).toContain("bg-[#00703C]")
        })

        it("não destaca visualmente páginas não ativas", async () => {
            hookOverrides = { page: 1 }

            await overridePagination(
                [
                    { type: "page", value: 1, id: "p1" },
                    { type: "page", value: 2, id: "p2" },
                ],
                2
            )

            renderComponent()

            expect(
                screen.getByRole("button", { name: "2" }).className
            ).not.toContain("bg-[#00703C]")
        })
    })
})
