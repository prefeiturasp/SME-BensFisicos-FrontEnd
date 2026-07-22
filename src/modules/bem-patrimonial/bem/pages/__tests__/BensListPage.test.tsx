import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import BensListPage from '../BensListPage'
import { useBensList } from '../../hooks/useBensList'
import { usePagination } from '../../hooks/usePagination'
import { useAuth } from '@/auth/useAuth'

const navigateMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom')
  return { ...actual, useNavigate: () => navigateMock }
})

vi.mock('../../hooks/useBensList')
vi.mock('../../hooks/usePagination')
vi.mock('@/auth/useAuth')

// Radix Select não abre em jsdom sem stubs de pointer capture.
// Como os hooks já estão mockados, trocamos por um <select> nativo.
vi.mock('@/components/ui/select', () => ({
  Select: ({ id, value, onValueChange, children }: any) => (
    <select
      data-testid={id ?? 'select'}
      value={value}
      onChange={e => onValueChange(e.target.value)}
    >
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectValue: () => null,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
}))

vi.mock('@/components/EscopoFilterDropdown', () => ({
  EscopoFilterDropdown: ({ id, grupos, value, onChange }: any) => (
    <button
      data-testid={id}
      data-grupos={grupos.length}
      data-value={value}
      onClick={() => onChange('002')}
    >
      escopo
    </button>
  ),
}))

const mockedUseBensList = vi.mocked(useBensList)
const mockedUsePagination = vi.mocked(usePagination)
const mockedUseAuth = vi.mocked(useAuth)

function renderWithProviders() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <BensListPage />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

const defaultBem = {
  id: 1,
  nome: 'Notebook',
  numero_patrimonial: '123',
  unidade_administrativa_codigo: '001',
  unidade_administrativa_nome: 'Administração',
  unidade_orcamentaria_nome: 'Financeiro',
  status: 'aguardando_aprovacao',
  status_display: 'Aguardando aprovação',
}

const baseMock = {
  bens: [defaultBem],
  selectedIds: [],
  page: 1,
  count: 1,
  loading: false,
  searchInput: '',
  statusFilter: 'todos',
  escopoFilter: 'todas',
  bensBaixados: false,
  buscaGeralUos: false,
  ordering: '',
  setPage: vi.fn(),
  setSearchInput: vi.fn(),
  setStatusFilter: vi.fn(),
  setEscopoFilter: vi.fn(),
  setBensBaixados: vi.fn(),
  setBuscaGeralUos: vi.fn(),
  setOrdering: vi.fn(),
  toggleSelect: vi.fn(),
  atualizarStatusSelecionados: vi.fn(),
} as any

function mockPage(overrides: Partial<typeof baseMock> = {}) {
  mockedUseBensList.mockReturnValueOnce({ ...baseMock, ...overrides })
}

function bodyCheckboxes() {
  const table = screen.getByRole('table')
  return Array.from(
    table.querySelectorAll('tbody input[type="checkbox"]')
  ) as HTMLInputElement[]
}

describe('BensListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockedUseAuth.mockReturnValue({
      user: {
        id: 7,
        is_gestor_patrimonio: true,
        opcoes_escopo: { grupos: [] },
      },
      isLoading: false,
    } as any)

    mockedUseBensList.mockReturnValue(baseMock)
    mockedUsePagination.mockReturnValue({ pages: [1], totalPages: 1 })
  })

  // ===============================
  // RENDER BÁSICO
  // ===============================

  it('renderiza página corretamente', () => {
    renderWithProviders()
    expect(screen.getByRole('heading')).toHaveTextContent('Bens Patrimoniais')
    expect(screen.getByText('Notebook')).toBeInTheDocument()
  })

  it('renderiza loading', () => {
    mockPage({ loading: true, bens: [] })
    renderWithProviders()
    expect(screen.getByText('Carregando...')).toBeInTheDocument()
    expect(bodyCheckboxes()).toHaveLength(0)
  })

  it('renderiza tabela sem linhas quando a lista vier vazia', () => {
    mockPage({ bens: [], count: 0 })
    renderWithProviders()
    expect(screen.queryByText('Carregando...')).not.toBeInTheDocument()
    expect(bodyCheckboxes()).toHaveLength(0)
  })

  it('renderiza uma linha por bem retornado', () => {
    mockPage({
      bens: [defaultBem, { ...defaultBem, id: 2, nome: 'Monitor' }],
      count: 2,
    })
    renderWithProviders()
    expect(screen.getByText('Notebook')).toBeInTheDocument()
    expect(screen.getByText('Monitor')).toBeInTheDocument()
    expect(bodyCheckboxes()).toHaveLength(2)
  })

  it('renderiza a unidade administrativa como "código - nome"', () => {
    renderWithProviders()
    const linha = screen.getByText('Notebook').closest('tr')!
    expect(within(linha).getByText(/001\s*-\s*Administração/)).toBeInTheDocument()
  })

  it('renderiza fallback "-" quando não houver número patrimonial', () => {
    mockPage({ bens: [{ ...defaultBem, numero_patrimonial: null }] })
    renderWithProviders()
    const cell = screen.getAllByRole('cell').find(c => c.textContent === '-')
    expect(cell).toBeTruthy()
  })

  // ===============================
  // SELEÇÃO
  // ===============================

  it('executa toggleSelect', () => {
    const toggleSelect = vi.fn()
    mockPage({ toggleSelect })
    renderWithProviders()
    fireEvent.click(bodyCheckboxes()[0])
    expect(toggleSelect).toHaveBeenCalledTimes(1)
    expect(toggleSelect).toHaveBeenCalledWith(defaultBem)
  })

  it('desabilita o checkbox quando status não for aguardando_aprovacao', () => {
    mockPage({ bens: [{ ...defaultBem, status: 'aprovado' }] })
    renderWithProviders()
    expect(bodyCheckboxes()[0]).toBeDisabled()
  })

  it('marca checkbox quando o bem estiver em selectedIds', () => {
    mockPage({ selectedIds: [1] })
    renderWithProviders()
    expect(bodyCheckboxes()[0]).toBeChecked()
  })

  // ===============================
  // AÇÕES EM LOTE / PERMISSÃO
  // ===============================

  it('exibe Aprovar e Reprovar quando gestor tem itens selecionados', () => {
    mockPage({ selectedIds: [1, 2] })
    renderWithProviders()
    expect(screen.getByText('Aprovar (2)')).toBeInTheDocument()
    expect(screen.getByText('Reprovar (2)')).toBeInTheDocument()
  })

  it('não exibe Aprovar quando não há seleção', () => {
    renderWithProviders()
    expect(screen.queryByText(/Aprovar/)).not.toBeInTheDocument()
  })

  it('não exibe Aprovar se não for gestor', () => {
    mockedUseAuth.mockReturnValueOnce({
      user: { id: 7, is_gestor_patrimonio: false, opcoes_escopo: { grupos: [] } },
      isLoading: false,
    } as any)
    mockPage({ selectedIds: [1] })
    renderWithProviders()
    expect(screen.queryByText(/Aprovar/)).not.toBeInTheDocument()
  })

  it('trata usuário nulo sem quebrar e sem exibir ações de gestor', () => {
    mockedUseAuth.mockReturnValueOnce({ user: null, isLoading: false } as any)
    mockPage({ selectedIds: [1] })
    renderWithProviders()
    expect(screen.getByRole('heading')).toHaveTextContent('Bens Patrimoniais')
    expect(screen.queryByText(/Aprovar/)).not.toBeInTheDocument()
  })

  it('usa lista de grupos vazia quando opcoes_escopo não estiver definido', () => {
    mockedUseAuth.mockReturnValueOnce({
      user: { id: 7, is_gestor_patrimonio: true },
      isLoading: false,
    } as any)
    renderWithProviders()
    expect(screen.getByTestId('filtro-unidade')).toHaveAttribute('data-grupos', '0')
  })

  it('executa atualizarStatusSelecionados com os argumentos corretos', () => {
    const atualizarStatusSelecionados = vi.fn()
    mockPage({ selectedIds: [1], atualizarStatusSelecionados })
    renderWithProviders()

    fireEvent.click(screen.getByText(/Aprovar/))
    fireEvent.click(screen.getByText(/Reprovar/))

    expect(atualizarStatusSelecionados).toHaveBeenNthCalledWith(
      1,
      'aprovar',
      'Bens aprovados com sucesso',
      'Erro ao aprovar bens'
    )
    expect(atualizarStatusSelecionados).toHaveBeenNthCalledWith(
      2,
      'reprovar',
      'Bens reprovados com sucesso',
      'Erro ao reprovar bens'
    )
  })

  // ===============================
  // NAVEGAÇÃO
  // ===============================

  it('navega para novo cadastro', () => {
    renderWithProviders()
    fireEvent.click(screen.getByText('Novo Cadastro'))
    expect(navigateMock).toHaveBeenCalledWith('/bens-patrimoniais/novo')
  })

  it('navega para a importação de bens', () => {
    renderWithProviders()
    fireEvent.click(screen.getByText('Importar Bens'))
    expect(navigateMock).toHaveBeenCalledWith('/bens-patrimoniais/importar')
  })

  it('navega para o detalhe do bem', () => {
    mockPage({ bens: [{ ...defaultBem, id: 42 }] })
    renderWithProviders()
    fireEvent.click(screen.getByLabelText('Visualizar bem'))
    expect(navigateMock).toHaveBeenCalledWith('/bens-patrimoniais/42')
  })

  it('volta para a página anterior no botão de voltar', () => {
    renderWithProviders()
    const voltar = screen
      .getAllByRole('button')
      .find(b => b.querySelector('svg.lucide-arrow-left'))!
    fireEvent.click(voltar)
    expect(navigateMock).toHaveBeenCalledWith(-1)
  })

  it('exibe o botão de relatório sem disparar navegação', () => {
    renderWithProviders()
    fireEvent.click(screen.getByText('Relatório'))
    expect(navigateMock).not.toHaveBeenCalled()
  })

  // ===============================
  // FILTROS
  // ===============================

  it('chama setSearchInput ao digitar no campo de busca', () => {
    const setSearchInput = vi.fn()
    mockPage({ setSearchInput })
    renderWithProviders()

    fireEvent.change(
      screen.getByPlaceholderText('Digite o número patrimonial ou Nome do Bem'),
      { target: { value: 'abc' } }
    )

    expect(setSearchInput).toHaveBeenCalledWith('abc')
  })

  it('atualiza o status e volta para a primeira página', () => {
    const setStatusFilter = vi.fn()
    const setPage = vi.fn()
    mockPage({ setStatusFilter, setPage })
    renderWithProviders()

    fireEvent.change(screen.getByTestId('filtro-status'), {
      target: { value: 'aprovado' },
    })

    expect(setStatusFilter).toHaveBeenCalledWith('aprovado')
    expect(setPage).toHaveBeenCalledWith(1)
  })

  it('atualiza o escopo e volta para a primeira página', () => {
    const setEscopoFilter = vi.fn()
    const setPage = vi.fn()
    mockPage({ setEscopoFilter, setPage })
    renderWithProviders()

    fireEvent.click(screen.getByTestId('filtro-unidade'))

    expect(setEscopoFilter).toHaveBeenCalledWith('002')
    expect(setPage).toHaveBeenCalledWith(1)
  })

  it('define escopo como "todas" ao marcar busca geral em todas as UOs', () => {
    const setBuscaGeralUos = vi.fn()
    const setEscopoFilter = vi.fn()
    const setPage = vi.fn()
    mockPage({ buscaGeralUos: false, setBuscaGeralUos, setEscopoFilter, setPage })
    renderWithProviders()

    fireEvent.click(screen.getByLabelText('Busca geral em todas as UOs'))

    expect(setBuscaGeralUos).toHaveBeenCalledWith(true)
    expect(setEscopoFilter).toHaveBeenCalledWith('todas')
    expect(setPage).toHaveBeenCalledWith(1)
  })

  it('não redefine o escopo ao desmarcar busca geral em todas as UOs', () => {
    const setBuscaGeralUos = vi.fn()
    const setEscopoFilter = vi.fn()
    const setPage = vi.fn()
    mockPage({ buscaGeralUos: true, setBuscaGeralUos, setEscopoFilter, setPage })
    renderWithProviders()

    fireEvent.click(screen.getByLabelText('Busca geral em todas as UOs'))

    expect(setBuscaGeralUos).toHaveBeenCalledWith(false)
    expect(setEscopoFilter).not.toHaveBeenCalled()
    expect(setPage).toHaveBeenCalledWith(1)
  })

  it('alterna o filtro de bens baixados e volta para a primeira página', () => {
    const setBensBaixados = vi.fn()
    const setPage = vi.fn()
    mockPage({ bensBaixados: false, setBensBaixados, setPage })
    renderWithProviders()

    fireEvent.click(screen.getByLabelText('Bens Baixados'))

    expect(setBensBaixados).toHaveBeenCalledWith(true)
    expect(setPage).toHaveBeenCalledWith(1)
  })

  // ===============================
  // ORDENAÇÃO
  // ===============================

  it('cobre os três estados de handleSort', () => {
    let currentOrdering = ''
    const setOrdering = vi.fn(callback => {
      currentOrdering = callback(currentOrdering)
    })
    mockPage({ ordering: currentOrdering, setOrdering })
    renderWithProviders()

    const header = screen.getByText('Nome do Bem')

    fireEvent.click(header)
    expect(currentOrdering).toBe('nome')

    fireEvent.click(header)
    expect(currentOrdering).toBe('-nome')

    fireEvent.click(header)
    expect(currentOrdering).toBe('')

    expect(setOrdering).toHaveBeenCalledTimes(3)
  })

  it('mapeia a coluna de unidade para o campo do backend', () => {
    let currentOrdering = ''
    const setOrdering = vi.fn(callback => {
      currentOrdering = callback(currentOrdering)
    })
    mockPage({ setOrdering })
    renderWithProviders()

    fireEvent.click(screen.getByText('Unidade Administrativa'))

    expect(currentOrdering).toBe('unidade_administrativa__nome')
  })

  it('reseta a paginação ao ordenar', () => {
    const setPage = vi.fn()
    mockPage({ page: 3, setPage })
    renderWithProviders()

    fireEvent.click(screen.getByText('Situação'))

    expect(setPage).toHaveBeenCalledWith(1)
  })

  it('renderiza o ícone de ordenação inativo quando ordering não inclui o campo', () => {
    mockPage({ ordering: '' })
    renderWithProviders()

    const icon = screen.getByText('Nome do Bem').parentElement?.querySelector('svg')
    expect(icon?.getAttribute('class') || '').toContain('text-gray-400')
  })

  it('renderiza o ícone de ordenação ativo quando ordering inclui o campo', () => {
    mockPage({ ordering: 'nome' })
    renderWithProviders()

    const icon = screen.getByText('Nome do Bem').parentElement?.querySelector('svg')
    expect(icon?.getAttribute('class') || '').toContain('text-[#00703C]')
  })

  it('mantém o ícone ativo na ordenação descendente', () => {
    mockPage({ ordering: '-status' })
    renderWithProviders()

    const icon = screen.getByText('Situação').parentElement?.querySelector('svg')
    expect(icon?.getAttribute('class') || '').toContain('text-[#00703C]')
  })

  // ===============================
  // PAGINAÇÃO
  // ===============================

  it('vai para a página clicada', () => {
    const setPage = vi.fn()
    mockPage({ setPage })
    mockedUsePagination.mockReturnValueOnce({ pages: [1, 2], totalPages: 2 })
    renderWithProviders()

    fireEvent.click(screen.getByText('2'))
    expect(setPage).toHaveBeenCalledWith(2)
  })

  it('avança a página ao clicar em "›"', () => {
    const setPage = vi.fn()
    mockPage({ page: 1, setPage })
    mockedUsePagination.mockReturnValueOnce({ pages: [1, 2], totalPages: 2 })
    renderWithProviders()

    fireEvent.click(screen.getByText('›'))
    expect(setPage).toHaveBeenCalledWith(2)
  })

  it('volta a página ao clicar em "‹"', () => {
    const setPage = vi.fn()
    mockPage({ page: 2, setPage })
    mockedUsePagination.mockReturnValueOnce({ pages: [1, 2], totalPages: 2 })
    renderWithProviders()

    fireEvent.click(screen.getByText('‹'))
    expect(setPage).toHaveBeenCalledWith(1)
  })

  it('desabilita "‹" quando page=1', () => {
    mockPage({ page: 1 })
    mockedUsePagination.mockReturnValueOnce({ pages: [1, 2], totalPages: 2 })
    renderWithProviders()

    expect(screen.getByText('‹').closest('button')).toBeDisabled()
  })

  it('desabilita "›" quando page=totalPages', () => {
    mockPage({ page: 2 })
    mockedUsePagination.mockReturnValueOnce({ pages: [1, 2], totalPages: 2 })
    renderWithProviders()

    expect(screen.getByText('›').closest('button')).toBeDisabled()
  })

  it('destaca o botão da página atual', () => {
    mockPage({ page: 2 })
    mockedUsePagination.mockReturnValueOnce({ pages: [1, 2], totalPages: 2 })
    renderWithProviders()

    expect(screen.getByText('2').closest('button')?.className).toContain('bg-[#00703C]')
    expect(screen.getByText('1').closest('button')?.className).not.toContain('bg-[#00703C]')
  })

  it('renderiza "..." quando a paginação trouxer ellipsis', () => {
    mockedUsePagination.mockReturnValueOnce({ pages: [1, '...', 10], totalPages: 10 })
    renderWithProviders()

    expect(screen.getByText('...')).toBeInTheDocument()
  })

  it('repassa pageSize e persistKey do usuário para o hook', () => {
    renderWithProviders()
    expect(mockedUseBensList).toHaveBeenCalledWith({
      pageSize: 10,
      persistKey: 'bens-list:7',
    })
  })

  it('usa persistKey anônima quando não houver usuário', () => {
    mockedUseAuth.mockReturnValueOnce({ user: null, isLoading: false } as any)
    renderWithProviders()
    expect(mockedUseBensList).toHaveBeenCalledWith({
      pageSize: 10,
      persistKey: 'bens-list:anon',
    })
  })
})