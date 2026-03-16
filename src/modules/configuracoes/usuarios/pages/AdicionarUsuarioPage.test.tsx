import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import AdicionarUsuarioPage from "./AdicionarUsuarioPage"

// import { usuarioService } from "../service/usuario.service"
import { unidadeAdministrativaService } from "../../unidades-administrativas/service/unidadeAdministrativa.service"

const navigateMock = vi.fn()

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

vi.mock("../service/usuario.service", () => ({
  usuarioService: {
    create: vi.fn(),
  },
}))

vi.mock(
  "../../unidades-administrativas/service/unidadeAdministrativa.service",
  () => ({
    unidadeAdministrativaService: {
      list: vi.fn(),
    },
  })
)

const mockUnidades = {
  results: [
    { id: 1, codigo: "001", nome: "Secretaria Teste" },
    { id: 2, codigo: "002", nome: "Secretaria Saúde" },
  ],
}

function renderPage() {
  return render(
    <MemoryRouter>
      <AdicionarUsuarioPage />
    </MemoryRouter>
  )
}

async function preencherFormulario() {
  fireEvent.change(screen.getByPlaceholderText("Digite o nome completo"), {
    target: { value: "João da Silva" },
  })

  fireEvent.change(screen.getByPlaceholderText("Digite o rf"), {
    target: { value: "123456" },
  })

  fireEvent.change(
    screen.getByPlaceholderText("Digite o nome de usuário de acesso"),
    {
      target: { value: "joao" },
    }
  )

  fireEvent.change(screen.getByPlaceholderText("Digite o e-mail"), {
    target: { value: "joao@email.com" },
  })

  fireEvent.change(screen.getByPlaceholderText("Cadastre uma senha"), {
    target: { value: "Senha123!" },
  })

  fireEvent.change(screen.getByPlaceholderText("Confirme a senha"), {
    target: { value: "Senha123!" },
  })

  // abrir select unidade
  fireEvent.click(screen.getByText("Selecione uma UA"))

  const unidade = await screen.findByText("001 - Secretaria Teste")
  fireEvent.click(unidade)

  // abrir select grupo
  fireEvent.click(screen.getByText("Selecione os grupos"))

  const grupo = await screen.findByText("Gestor")
  fireEvent.click(grupo)
}

describe("AdicionarUsuarioPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renderiza a tela corretamente", async () => {
    vi.mocked(unidadeAdministrativaService.list).mockResolvedValue(mockUnidades)

    renderPage()

    await waitFor(() => {
      expect(unidadeAdministrativaService.list).toHaveBeenCalled()
    })

    expect(
      screen.getByRole("heading", { name: "Adicionar Usuário" })
    ).toBeInTheDocument()

    expect(
      screen.getByPlaceholderText("Digite o nome completo")
    ).toBeInTheDocument()

    expect(screen.getByPlaceholderText("Digite o rf")).toBeInTheDocument()

    expect(screen.getByPlaceholderText("Digite o e-mail")).toBeInTheDocument()

    expect(screen.getByText("Salvar")).toBeInTheDocument()
  })

  it("carrega unidades administrativas", async () => {
    vi.mocked(unidadeAdministrativaService.list).mockResolvedValue(mockUnidades)

    renderPage()

    await waitFor(() => {
      expect(unidadeAdministrativaService.list).toHaveBeenCalled()
    })
  })

  it("permite mostrar e esconder senha", async () => {
    vi.mocked(unidadeAdministrativaService.list).mockResolvedValue(mockUnidades)

    renderPage()

    await waitFor(() => {
      expect(unidadeAdministrativaService.list).toHaveBeenCalled()
    })

    const passwordInput = screen.getByPlaceholderText("Cadastre uma senha")

    expect(passwordInput).toHaveAttribute("type", "password")

    const toggleButton = screen.getAllByRole("button")[3]

    fireEvent.click(toggleButton)

    expect(passwordInput).toHaveAttribute("type", "text")
  })

//   it("envia formulário com sucesso", async () => {
//     vi.mocked(unidadeAdministrativaService.list).mockResolvedValue(mockUnidades)

//     vi.mocked(usuarioService.create).mockResolvedValue({
//       id: 1,
//       username: "joao",
//       nome: "João da Silva",
//       email: "joao@email.com",
//       unidade_codigo: "001",
//       unidade_nome: "Secretaria Teste",
//       grupo_nome: "GESTOR_PATRIMONIO",
//       status: "ativo",
//       status_display: "Ativo",
//     })

//     renderPage()

//     await waitFor(() => {
//       expect(unidadeAdministrativaService.list).toHaveBeenCalled()
//     })

//     await preencherFormulario()

//     fireEvent.click(screen.getByText("Salvar"))

//     await waitFor(() => {
//       expect(usuarioService.create).toHaveBeenCalled()
//     })

//     expect(navigateMock).toHaveBeenCalledWith("/usuarios")
//   })

//   it("mostra erro ao falhar criação", async () => {
//     vi.mocked(unidadeAdministrativaService.list).mockResolvedValue(mockUnidades)

//     vi.mocked(usuarioService.create).mockRejectedValue(new Error("Erro API"))

//     renderPage()

//     await waitFor(() => {
//       expect(unidadeAdministrativaService.list).toHaveBeenCalled()
//     })

//     await preencherFormulario()

//     fireEvent.click(screen.getByText("Salvar"))

//     await waitFor(() => {
//       expect(
//         screen.getByText(/Erro ao criar usuário/i)
//       ).toBeInTheDocument()
//     })
//   })

  it("navega ao cancelar", async () => {
    vi.mocked(unidadeAdministrativaService.list).mockResolvedValue(mockUnidades)

    renderPage()

    fireEvent.click(screen.getByText("Cancelar"))

    expect(navigateMock).toHaveBeenCalledWith("/usuarios")
  })

  it("volta ao clicar no botão voltar", async () => {
    vi.mocked(unidadeAdministrativaService.list).mockResolvedValue(mockUnidades)

    renderPage()

    const buttons = screen.getAllByRole("button")

    fireEvent.click(buttons[0])

    expect(navigateMock).toHaveBeenCalledWith(-1)
  })
})