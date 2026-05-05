import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { vi, describe, it, expect, beforeEach } from "vitest"
import BaixasListPage from "../BaixasListPage"
import { baixaFisicaService } from "../../service/baixas.service"
import type { BaixaFisica, BaixaFisicaDetail } from "../../types/baixas-fisicas.types"

// ===================== MOCKS =====================

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
  UnidadeAdministrativaSelect: ({ onChange, id }: { onChange: (v: string) => void; id?: string }) => (
    <select id={id} onChange={e => onChange(e.target.value)} data-testid="unidade-select">
      <option value="">Todas</option>
      <option value="1">UA-01</option>
    </select>
  ),
}))

vi.mock("@/components/ui/DateRangePicker", () => ({
  DateRangePicker: ({ id }: { id?: string }) => (
    <input id={id} data-testid="date-range-picker" readOnly placeholder="Selecione o período" />
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
    status_display: "Aguardando Envio",
    numero_processo_baixa: "PROC-001",
    numero_nbbpm: null,
    total_itens: 1,
    data_criacao: "2024-01-15T10:00:00Z",
    data_baixa: "2024-01-15",
    aprovado_por: null,
    data_aprovacao: null,
    unidade_administrativa_origem: { id: 1, sigla: "UA-01", codigo: "001", nome: "Unidade 01", status: "active" },
    criado_por: { id: 1, nome_completo: "João Silva", username: "joao.silva", email: "joao.silva@email.com" },
    ...overrides,
  }
}

function makePaginatedResponse(results: BaixaFisica[], count = results.length) {
  return { results, count, next: null, previous: null }
}

function makeBaixaDetail(overrides: Partial<BaixaFisicaDetail> = {}): BaixaFisicaDetail {
  return {
    id: 1,
    status: "aguardando_envio",
    status_display: "Aguardando Envio",
    numero_processo_baixa: "PROC-001",
    numero_nbbpm: null,
    data_criacao: "2024-01-15T10:00:00Z",
    data_baixa: "2024-01-15",
    aprovado_por: null,
    data_aprovacao: null,
    unidade_administrativa_origem: { id: 1, sigla: "UA-01", codigo: "001", nome: "Unidade 01", status: "active" },
    criado_por: { id: 1, nome_completo: "João Silva", username: "joao.silva", email: "joao.silva@email.com" },
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
    vi.mocked(baixaFisicaService.list).mockResolvedValue(makePaginatedResponse([]))
  })

  // --- Renderização inicial ---

  it("exibe loading inicialmente", () => {
    vi.mocked(baixaFisicaService.list).mockReturnValue(new Promise(() => { }))
    renderPage()
    expect(screen.getByText("Carregando...")).toBeInTheDocument()
  })

  it("exibe mensagem de lista vazia após carregar sem resultados", async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText("Nenhum resultado encontrado.")).toBeInTheDocument()
    })
  })

  it("exibe título da página", async () => {
    renderPage()
    expect(screen.getByText("Baixa Física de Bens Patrimoniais")).toBeInTheDocument()
  })

  it("chama baixaFisicaService.list ao montar", async () => {
    renderPage()
    await waitFor(() => {
      expect(baixaFisicaService.list).toHaveBeenCalledWith(
        expect.objectContaining({ ordering: "-data_criacao", page: 1 })
      )
    })
  })

  // --- Listagem ---

  it("renderiza linha da tabela com dados da baixa", async () => {
    vi.mocked(baixaFisicaService.list).mockResolvedValue(
      makePaginatedResponse([makeBaixa()])
    )
    renderPage()
    await waitFor(() => {
      expect(screen.getByText("PROC-001")).toBeInTheDocument()
      expect(screen.getAllByText("UA-01")[0]).toBeInTheDocument()
      expect(screen.getByText("Aguardando Envio")).toBeInTheDocument()
      expect(screen.getByText(/João Silva/)).toBeInTheDocument()
    })
  })

  it("exibe '-' quando numero_processo_baixa é nulo", async () => {
    vi.mocked(baixaFisicaService.list).mockResolvedValue(
      makePaginatedResponse([makeBaixa({ numero_processo_baixa: "" })])
    )
    renderPage()
    await waitFor(() => {
      const dashes = screen.getAllByText("-")
      expect(dashes.length).toBeGreaterThanOrEqual(1)
    })
  })

  it("exibe aprovador quando aprovado_por está preenchido", async () => {
    vi.mocked(baixaFisicaService.list).mockResolvedValue(
      makePaginatedResponse([makeBaixa({
        aprovado_por: { id: 2, nome_completo: "Maria Gestora", username: "maria.luisa", email: "maria.luisa@email.com" },
        data_aprovacao: "2024-01-16T14:00:00Z",
      })])
    )
    renderPage()
    await waitFor(() => {
      expect(screen.getByText(/Maria Gestora/)).toBeInTheDocument()
    })
  })

  // --- Seleção ---

  it("checkbox de item seleciona a baixa", async () => {
    vi.mocked(baixaFisicaService.list).mockResolvedValue(
      makePaginatedResponse([makeBaixa({ status: "aguardando_envio" })])
    )
    renderPage()
    await waitFor(() => screen.getByText("PROC-001"))

    const checkboxes = screen.getAllByRole("checkbox")
    const itemCheckbox = checkboxes[1] // índice 0 = select-all
    fireEvent.click(itemCheckbox)

    await waitFor(() => {
      expect(screen.getByText(/Solicitar \(1\)/)).toBeInTheDocument()
    })
  })

  it("select-all seleciona todos os itens selecionáveis", async () => {
    vi.mocked(baixaFisicaService.list).mockResolvedValue(
      makePaginatedResponse([
        makeBaixa({ id: 1, status: "aguardando_envio", numero_processo_baixa: "PROC-001" }),
        makeBaixa({ id: 2, status: "solicitada", status_display: "Solicitada", numero_processo_baixa: "PROC-002" }),
      ])
    )
    renderPage()
    await waitFor(() => screen.getAllByText("PROC-001"))

    const selectAll = screen.getAllByRole("checkbox")[0]
    fireEvent.click(selectAll)

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
    await waitFor(() => screen.getByText("PROC-001"))

    const selectAll = screen.getAllByRole("checkbox")[0]
    fireEvent.click(selectAll)
    fireEvent.click(selectAll)

    await waitFor(() => {
      expect(screen.queryByText(/Solicitar/)).not.toBeInTheDocument()
    })
  })

  it("checkbox desabilitado para baixas com status não selecionável", async () => {
    vi.mocked(baixaFisicaService.list).mockResolvedValue(
      makePaginatedResponse([makeBaixa({ status: "aceita", status_display: "Aceita" })])
    )
    renderPage()
    await waitFor(() => screen.getByText("Aceita"))

    const checkboxes = screen.getAllByRole("checkbox")
    expect(checkboxes[1]).toBeDisabled()
  })

  // --- Ações em lote ---

  it("chama enviarSolicitacao ao clicar em Solicitar", async () => {
    vi.mocked(baixaFisicaService.list).mockResolvedValue(
      makePaginatedResponse([makeBaixa({ id: 5, status: "aguardando_envio" })])
    )
    vi.mocked(baixaFisicaService.enviarSolicitacao).mockResolvedValue(makeBaixaDetail())

    renderPage()
    await waitFor(() => screen.getByText("PROC-001"))

    fireEvent.click(screen.getAllByRole("checkbox")[1])
    await waitFor(() => screen.getByText(/Solicitar/))
    fireEvent.click(screen.getByText(/Solicitar/))

    await waitFor(() => {
      expect(baixaFisicaService.enviarSolicitacao).toHaveBeenCalledWith(5)
    })
  })

  it("chama aprovar ao clicar em Aprovar", async () => {
    vi.mocked(baixaFisicaService.list).mockResolvedValue(
      makePaginatedResponse([makeBaixa({ id: 7, status: "solicitada", status_display: "Solicitada" })])
    )
    vi.mocked(baixaFisicaService.aprovar).mockResolvedValue(makeBaixaDetail())

    renderPage()
    await waitFor(() => screen.getByText("Solicitada"))

    fireEvent.click(screen.getAllByRole("checkbox")[1])
    await waitFor(() => screen.getByText(/Aprovar/))
    fireEvent.click(screen.getByText(/Aprovar/))

    await waitFor(() => {
      expect(baixaFisicaService.aprovar).toHaveBeenCalledWith(7)
    })
  })

  it("chama recusar ao clicar em Recusar", async () => {
    vi.mocked(baixaFisicaService.list).mockResolvedValue(
      makePaginatedResponse([makeBaixa({ id: 8, status: "solicitada", status_display: "Solicitada" })])
    )
    vi.mocked(baixaFisicaService.recusar).mockResolvedValue(makeBaixaDetail())

    renderPage()
    await waitFor(() => screen.getByText("Solicitada"))

    fireEvent.click(screen.getAllByRole("checkbox")[1])
    await waitFor(() => screen.getByText(/Recusar/))
    fireEvent.click(screen.getByText(/Recusar/))

    await waitFor(() => {
      expect(baixaFisicaService.recusar).toHaveBeenCalledWith(8)
    })
  })

  it("exibe alerta de erro ao falhar no enviarSolicitacao", async () => {
    vi.mocked(baixaFisicaService.list).mockResolvedValue(
      makePaginatedResponse([makeBaixa({ status: "aguardando_envio" })])
    )
    vi.mocked(baixaFisicaService.enviarSolicitacao).mockRejectedValue(new Error("Erro"))
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => { })

    renderPage()
    await waitFor(() => screen.getByText("PROC-001"))
    fireEvent.click(screen.getAllByRole("checkbox")[1])
    await waitFor(() => screen.getByText(/Solicitar/))
    fireEvent.click(screen.getByText(/Solicitar/))

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Erro ao solicitar baixas.")
    })
    alertSpy.mockRestore()
  })

  // --- Filtros ---

  it("chama list com search ao clicar em Filtrar", async () => {
    renderPage()
    await waitFor(() => screen.getByText("Nenhum resultado encontrado."))

    fireEvent.change(screen.getByPlaceholderText("Digite o número do processo"), {
      target: { value: "PROC-XYZ" },
    })
    fireEvent.click(screen.getByText("Filtrar"))

    await waitFor(() => {
      expect(baixaFisicaService.list).toHaveBeenCalledWith(
        expect.objectContaining({ search: "PROC-XYZ", page: 1 })
      )
    })
  })

  it("dispara filtro ao pressionar Enter no campo de busca", async () => {
    renderPage()
    await waitFor(() => screen.getByText("Nenhum resultado encontrado."))

    const input = screen.getByPlaceholderText("Digite o número do processo")
    fireEvent.change(input, { target: { value: "PROC-ENTER" } })
    fireEvent.keyDown(input, { key: "Enter" })

    await waitFor(() => {
      expect(baixaFisicaService.list).toHaveBeenCalledWith(
        expect.objectContaining({ search: "PROC-ENTER" })
      )
    })
  })

  // --- Ordenação ---

  it("alterna ordenação ao clicar no header Processo", async () => {
    renderPage()
    await waitFor(() => screen.getByText("Nenhum resultado encontrado."))

    fireEvent.click(screen.getByText("Processo").closest("th")!)

    await waitFor(() => {
      expect(baixaFisicaService.list).toHaveBeenCalledWith(
        expect.objectContaining({ ordering: "numero_processo_baixa" })
      )
    })
  })

  it("inverte ordenação ao clicar duas vezes no mesmo header", async () => {
    renderPage()
    await waitFor(() => screen.getByText("Nenhum resultado encontrado."))

    const th = screen.getByText("Processo").closest("th")!
    fireEvent.click(th)
    await waitFor(() => {
      expect(baixaFisicaService.list).toHaveBeenCalledWith(
        expect.objectContaining({ ordering: "numero_processo_baixa" })
      )
    })

    fireEvent.click(th)
    await waitFor(() => {
      expect(baixaFisicaService.list).toHaveBeenCalledWith(
        expect.objectContaining({ ordering: "-numero_processo_baixa" })
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
    await waitFor(() => screen.getByText("Nenhum resultado encontrado."))
    fireEvent.click(screen.getByText("Exportar Excel"))

    await waitFor(() => {
      expect(baixaFisicaService.exportarExcel).toHaveBeenCalled()
    })
  })

  it("exibe alerta de erro ao falhar no exportarExcel", async () => {
    vi.mocked(baixaFisicaService.exportarExcel).mockRejectedValue(new Error())
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => { })

    renderPage()
    await waitFor(() => screen.getByText("Nenhum resultado encontrado."))
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
    await waitFor(() => screen.getByText("PROC-001"))
    expect(screen.queryByText(/Página/)).not.toBeInTheDocument()
  })

  it("navega para próxima página ao clicar em Próxima", async () => {
    vi.mocked(baixaFisicaService.list).mockResolvedValue(
      makePaginatedResponse([makeBaixa()], 25)
    )
    renderPage()
    await waitFor(() => screen.getByText("Página 1 de 3"))

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
    await waitFor(() => screen.getByText("Página 1 de 3"))
    expect(screen.getByText("Anterior")).toBeDisabled()
  })

  // --- Navegação ---

  it("link de visualização aponta para rota correta", async () => {
    vi.mocked(baixaFisicaService.list).mockResolvedValue(
      makePaginatedResponse([makeBaixa({ id: 42 })])
    )
    renderPage()
    await waitFor(() => screen.getByText("PROC-001"))

    const link = screen.getByRole("link")
    expect(link).toHaveAttribute("href", "/baixas-fisicas/42")
  })
})