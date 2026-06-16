import { act, render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuth } from '@/auth/useAuth'
import MovimentacoesListPage from './MovimentacoesListPage'
import { movimentacaoService } from '../services/movimentacao.service'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@/auth/useAuth')

vi.mock('@/components/AppBreadcrumb', () => ({
  AppBreadcrumb: () => <nav data-testid='breadcrumb' />,
}))

vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: any) => (
    <select
      data-testid='select'
      value={value ?? ''}
      onChange={(event) => onValueChange?.(event.target.value)}
    >
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectValue: () => null,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
}))

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange }: any) => (
    <input
      type='checkbox'
      checked={!!checked}
      onChange={(event) => onCheckedChange?.(event.target.checked)}
    />
  ),
}))

vi.mock('../services/movimentacao.service', () => ({
  movimentacaoService: {
    list: vi.fn(),
  },
}))

function makeUser() {
  return {
    id: 1,
    username: 'gestor',
    nome: 'Gestor',
    email: 'gestor@example.com',
    rf: '123456',
    is_superuser: false,
    is_gestor_patrimonio: true,
    is_operador_inventario: true,
    must_change_password: false,
    uo_ativa: null,
    ua_ativa: null,
    opcoes_escopo: {
      grupos: [
        {
          uo: {
            id: 100,
            codigo: '01.01',
            nome: 'UO 01',
            label: '01.01 - UO 01',
            selecionavel: true,
            unidade_administrativa_id: null,
            unidade_orcamentaria_id: 100,
          },
          uas: [
            {
              id: 10,
              codigo: '01.01.001',
              nome: 'UA Origem',
              label: '01.01.001 - UA Origem',
              unidade_administrativa_id: 10,
              unidade_orcamentaria_id: 100,
            },
            {
              id: 20,
              codigo: '01.01.002',
              nome: 'UA Destino',
              label: '01.01.002 - UA Destino',
              unidade_administrativa_id: 20,
              unidade_orcamentaria_id: 100,
            },
          ],
        },
      ],
    },
  }
}

function makeMovimentacao(id: number, overrides: Record<string, unknown> = {}) {
  return {
    id,
    status: 'enviada',
    status_display: 'Enviada',
    numero_cimbpm: `CIMBPM-${id}`,
    observacao: 'Observação',
    criado_em: '2026-06-01T12:00:00Z',
    atualizado_em: '2026-06-11T12:00:00Z',
    total_itens: 1,
    unidade_administrativa_origem: {
      id: 10,
      codigo: '01.01.001',
      sigla: 'UA Origem',
      nome: 'UA Origem',
    },
    unidade_orcamentaria_origem: {
      id: 100,
      codigo: '01.01',
      sigla: 'UO 01',
      nome: 'UO 01',
    },
    unidade_administrativa_destino: {
      id: 20,
      codigo: '01.01.002',
      sigla: 'UA Destino',
      nome: 'UA Destino',
    },
    unidade_orcamentaria_destino: {
      id: 100,
      codigo: '01.01',
      sigla: 'UO 01',
      nome: 'UO 01',
    },
    solicitado_por: {
      id: 5,
      username: 'solicitante',
      nome_completo: 'Solicitante Exemplo',
      email: 'solicitante@example.com',
    },
    aprovado_por: null,
    rejeitado_por: null,
    cancelado_por: null,
    itens: [],
    url_aprovar: null,
    url_rejeitar: null,
    url_cancelar: null,
    url_historico: null,
    url_documento_cimbpm: null,
    ...overrides,
  }
}

function mockListResponse(
  results: ReturnType<typeof makeMovimentacao>[],
  count = results.length,
) {
  vi.mocked(movimentacaoService.list).mockResolvedValue({
    count,
    next: null,
    previous: null,
    results,
  })
}

function renderPage() {
  return render(
    <MemoryRouter>
      <MovimentacoesListPage />
    </MemoryRouter>,
  )
}

describe('MovimentacoesListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
    vi.mocked(useAuth).mockReturnValue({
      user: makeUser(),
      isLoading: false,
      isAuthenticated: true,
      mustChangePassword: false,
      login: vi.fn(),
      logout: vi.fn(),
      isLoggingIn: false,
      loginError: null,
      loginAsync: vi.fn(),
    })

    mockListResponse([
      makeMovimentacao(1),
      makeMovimentacao(2, { status: 'aceita', status_display: 'Aceita' }),
    ], 2)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('deve renderizar o título, breadcrumb e botões principais', async () => {
    renderPage()

    await screen.findByText('Enviada')

    expect(
      screen.getByRole('heading', {
        name: 'Movimentações de Bem Patrimonial',
        level: 1,
      }),
    ).toBeInTheDocument()
    expect(screen.getByTestId('breadcrumb')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /adicionar moviment/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /voltar/i })).toBeInTheDocument()
  })

  it('deve voltar para a home ao clicar em voltar', async () => {
    renderPage()

    await screen.findByText('Enviada')
    fireEvent.click(screen.getByRole('button', { name: /voltar/i }))

    expect(mockNavigate).toHaveBeenCalledWith('/home')
  })

  it('deve listar as movimentações recebidas do serviço', async () => {
    renderPage()

    await screen.findByText('Enviada')
    expect(screen.getByText('Enviada')).toBeInTheDocument()
    expect(screen.getByText('Aceita')).toBeInTheDocument()
    expect(screen.queryByText('Solicitante Exemplo')).not.toBeInTheDocument()
  })

  it('deve navegar para cadastro ao clicar em adicionar movimentação', async () => {
    renderPage()

    await screen.findByText('Enviada')
    fireEvent.click(screen.getByRole('button', { name: /adicionar moviment/i }))

    expect(mockNavigate).toHaveBeenCalledWith('/movimentacoes/novo')
  })

  it('deve navegar para visualização ao clicar no ícone de olho', async () => {
    renderPage()

    const visualizarButton = await screen.findByLabelText('Visualizar movimentação 1')
    fireEvent.click(visualizarButton)

    expect(mockNavigate).toHaveBeenCalledWith('/movimentacoes/1')
  })

  it('deve filtrar por unidade de origem e destino', async () => {
    renderPage()
    await screen.findByText('Enviada')

    const selects = screen.getAllByTestId('select')
    fireEvent.change(selects[0], { target: { value: '10' } })
    fireEvent.change(selects[1], { target: { value: '20' } })

    await waitFor(() => {
      expect(movimentacaoService.list).toHaveBeenLastCalledWith(
        expect.objectContaining({
          unidade_administrativa_origem: 10,
          unidade_administrativa_destino: 20,
        }),
      )
    })
  })

  it('deve permitir filtrar por status em multisseleção', async () => {
    renderPage()
    await screen.findByText('Enviada')

    fireEvent.click(screen.getByRole('button', { name: /filtrar por status/i }))
    fireEvent.click(screen.getAllByRole('checkbox')[0])

    await waitFor(() => {
      expect(movimentacaoService.list).toHaveBeenLastCalledWith(
        expect.objectContaining({
          status: ['enviada'],
        }),
      )
    })
  })

  it('deve permitir filtrar movimentação atrasada', async () => {
    renderPage()
    await screen.findByText('Enviada')

    fireEvent.change(screen.getAllByTestId('select')[2], { target: { value: 'false' } })

    await waitFor(() => {
      expect(movimentacaoService.list).toHaveBeenLastCalledWith(
        expect.objectContaining({
          atrasada: 'false',
        }),
      )
    })
  })

  it('deve aplicar a busca com debounce', async () => {
    renderPage()

    await screen.findByText('Enviada')
    fireEvent.change(screen.getByPlaceholderText('Pesquise por termo específico'), {
      target: { value: 'cimbpm' },
    })

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 400))
    })

    await waitFor(() => {
      expect(movimentacaoService.list).toHaveBeenLastCalledWith(
        expect.objectContaining({
          search: 'cimbpm',
        }),
      )
    })
  })

  it('deve exibir mensagem quando não houver movimentações', async () => {
    vi.mocked(movimentacaoService.list).mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    })

    renderPage()

    expect(
      await screen.findByText('Nenhuma movimentação encontrada.'),
    ).toBeInTheDocument()
  })
})
