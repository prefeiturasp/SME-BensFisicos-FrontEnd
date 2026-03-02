import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import BensListPage from '../BensListPage'
import { useBensList } from '../../hooks/useBensList'
import { usePagination } from '../../hooks/usePagination'
import { useAuth } from '@/auth/useAuth'

const navigateMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

vi.mock('../../hooks/useBensList')
vi.mock('../../hooks/usePagination')
vi.mock('@/auth/useAuth')

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
  baixadosAntigos: false,
  ordering: '',
  setPage: vi.fn(),
  setSearchInput: vi.fn(),
  setStatusFilter: vi.fn(),
  setEscopoFilter: vi.fn(),
  setBaixadosAntigos: vi.fn(),
  setOrdering: vi.fn(),
  toggleSelect: vi.fn(),
  atualizarStatusSelecionados: vi.fn(),
} as any
function mockPage(overrides: Partial<typeof baseMock> = {}) {
  mockedUseBensList.mockReturnValueOnce({
    ...baseMock,
    ...overrides,
  } as any)
}
describe('BensListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockedUseAuth.mockReturnValue({
      user: {
        is_gestor_patrimonio: true,
        opcoes_escopo: { grupos: [] },
      },
      isLoading: false,
    } as any)

    mockedUseBensList.mockReturnValue(baseMock)
    mockedUsePagination.mockReturnValue({
      pages: [1],
      totalPages: 1,
    })
  })

  it('renderiza página corretamente', () => {
    renderWithProviders()
    expect(screen.getByRole('heading')).toHaveTextContent('Bens Patrimoniais')
    expect(screen.getByText('Notebook')).toBeInTheDocument()
  })

  it('renderiza loading', () => {
    mockedUseBensList.mockReturnValueOnce({
      ...baseMock,
      loading: true,
      bens: [],
    })
    renderWithProviders()
    expect(screen.getByText('Carregando...')).toBeInTheDocument()
  })

  it('executa toggleSelect', () => {
    const toggle = vi.fn()
    mockedUseBensList.mockReturnValueOnce({
      ...baseMock,
      toggleSelect: toggle,
    })
    renderWithProviders()
    fireEvent.click(screen.getAllByRole('checkbox')[1])
    expect(toggle).toHaveBeenCalledTimes(1)
  })

  it('cobre completamente handleSort (3 estados)', () => {
    let currentOrdering = ''
    const setOrdering = vi.fn((callback) => {
      currentOrdering = callback(currentOrdering)
    })
    const setPage = vi.fn()

    mockedUseBensList.mockReturnValueOnce({
      ...baseMock,
      ordering: currentOrdering,
      setOrdering,
      setPage,
    })

    renderWithProviders()

    const header = screen.getByText('Nome do Bem')

    fireEvent.click(header) // '' -> nome
    fireEvent.click(header) // nome -> -nome
    fireEvent.click(header) // -nome -> ''

    expect(setOrdering).toHaveBeenCalledTimes(3)
  })

  it('cobre variações de possuiSelecionados', () => {
    mockedUseBensList.mockReturnValueOnce({
      ...baseMock,
      selectedIds: [1],
    })

    renderWithProviders()
    expect(screen.getByText(/Aprovar/)).toBeInTheDocument()
    expect(screen.getByText(/Reprovar/)).toBeInTheDocument()
  })

  it('não exibe Aprovar se não for gestor', () => {
    mockedUseAuth.mockReturnValueOnce({
      user: { is_gestor_patrimonio: false, opcoes_escopo: { grupos: [] } },
      isLoading: false,
    } as any)

    mockedUseBensList.mockReturnValueOnce({
      ...baseMock,
      selectedIds: [1],
    })

    renderWithProviders()
    expect(screen.queryByText(/Aprovar/)).not.toBeInTheDocument()
  })

  it('executa atualizarStatusSelecionados', () => {
    const atualizar = vi.fn()
    mockedUseBensList.mockReturnValueOnce({
      ...baseMock,
      selectedIds: [1],
      atualizarStatusSelecionados: atualizar,
    })

    renderWithProviders()
    fireEvent.click(screen.getByText(/Aprovar/))
    fireEvent.click(screen.getByText(/Reprovar/))

    expect(atualizar).toHaveBeenCalledTimes(2)
  })

  it('executa paginação', () => {
    const setPage = vi.fn()

    mockedUseBensList.mockReturnValueOnce({
      ...baseMock,
      setPage,
    })

    mockedUsePagination.mockReturnValueOnce({
      pages: [1, 2],
      totalPages: 2,
    })

    renderWithProviders()
    fireEvent.click(screen.getByText('2'))
    fireEvent.click(screen.getByText('›'))

    expect(setPage).toHaveBeenCalled()
  })

  it('navega corretamente', () => {
    renderWithProviders()

    fireEvent.click(screen.getByText('Novo Cadastro'))
    fireEvent.click(screen.getByLabelText('Visualizar bem'))

    expect(navigateMock).toHaveBeenCalled()
  })

  it('renderiza fallback "-"', () => {
    mockedUseBensList.mockReturnValueOnce({
      ...baseMock,
      bens: [{ ...defaultBem, numero_patrimonial: undefined }],
    })

    renderWithProviders()

    const cell = screen.getAllByRole('cell').find(c => c.textContent === '-')
    expect(cell).toBeTruthy()
  })

  it('deve chamar setSearchInput ao digitar no campo de busca', () => {
    const setSearchInput = vi.fn()

    mockPage({ setSearchInput })

    renderWithProviders()

    const input = screen.getByPlaceholderText(
        'Digite o número patrimonial ou Nome do Bem'
    )

    fireEvent.change(input, { target: { value: 'abc' } })

    expect(setSearchInput).toHaveBeenCalledWith('abc')
  })

  it('deve desabilitar o checkbox quando status não for aguardando_aprovacao', () => {
    mockPage({
        bens: [{ ...defaultBem, status: 'aprovado' }],
    })

    renderWithProviders()

    const checkbox = screen.getAllByRole('checkbox')[1]
    expect(checkbox).toBeDisabled()
  })

  it('deve marcar checkbox quando bem estiver em selectedIds', () => {
    mockPage({
        selectedIds: [1],
    })

    renderWithProviders()

    const checkbox = screen.getAllByRole('checkbox')[1]
    expect(checkbox).toBeChecked()
  })
  it('deve renderizar ícone de ordenação como inativo quando ordering não inclui o campo', () => {
    mockPage({ ordering: '' })

    renderWithProviders()

    const header = screen.getByText('Nome do Bem')

    const icon = header.parentElement?.querySelector('svg')
    expect(icon?.getAttribute('class') || '').toContain('text-gray-400')
   })

   it('deve renderizar ícone de ordenação como inativo quando ordering não inclui o campo', () => {
    mockPage({ ordering: '' })

    renderWithProviders()

    const header = screen.getByText('Nome do Bem')
    // pega o svg dentro do header
    const icon = header.parentElement?.querySelector('svg')
    expect(icon?.getAttribute('class') || '').toContain('text-gray-400')
   })

   it('deve renderizar ícone de ordenação como ativo quando ordering inclui o campo', () => {
    mockPage({ ordering: 'nome' })

    renderWithProviders()

    const header = screen.getByText('Nome do Bem')
    const icon = header.parentElement?.querySelector('svg')
    expect(icon?.getAttribute('class') || '').toContain('text-[#00703C]')
   })

   it('deve avançar página ao clicar no botão "›"', () => {
    const setPage = vi.fn()

    mockPage({ page: 1, setPage })

    mockedUsePagination.mockReturnValueOnce({
        pages: [1, 2],
        totalPages: 2,
    })

    renderWithProviders()

    fireEvent.click(screen.getByText('›'))
    expect(setPage).toHaveBeenCalledWith(2)
    })

    it('deve voltar página ao clicar no botão "‹"', () => {
        const setPage = vi.fn()

        mockPage({ page: 2, setPage })

        mockedUsePagination.mockReturnValueOnce({
            pages: [1, 2],
            totalPages: 2,
        })

        renderWithProviders()

        fireEvent.click(screen.getByText('‹'))
        expect(setPage).toHaveBeenCalledWith(1)
    })

    it('deve desabilitar "‹" quando page=1', () => {
        mockPage({ page: 1 })

        mockedUsePagination.mockReturnValueOnce({
            pages: [1, 2],
            totalPages: 2,
        })

        renderWithProviders()

        const prev = screen.getByText('‹').closest('button')
        expect(prev).toBeDisabled()
    })

    it('deve desabilitar "›" quando page=totalPages', () => {
        mockPage({ page: 2 })

        mockedUsePagination.mockReturnValueOnce({
            pages: [1, 2],
            totalPages: 2,
        })

        renderWithProviders()

        const next = screen.getByText('›').closest('button')
        expect(next).toBeDisabled()
    })
    
    it('deve renderizar "..." quando pagination trouxer ellipsis', () => {
        mockedUsePagination.mockReturnValueOnce({
            pages: [1, '...', 10],
            totalPages: 10,
        })

        renderWithProviders()

        expect(screen.getByText('...')).toBeInTheDocument()
    })
})