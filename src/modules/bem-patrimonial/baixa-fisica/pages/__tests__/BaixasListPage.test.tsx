import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { vi, describe, it, expect, beforeEach } from "vitest"

import BaixasListPage from "../BaixasListPage"
import { baixaFisicaService } from "../../service/baixas.service"

import type {
  BaixaFisica,
  BaixaFisicaDetail,
} from "../../types/baixas-fisicas.types"

// ===================== MOCKS =====================

const navigateMock = vi.fn()

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom"
  )

  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

vi.mock("../../service/baixas.service", () => ({
  baixaFisicaService: {
    list: vi.fn(),
    exportarExcel: vi.fn(),
    enviarSolicitacao: vi.fn(),
    aprovar: vi.fn(),
    recusar: vi.fn(),
  },
}))

vi.mock("../../components/UnidadeAdministrativaSelect", () => ({
  UnidadeAdministrativaSelect: ({
    onChange,
    id,
  }: {
    onChange: (v: string) => void
    id?: string
  }) => (
    <select
      id={id}
      onChange={e => onChange(e.target.value)}
      data-testid="unidade-select"
    >
      <option value="">Todas</option>
      <option value="1">UA-01</option>
    </select>
  ),
}))

vi.mock("@/components/ui/DateRangePicker", () => ({
  DateRangePicker: ({ id }: { id?: string }) => (
    <input
      id={id}
      data-testid="date-range-picker"
      readOnly
      placeholder="Selecione o período"
    />
  ),
}))

vi.mock("@/components/AppBreadcrumb", () => ({
  AppBreadcrumb: () => <nav data-testid="breadcrumb" />,
}))

// ===================== FACTORIES =====================

function makeBaixa(overrides: Partial<BaixaFisica> = {}): BaixaFisica {
  return {
    id: 1,
    status: "aguardando_envio",
    status_display: "Em elaboração",
    numero_processo_baixa: "PROC-001",
    numero_nbbpm: null,
    total_itens: 1,
    data_criacao: "2024-01-15T10:00:00Z",
    data_baixa: "2024-01-15",
    aprovado_por: null,
    data_aprovacao: null,
    unidade_administrativa_origem: {
      id: 1,
      sigla: "UA-01",
      codigo: "001",
      nome: "Unidade 01",
      status: "active",
    },
    criado_por: {
      id: 1,
      nome_completo: "João Silva",
      username: "joao.silva",
      email: "joao.silva@email.com",
    },
    ...overrides,
  }
}

function makePaginatedResponse(
  results: BaixaFisica[],
  count = results.length
) {
  return {
    results,
    count,
    next: null,
    previous: null,
  }
}

function makeBaixaDetail(
  overrides: Partial<BaixaFisicaDetail> = {}
): BaixaFisicaDetail {
  return {
    id: 1,
    status: "aguardando_envio",
    status_display: "Em elaboração",
    numero_processo_baixa: "",
    numero_nbbpm: null,
    data_criacao: "2024-01-15T10:00:00Z",
    data_baixa: null,
    aprovado_por: null,
    data_aprovacao: null,
    unidade_administrativa_origem: {
      id: 1,
      sigla: "UA-01",
      codigo: "001",
      nome: "Unidade 01",
      status: "active",
    },
    criado_por: {
      id: 1,
      nome_completo: "João Silva",
      username: "joao.silva",
      email: "joao.silva@email.com",
    },
    itens: [],
    url_enviar_solicitacao: null,
    url_aprovar: null,
    url_cancelar: null,
    url_gerar_nbbpm: null,
    ...overrides,
  }
}

function renderPage() {
  return render(
    <MemoryRouter>
      <BaixasListPage />
    </MemoryRouter>
  )
}

// ===================== TESTS =====================

describe("BaixasListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(baixaFisicaService.list).mockResolvedValue(
      makePaginatedResponse([])
    )
  })

  // --- Renderização inicial ---

  it("exibe loading inicialmente", () => {
    vi.mocked(baixaFisicaService.list).mockReturnValue(new Promise(() => {}))

    renderPage()

    expect(screen.getByText("Carregando...")).toBeInTheDocument()
  })

  it("exibe mensagem de lista vazia após carregar sem resultados", async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByText("Nenhum resultado encontrado.")).toBeInTheDocument()
    })
  })

  it("exibe título da página", () => {
    renderPage()

    expect(screen.getByText("Baixa Física de Bens Patrimoniais")).toBeInTheDocument()
  })

  it("chama baixaFisicaService.list ao montar", async () => {
    renderPage()

    await waitFor(() => {
      expect(baixaFisicaService.list).toHaveBeenCalledWith(
        expect.objectContaining({
          ordering: "-data_criacao",
          page: 1,
        })
      )
    })
  })

  // --- Listagem ---

  it("exibe sigla da unidade administrativa na tabela", async () => {
    vi.mocked(baixaFisicaService.list).mockResolvedValue(
      makePaginatedResponse([makeBaixa()])
    )

    renderPage()

    await waitFor(() => {
      expect(screen.getByText("UA-01")).toBeInTheDocument()
    })
  })

  it("exibe nome do usuário que solicitou", async () => {
    vi.mocked(baixaFisicaService.list).mockResolvedValue(
      makePaginatedResponse([makeBaixa()])
    )

    renderPage()

    await waitFor(() => {
      expect(screen.getByText("João Silva")).toBeInTheDocument()
    })
  })

  it("exibe status 'Em elaboração' para baixas aguardando_envio", async () => {
    vi.mocked(baixaFisicaService.list).mockResolvedValue(
      makePaginatedResponse([makeBaixa()])
    )

    renderPage()

    await waitFor(() => {
      expect(screen.getByText("Em elaboração")).toBeInTheDocument()
    })
  })

  it("renderiza linha normalmente quando aprovado_por está preenchido", async () => {
    // A tabela de listagem não exibe o aprovador — apenas criado_por.
    // Verifica que a linha é renderizada sem erros com aprovado_por preenchido.
    vi.mocked(baixaFisicaService.list).mockResolvedValue(
      makePaginatedResponse([
        makeBaixa({
          aprovado_por: {
            id: 2,
            nome_completo: "Maria Gestora",
            username: "maria.luisa",
            email: "maria.luisa@email.com",
          },
          data_aprovacao: "2024-01-16T14:00:00Z",
        }),
      ])
    )

    renderPage()

    await waitFor(() => {
      // A coluna exibida é criado_por, não aprovado_por
      expect(screen.getByText("João Silva")).toBeInTheDocument()
      expect(screen.getByText("UA-01")).toBeInTheDocument()
    })
  })

  // --- Seleção ---

  it("checkbox de item seleciona a baixa", async () => {
    vi.mocked(baixaFisicaService.list).mockResolvedValue(
      makePaginatedResponse([makeBaixa({ status: "aguardando_envio" })])
    )

    renderPage()

    await waitFor(() => {
      expect(screen.getByText("UA-01")).toBeInTheDocument()
    })

    const checkboxes = screen.getAllByRole("checkbox")
    fireEvent.click(checkboxes[1])

    await waitFor(() => {
      expect(screen.getByText(/Solicitar \(1\)/)).toBeInTheDocument()
    })
  })

  it("select-all seleciona todos os itens selecionáveis", async () => {
    vi.mocked(baixaFisicaService.list).mockResolvedValue(
      makePaginatedResponse([
        makeBaixa({ id: 1, status: "aguardando_envio" }),
        makeBaixa({ id: 2, status: "solicitada", status_display: "Solicitada" }),
      ])
    )

    renderPage()

    await waitFor(() => {
      expect(screen.getAllByText("UA-01")).toHaveLength(2)
    })

    fireEvent.click(screen.getAllByRole("checkbox")[0])

    await waitFor(() => {
      expect(screen.getByText(/Solicitar \(1\)/)).toBeInTheDocument()
      expect(screen.getByText(/Aprovar \(1\)/)).toBeInTheDocument()
    })
  })

  it("select-all desmarca todos quando todos já estão selecionados", async () => {
    vi.mocked(baixaFisicaService.list).mockResolvedValue(
      makePaginatedResponse([makeBaixa({ status: "aguardando_envio" })])
    )

    renderPage()

    await waitFor(() => {
      expect(screen.getByText("UA-01")).toBeInTheDocument()
    })

    const selectAll = screen.getAllByRole("checkbox")[0]
    fireEvent.click(selectAll)
    fireEvent.click(selectAll)

    await waitFor(() => {
      expect(screen.queryByText(/Solicitar/)).not.toBeInTheDocument()
    })
  })

  it("checkbox desabilitado para status não selecionável", async () => {
    vi.mocked(baixaFisicaService.list).mockResolvedValue(
      makePaginatedResponse([
        makeBaixa({ status: "aceita", status_display: "Aceita" }),
      ])
    )

    renderPage()

    await waitFor(() => {
      expect(screen.getByText("Aceita")).toBeInTheDocument()
    })

    const checkboxes = screen.getAllByRole("checkbox")
    expect(checkboxes[1]).toBeDisabled()
  })

  // --- Ações em lote ---

  it("chama enviarSolicitacao ao clicar em Solicitar", async () => {
    vi.mocked(baixaFisicaService.list).mockResolvedValue(
      makePaginatedResponse([makeBaixa({ id: 5, status: "aguardando_envio" })])
    )

    vi.mocked(baixaFisicaService.enviarSolicitacao).mockResolvedValue(
      makeBaixaDetail()
    )

    renderPage()

    await waitFor(() => {
      expect(screen.getByText("UA-01")).toBeInTheDocument()
    })

    fireEvent.click(screen.getAllByRole("checkbox")[1])
    fireEvent.click(screen.getByText(/Solicitar/))

    await waitFor(() => {
      expect(baixaFisicaService.enviarSolicitacao).toHaveBeenCalledWith(5)
    })
  })

  it("chama aprovar ao clicar em Aprovar", async () => {
    vi.mocked(baixaFisicaService.list).mockResolvedValue(
      makePaginatedResponse([
        makeBaixa({ id: 7, status: "solicitada", status_display: "Solicitada" }),
      ])
    )

    vi.mocked(baixaFisicaService.aprovar).mockResolvedValue(makeBaixaDetail())

    renderPage()

    await waitFor(() => {
      expect(screen.getByText("Solicitada")).toBeInTheDocument()
    })

    fireEvent.click(screen.getAllByRole("checkbox")[1])
    fireEvent.click(screen.getByText(/Aprovar/))

    await waitFor(() => {
      expect(baixaFisicaService.aprovar).toHaveBeenCalledWith(7)
    })
  })

  it("chama recusar ao clicar em Recusar", async () => {
    vi.mocked(baixaFisicaService.list).mockResolvedValue(
      makePaginatedResponse([
        makeBaixa({ id: 8, status: "solicitada", status_display: "Solicitada" }),
      ])
    )

    vi.mocked(baixaFisicaService.recusar).mockResolvedValue(makeBaixaDetail())

    renderPage()

    await waitFor(() => {
      expect(screen.getByText("Solicitada")).toBeInTheDocument()
    })

    fireEvent.click(screen.getAllByRole("checkbox")[1])
    fireEvent.click(screen.getByText(/Recusar/))

    await waitFor(() => {
      expect(baixaFisicaService.recusar).toHaveBeenCalledWith(8)
    })
  })

  it("exibe alerta de erro ao falhar no enviarSolicitacao", async () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {})

    vi.mocked(baixaFisicaService.list).mockResolvedValue(
      makePaginatedResponse([makeBaixa({ status: "aguardando_envio" })])
    )

    vi.mocked(baixaFisicaService.enviarSolicitacao).mockRejectedValue(
      new Error("Erro")
    )

    renderPage()

    await waitFor(() => {
      expect(screen.getByText("UA-01")).toBeInTheDocument()
    })

    fireEvent.click(screen.getAllByRole("checkbox")[1])
    fireEvent.click(screen.getByText(/Solicitar/))

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Erro ao solicitar baixas.")
    })

    alertSpy.mockRestore()
  })

  // --- Filtros ---

  it("chama list com search ao clicar em Filtrar", async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByText("Nenhum resultado encontrado.")).toBeInTheDocument()
    })

    fireEvent.change(
      screen.getByPlaceholderText("Nº patrimonial, nome do item, NBBPM"),
      { target: { value: "PROC-XYZ" } }
    )

    fireEvent.click(screen.getByText("Filtrar"))

    await waitFor(() => {
      expect(baixaFisicaService.list).toHaveBeenCalledWith(
        expect.objectContaining({ search: "PROC-XYZ", page: 1 })
      )
    })
  })

  it("dispara filtro ao pressionar Enter", async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByText("Nenhum resultado encontrado.")).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText("Nº patrimonial, nome do item, NBBPM")

    fireEvent.change(input, { target: { value: "PROC-ENTER" } })
    fireEvent.keyDown(input, { key: "Enter" })

    await waitFor(() => {
      expect(baixaFisicaService.list).toHaveBeenCalledWith(
        expect.objectContaining({ search: "PROC-ENTER" })
      )
    })
  })

  it("opção 'Em elaboração' no filtro de status tem valor 'aguardando_envio'", async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByText("Nenhum resultado encontrado.")).toBeInTheDocument()
    })

    const option = screen.getByRole("option", { name: "Em elaboração" })
    expect(option).toHaveValue("aguardando_envio")
  })

  // --- Ordenação ---

  it("alterna ordenação ao clicar no header Unidade Administrativa", async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByText("Nenhum resultado encontrado.")).toBeInTheDocument()
    })

    fireEvent.click(
      screen.getByText("Unidade Administrativa").closest("th")!
    )

    await waitFor(() => {
      expect(baixaFisicaService.list).toHaveBeenCalledWith(
        expect.objectContaining({
          ordering: "unidade_administrativa_origem__sigla",
        })
      )
    })
  })

  it("inverte ordenação ao clicar duas vezes em Unidade Administrativa", async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByText("Nenhum resultado encontrado.")).toBeInTheDocument()
    })

    const th = screen.getByText("Unidade Administrativa").closest("th")!

    fireEvent.click(th)

    await waitFor(() => {
      expect(baixaFisicaService.list).toHaveBeenCalledWith(
        expect.objectContaining({
          ordering: "unidade_administrativa_origem__sigla",
        })
      )
    })

    fireEvent.click(th)

    await waitFor(() => {
      expect(baixaFisicaService.list).toHaveBeenCalledWith(
        expect.objectContaining({
          ordering: "-unidade_administrativa_origem__sigla",
        })
      )
    })
  })

  it("ordena por coluna Atualização", async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByText("Nenhum resultado encontrado.")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText("Atualização").closest("th")!)

    await waitFor(() => {
      expect(baixaFisicaService.list).toHaveBeenCalledWith(
        expect.objectContaining({ ordering: "data_criacao" })
      )
    })
  })

  it("ordena por coluna Usuário que solicitou a Baixa", async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByText("Nenhum resultado encontrado.")).toBeInTheDocument()
    })

    fireEvent.click(
      screen.getByText("Usuário que solicitou a Baixa").closest("th")!
    )

    await waitFor(() => {
      expect(baixaFisicaService.list).toHaveBeenCalledWith(
        expect.objectContaining({
          ordering: "criado_por__nome_completo",
        })
      )
    })
  })

  // --- Exportar Excel ---

  it("chama exportarExcel ao clicar em Exportar Excel", async () => {
    vi.mocked(baixaFisicaService.exportarExcel).mockResolvedValue(new Blob())

    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:url"),
      revokeObjectURL: vi.fn(),
    })

    renderPage()

    await waitFor(() => {
      expect(screen.getByText("Nenhum resultado encontrado.")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText("Exportar Excel"))

    await waitFor(() => {
      expect(baixaFisicaService.exportarExcel).toHaveBeenCalled()
    })
  })

  it("exibe alerta de erro ao falhar no exportarExcel", async () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {})

    vi.mocked(baixaFisicaService.exportarExcel).mockRejectedValue(new Error())

    renderPage()

    await waitFor(() => {
      expect(screen.getByText("Nenhum resultado encontrado.")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText("Exportar Excel"))

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Erro ao exportar Excel")
    })

    alertSpy.mockRestore()
  })

  // --- Paginação ---

  it("exibe paginação quando há mais de 10 registros", async () => {
    vi.mocked(baixaFisicaService.list).mockResolvedValue(
      makePaginatedResponse([makeBaixa()], 25)
    )

    renderPage()

    await waitFor(() => {
      expect(screen.getByText("Página 1 de 3")).toBeInTheDocument()
    })
  })

  it("não exibe paginação quando há 10 ou menos registros", async () => {
    vi.mocked(baixaFisicaService.list).mockResolvedValue(
      makePaginatedResponse([makeBaixa()], 10)
    )

    renderPage()

    await waitFor(() => {
      expect(screen.getByText("UA-01")).toBeInTheDocument()
    })

    expect(screen.queryByText(/Página/)).not.toBeInTheDocument()
  })

  it("navega para próxima página", async () => {
    vi.mocked(baixaFisicaService.list).mockResolvedValue(
      makePaginatedResponse([makeBaixa()], 25)
    )

    renderPage()

    await waitFor(() => {
      expect(screen.getByText("Página 1 de 3")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText("Próxima"))

    await waitFor(() => {
      expect(baixaFisicaService.list).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 })
      )
    })
  })

  it("botão Anterior desabilitado na primeira página", async () => {
    vi.mocked(baixaFisicaService.list).mockResolvedValue(
      makePaginatedResponse([makeBaixa()], 25)
    )

    renderPage()

    await waitFor(() => {
      expect(screen.getByText("Página 1 de 3")).toBeInTheDocument()
    })

    expect(screen.getByText("Anterior")).toBeDisabled()
  })

  // --- Navegação ---

  it("link de visualização aponta para rota correta", async () => {
    vi.mocked(baixaFisicaService.list).mockResolvedValue(
      makePaginatedResponse([makeBaixa({ id: 42 })])
    )

    renderPage()

    await waitFor(() => {
      expect(screen.getByText("UA-01")).toBeInTheDocument()
    })

    const link = screen.getByRole("link")
    expect(link).toHaveAttribute("href", "/baixas-fisicas/42")
  })

  it("navega para página de nova baixa", async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByText("Nenhum resultado encontrado.")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText(/Adicionar Baixa/i))

    expect(navigateMock).toHaveBeenCalled()
  })

  // --- Extras ---

  it("renderiza data formatada corretamente", async () => {
    vi.mocked(baixaFisicaService.list).mockResolvedValue(
      makePaginatedResponse([makeBaixa({ data_criacao: "2024-01-15T10:30:00Z" })])
    )

    renderPage()

    await waitFor(() => {
      expect(screen.getByText(/15\/01\/2024/)).toBeInTheDocument()
    })
  })

  it("não quebra com data inválida", async () => {
    vi.mocked(baixaFisicaService.list).mockResolvedValue(
      makePaginatedResponse([makeBaixa({ data_criacao: "data-invalida" })])
    )

    renderPage()

    await waitFor(() => {
      expect(screen.getByText(/João Silva/)).toBeInTheDocument()
    })
  })

  it("desabilita select-all quando não existem itens selecionáveis", async () => {
    vi.mocked(baixaFisicaService.list).mockResolvedValue(
      makePaginatedResponse([makeBaixa({ status: "aceita", status_display: "Aceita" })])
    )

    renderPage()

    await waitFor(() => {
      expect(screen.getByText("Aceita")).toBeInTheDocument()
    })

    const selectAll = screen.getAllByRole("checkbox")[0]
    expect(selectAll).toBeDisabled()
  })

  it("botão Próxima fica desabilitado na última página", async () => {
    vi.mocked(baixaFisicaService.list).mockResolvedValue(
      makePaginatedResponse([makeBaixa()], 11)
    )

    renderPage()

    await waitFor(() => {
      expect(screen.getByText("Página 1 de 2")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText("Próxima"))

    await waitFor(() => {
      expect(screen.getByText("Página 2 de 2")).toBeInTheDocument()
    })

    expect(screen.getByText("Próxima")).toBeDisabled()
  })

  it("chama history.back ao clicar no botão voltar", async () => {
    const backSpy = vi.spyOn(window.history, "back").mockImplementation(() => {})

    renderPage()

    await waitFor(() => {
      expect(screen.getByText("Nenhum resultado encontrado.")).toBeInTheDocument()
    })

    fireEvent.click(screen.getAllByRole("button")[0])

    expect(backSpy).toHaveBeenCalled()

    backSpy.mockRestore()
  })

  it("chama ordenação da coluna Unidade", async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByText("Nenhum resultado encontrado.")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText("Unidade Administrativa").closest("th")!)

    await waitFor(() => {
      expect(baixaFisicaService.list).toHaveBeenCalledWith(
        expect.objectContaining({
          ordering: "unidade_administrativa_origem__sigla",
        })
      )
    })
  })

  it("remove seleção individual ao clicar novamente", async () => {
    vi.mocked(baixaFisicaService.list).mockResolvedValue(
      makePaginatedResponse([makeBaixa({ status: "aguardando_envio" })])
    )

    renderPage()

    await waitFor(() => {
      expect(screen.getByText("UA-01")).toBeInTheDocument()
    })

    const checkbox = screen.getAllByRole("checkbox")[1]

    fireEvent.click(checkbox)

    await waitFor(() => {
      expect(screen.getByText(/Solicitar \(1\)/)).toBeInTheDocument()
    })

    fireEvent.click(checkbox)

    await waitFor(() => {
      expect(screen.queryByText(/Solicitar/)).not.toBeInTheDocument()
    })
  })

  it("exibe loading nos botões enquanto processa", async () => {
    vi.mocked(baixaFisicaService.list).mockResolvedValue(
      makePaginatedResponse([makeBaixa({ id: 1, status: "aguardando_envio" })])
    )

    vi.mocked(baixaFisicaService.enviarSolicitacao).mockReturnValue(
      new Promise(() => {})
    )

    renderPage()

    await waitFor(() => {
      expect(screen.getByText("UA-01")).toBeInTheDocument()
    })

    fireEvent.click(screen.getAllByRole("checkbox")[1])

    const button = screen.getByText(/Solicitar/)
    fireEvent.click(button)

    await waitFor(() => {
      expect(button).toBeDisabled()
    })
  })

  it("exibe alerta ao falhar aprovação", async () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {})

    vi.mocked(baixaFisicaService.list).mockResolvedValue(
      makePaginatedResponse([
        makeBaixa({ id: 10, status: "solicitada", status_display: "Solicitada" }),
      ])
    )

    vi.mocked(baixaFisicaService.aprovar).mockRejectedValue(new Error())

    renderPage()

    await waitFor(() => {
      expect(screen.getByText("Solicitada")).toBeInTheDocument()
    })

    fireEvent.click(screen.getAllByRole("checkbox")[1])
    fireEvent.click(screen.getByText(/Aprovar/))

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Erro ao aprovar baixas.")
    })

    alertSpy.mockRestore()
  })

  it("exibe alerta ao falhar recusa", async () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {})

    vi.mocked(baixaFisicaService.list).mockResolvedValue(
      makePaginatedResponse([
        makeBaixa({ id: 11, status: "solicitada", status_display: "Solicitada" }),
      ])
    )

    vi.mocked(baixaFisicaService.recusar).mockRejectedValue(new Error())

    renderPage()

    await waitFor(() => {
      expect(screen.getByText("Solicitada")).toBeInTheDocument()
    })

    fireEvent.click(screen.getAllByRole("checkbox")[1])
    fireEvent.click(screen.getByText(/Recusar/))

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Erro ao recusar baixas.")
    })

    alertSpy.mockRestore()
  })
})