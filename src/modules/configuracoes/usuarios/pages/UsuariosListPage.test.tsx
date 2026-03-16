import { render, screen, fireEvent } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, it, expect, vi, beforeEach } from "vitest"

import UsuariosListPage from "./UsuariosListPage"

const navigateMock = vi.fn()

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

const setPageMock = vi.fn()
const setSearchInputMock = vi.fn()
const setUnidadeFilterMock = vi.fn()
const setGrupoFilterMock = vi.fn()
const setStatusFilterMock = vi.fn()
const setOrderingMock = vi.fn()

vi.mock("../hooks/useUsuariosList", () => ({
  useUsuariosList: () => ({
    usuarios: [
      {
        id: 1,
        username: "joao",
        nome: "João da Silva",
        unidade_codigo: "001",
        unidade_nome: "Secretaria Teste",
        grupo_nome: "GESTOR_PATRIMONIO",
        status_display: "Ativo",
      },
    ],
    unidades: [
      { id: 1, codigo: "001", nome: "Secretaria Teste" },
    ],
    page: 1,
    count: 1,
    loading: false,
    searchInput: "",
    unidadeFilter: "todas",
    grupoFilter: "todos",
    statusFilter: "todos",
    setPage: setPageMock,
    setSearchInput: setSearchInputMock,
    setUnidadeFilter: setUnidadeFilterMock,
    setGrupoFilter: setGrupoFilterMock,
    setStatusFilter: setStatusFilterMock,
    setOrdering: setOrderingMock,
  }),
}))

vi.mock("../hooks/usePagination", () => ({
  usePagination: () => ({
    pages: [{ type: "page", value: 1 }],
    totalPages: 1,
  }),
}))

describe("UsuariosListPage", () => {

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <UsuariosListPage />
      </MemoryRouter>
    )

  it("renderiza o título da página", () => {
    renderComponent()

    expect(
      screen.getByRole("heading", { name: "Usuários" })
    ).toBeInTheDocument()
  })

  it("renderiza breadcrumb", () => {
    renderComponent()

    expect(screen.getByText("Configurações")).toBeInTheDocument()
    expect(screen.getByText("Usuários", { selector: "span" })).toBeInTheDocument()
  })

  it("renderiza botões principais", () => {
    renderComponent()

    expect(screen.getByText("Relatório")).toBeInTheDocument()
    expect(screen.getByText("Adicionar Usuário")).toBeInTheDocument()
  })

  it("navega ao clicar em adicionar usuário", () => {
    renderComponent()

    fireEvent.click(screen.getByText("Adicionar Usuário"))

    expect(navigateMock).toHaveBeenCalledWith("/usuarios/novo")
  })

  it("navega ao clicar no botão voltar", () => {
    renderComponent()

    const buttons = screen.getAllByRole("button")
    fireEvent.click(buttons[0])

    expect(navigateMock).toHaveBeenCalledWith(-1)
  })

  it("permite digitar no campo de busca", () => {
    renderComponent()

    const input = screen.getByPlaceholderText("Digite o nome do usuário")

    fireEvent.change(input, {
      target: { value: "joao" },
    })

    expect(setSearchInputMock).toHaveBeenCalledWith("joao")
  })

  it("renderiza usuário na tabela", () => {
    renderComponent()

    expect(screen.getByText("joao")).toBeInTheDocument()
    expect(screen.getByText("João da Silva")).toBeInTheDocument()
    expect(screen.getByText("001 - Secretaria Teste")).toBeInTheDocument()
  })

  it("permite ordenar colunas", () => {
    renderComponent()

    const column = screen.getByText("Usuário")

    fireEvent.click(column)

    expect(setPageMock).toHaveBeenCalledWith(1)
    expect(setOrderingMock).toHaveBeenCalled()
  })
})