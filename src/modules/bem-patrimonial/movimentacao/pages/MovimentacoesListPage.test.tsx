import { act, render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'sonner'

import { useAuth } from '@/auth/useAuth'
import MovimentacoesListPage, { isMovimentacaoAtrasada } from './MovimentacoesListPage'
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
  Checkbox: ({ checked, onCheckedChange, ...props }: any) => (
    <input
      type='checkbox'
      checked={!!checked}
      onChange={(event) => {
        if (props.disabled) return
        onCheckedChange?.(event.target.checked)
      }}
      {...props}
    />
  ),
}))

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: any) => <>{children}</>,
  TooltipTrigger: ({ children, asChild }: any) => (asChild ? <>{children}</> : <span>{children}</span>),
  TooltipContent: ({ children }: any) => <div role='tooltip'>{children}</div>,
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('../services/movimentacao.service', () => ({
  movimentacaoService: {
    list: vi.fn(),
    aprovar: vi.fn(),
    rejeitar: vi.fn(),
    cancelar: vi.fn(),
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

function mockActionResponses() {
  vi.mocked(movimentacaoService.aprovar).mockResolvedValue(makeMovimentacao(1))
  vi.mocked(movimentacaoService.rejeitar).mockResolvedValue(makeMovimentacao(1, { status: 'rejeitada', status_display: 'Rejeitada' }))
  vi.mocked(movimentacaoService.cancelar).mockResolvedValue(makeMovimentacao(1, { status: 'cancelada', status_display: 'Cancelada' }))
}

function renderPage() {
  return render(
    <MemoryRouter>
      <MovimentacoesListPage />
    </MemoryRouter>,
  )
}

function mockAuthenticatedUser(user: ReturnType<typeof makeUser>) {
  vi.mocked(useAuth).mockReturnValue({
    user,
    isLoading: false,
    isAuthenticated: true,
    mustChangePassword: false,
    login: vi.fn(),
    logout: vi.fn(),
    isLoggingIn: false,
    loginError: null,
    loginAsync: vi.fn(),
  })
}

// ─── testes unitários do helper ────────────────────────────────────────────
describe('isMovimentacaoAtrasada', () => {
  it('retorna true para movimentação enviada criada há mais de 7 dias', () => {
    const criado_em = new Date()
    criado_em.setDate(criado_em.getDate() - 8)
    expect(
      isMovimentacaoAtrasada({ status: 'enviada', criado_em: criado_em.toISOString() }),
    ).toBe(true)
  })

  it('retorna true para movimentação enviada criada há exatamente 7 dias', () => {
    const criado_em = new Date()
    criado_em.setDate(criado_em.getDate() - 7)
    criado_em.setSeconds(criado_em.getSeconds() - 1)
    expect(
      isMovimentacaoAtrasada({ status: 'enviada', criado_em: criado_em.toISOString() }),
    ).toBe(true)
  })

  it('retorna false para movimentação enviada criada há menos de 7 dias', () => {
    const criado_em = new Date()
    criado_em.setDate(criado_em.getDate() - 3)
    expect(
      isMovimentacaoAtrasada({ status: 'enviada', criado_em: criado_em.toISOString() }),
    ).toBe(false)
  })

  it('retorna false para movimentação aceita mesmo que antiga', () => {
    const criado_em = new Date()
    criado_em.setDate(criado_em.getDate() - 30)
    expect(
      isMovimentacaoAtrasada({ status: 'aceita', criado_em: criado_em.toISOString() }),
    ).toBe(false)
  })

  it('retorna false para movimentação rejeitada mesmo que antiga', () => {
    const criado_em = new Date()
    criado_em.setDate(criado_em.getDate() - 30)
    expect(
      isMovimentacaoAtrasada({ status: 'rejeitada', criado_em: criado_em.toISOString() }),
    ).toBe(false)
  })

  it('retorna false para movimentação cancelada mesmo que antiga', () => {
    const criado_em = new Date()
    criado_em.setDate(criado_em.getDate() - 30)
    expect(
      isMovimentacaoAtrasada({ status: 'cancelada', criado_em: criado_em.toISOString() }),
    ).toBe(false)
  })

  it('retorna false para data inválida', () => {
    expect(
      isMovimentacaoAtrasada({ status: 'enviada', criado_em: 'data-invalida' }),
    ).toBe(false)
  })
})

// ─── testes de integração da página ────────────────────────────────────────
describe('MovimentacoesListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
    mockAuthenticatedUser(makeUser())

    mockListResponse([
      makeMovimentacao(1),
      makeMovimentacao(2, { status: 'aceita', status_display: 'Aceita' }),
    ], 2)
    mockActionResponses()
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
    expect(screen.getByRole('button', { name: /aprovar/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /rejeitar/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeDisabled()
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
    expect(screen.getByText('CIMBPM-1')).toBeInTheDocument()
    expect(screen.getByLabelText('Selecionar movimentação 1')).toBeEnabled()
    expect(screen.getByLabelText('Selecionar movimentação 2')).toBeDisabled()
  })

  it('deve selecionar apenas movimentações elegíveis ao marcar selecionar todas', async () => {
    renderPage()

    await screen.findByText('Enviada')
    fireEvent.click(screen.getByLabelText('Selecionar todas as movimentações elegíveis'))

    expect(screen.getByLabelText('Selecionar movimentação 1')).toBeChecked()
    expect(screen.getByLabelText('Selecionar movimentação 2')).toBeDisabled()
    expect(screen.getByRole('button', { name: /aprovar/i })).toBeEnabled()
    expect(screen.getByRole('button', { name: /rejeitar/i })).toBeEnabled()
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeEnabled()
  })

  it('deve aprovar a movimentação selecionada', async () => {
    renderPage()

    await screen.findByText('Enviada')
    fireEvent.click(screen.getByLabelText('Selecionar movimentação 1'))
    fireEvent.click(screen.getByRole('button', { name: /aprovar/i }))

    await waitFor(() => {
      expect(movimentacaoService.aprovar).toHaveBeenCalledWith(1)
      expect(toast.success).toHaveBeenCalledWith(
        'Movimentação #0001 aprovada com sucesso. Bens desbloqueados.',
      )
    })
  })

  it('deve cancelar a movimentação selecionada', async () => {
    renderPage()

    await screen.findByText('Enviada')
    fireEvent.click(screen.getByLabelText('Selecionar movimentação 1'))
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }))

    await waitFor(() => {
      expect(movimentacaoService.cancelar).toHaveBeenCalledWith(1)
      expect(toast.success).toHaveBeenCalledWith(
        'Movimentação #0001 cancelada com sucesso. Bens desbloqueados.',
      )
    })
  })

  it('deve rejeitar a movimentação selecionada', async () => {
    renderPage()

    await screen.findByText('Enviada')
    fireEvent.click(screen.getByLabelText('Selecionar movimentação 1'))
    fireEvent.click(screen.getByRole('button', { name: /rejeitar/i }))

    await waitFor(() => {
      expect(movimentacaoService.rejeitar).toHaveBeenCalledWith(1)
      expect(toast.success).toHaveBeenCalledWith(
        'Movimentação #0001 rejeitada com sucesso. Bens desbloqueados.',
      )
    })
  })

  it('deve exibir apenas cancelar quando o usuário for operador', async () => {
    mockAuthenticatedUser({
      ...makeUser(),
      is_gestor_patrimonio: false,
      is_operador_inventario: true,
    })

    renderPage()

    await screen.findByText('Enviada')

    expect(screen.queryByRole('button', { name: /aprovar/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /rejeitar/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeDisabled()
  })

  it('deve exibir cancelar quando o usuário for gestor', async () => {
    mockAuthenticatedUser({
      ...makeUser(),
      is_gestor_patrimonio: true,
      is_operador_inventario: false,
    })

    renderPage()

    await screen.findByText('Enviada')

    expect(screen.getByRole('button', { name: /aprovar/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /rejeitar/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeDisabled()
  })

  it('deve impedir operador de selecionar movimentações de outro usuário', async () => {
    mockAuthenticatedUser({
      ...makeUser(),
      id: 10,
      is_gestor_patrimonio: false,
      is_operador_inventario: true,
    })

    mockListResponse([
      makeMovimentacao(1, {
        solicitado_por: {
          id: 10,
          username: 'operador',
          nome_completo: 'Operador Exemplo',
          email: 'operador@example.com',
        },
      }),
      makeMovimentacao(2, {
        solicitado_por: {
          id: 99,
          username: 'outro',
          nome_completo: 'Outro Usuário',
          email: 'outro@example.com',
        },
      }),
    ], 2)

    renderPage()

    await screen.findByLabelText('Selecionar movimentação 1')

    expect(screen.getByLabelText('Selecionar movimentação 1')).toBeEnabled()
    expect(screen.getByLabelText('Selecionar movimentação 2')).toBeDisabled()

    fireEvent.click(screen.getByLabelText('Selecionar movimentação 2'))
    expect(screen.getByLabelText('Selecionar movimentação 2')).not.toBeChecked()
  })

  it('deve impedir operador de selecionar movimentação que não está enviada', async () => {
    mockAuthenticatedUser({
      ...makeUser(),
      is_gestor_patrimonio: false,
      is_operador_inventario: true,
    })

    mockListResponse([
      makeMovimentacao(1, {
        solicitado_por: {
          id: 1,
          username: 'operador',
          nome_completo: 'Operador Exemplo',
          email: 'operador@example.com',
        },
      }),
      makeMovimentacao(2, {
        status: 'aceita',
        status_display: 'Aceita',
        solicitado_por: {
          id: 1,
          username: 'operador',
          nome_completo: 'Operador Exemplo',
          email: 'operador@example.com',
        },
      }),
    ], 2)

    renderPage()

    await screen.findByText('Aceita')

    expect(screen.getByLabelText('Selecionar movimentação 1')).toBeEnabled()
    expect(screen.getByLabelText('Selecionar movimentação 2')).toBeDisabled()

    fireEvent.click(screen.getByLabelText('Selecionar movimentação 2'))
    expect(screen.getByLabelText('Selecionar movimentação 2')).not.toBeChecked()
  })

  it('deve exibir erro da api ao aprovar movimentação', async () => {
    vi.mocked(movimentacaoService.aprovar).mockRejectedValueOnce(
      new Error('Erro ao aprovar movimentação'),
    )

    renderPage()

    await screen.findByText('Enviada')
    fireEvent.click(screen.getByLabelText('Selecionar movimentação 1'))
    fireEvent.click(screen.getByRole('button', { name: /aprovar/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Erro ao aprovar movimentação')
    })
  })

  it('deve exibir erro da api ao cancelar movimentação', async () => {
    vi.mocked(movimentacaoService.cancelar).mockRejectedValueOnce(
      new Error('Erro ao cancelar movimentação'),
    )

    renderPage()

    await screen.findByText('Enviada')
    fireEvent.click(screen.getByLabelText('Selecionar movimentação 1'))
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Erro ao cancelar movimentação')
    })
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

  // ─── testes do indicador de atraso ───────────────────────────────────────
  describe('indicador de movimentação atrasada', () => {
    it('deve exibir o ícone de alerta para movimentação enviada há mais de 7 dias', async () => {
      const criado_em = new Date()
      criado_em.setDate(criado_em.getDate() - 8)

      mockListResponse([
        makeMovimentacao(1, { criado_em: criado_em.toISOString() }),
      ])

      renderPage()

      await screen.findByText('Enviada')

      expect(screen.getByTestId('alerta-atrasada')).toBeInTheDocument()
      expect(screen.getByLabelText('Movimentação em atraso')).toBeInTheDocument()
    })

    it('deve exibir o tooltip de atraso ao renderizar o alerta', async () => {
      const criado_em = new Date()
      criado_em.setDate(criado_em.getDate() - 8)

      mockListResponse([
        makeMovimentacao(1, { criado_em: criado_em.toISOString() }),
      ])

      renderPage()

      await screen.findByText('Enviada')

      expect(screen.getByRole('tooltip')).toHaveTextContent(
        'Movimentação pendente há mais de 7 dias',
      )
    })

    it('não deve exibir o ícone de alerta para movimentação enviada há menos de 7 dias', async () => {
      const criado_em = new Date()
      criado_em.setDate(criado_em.getDate() - 3)

      mockListResponse([
        makeMovimentacao(1, { criado_em: criado_em.toISOString() }),
      ])

      renderPage()

      await screen.findByText('Enviada')

      expect(screen.queryByTestId('alerta-atrasada')).not.toBeInTheDocument()
    })

    it('não deve exibir o ícone de alerta para movimentação aceita mesmo que antiga', async () => {
      const criado_em = new Date()
      criado_em.setDate(criado_em.getDate() - 30)

      mockListResponse([
        makeMovimentacao(1, {
          status: 'aceita',
          status_display: 'Aceita',
          criado_em: criado_em.toISOString(),
        }),
      ])

      renderPage()

      await screen.findByText('Aceita')

      expect(screen.queryByTestId('alerta-atrasada')).not.toBeInTheDocument()
    })

    it('deve exibir alerta apenas para movimentações atrasadas em lista mista', async () => {
      const antiga = new Date()
      antiga.setDate(antiga.getDate() - 10)

      const recente = new Date()
      recente.setDate(recente.getDate() - 2)

      mockListResponse([
        makeMovimentacao(1, { criado_em: antiga.toISOString() }),
        makeMovimentacao(2, { criado_em: recente.toISOString() }),
      ])

      renderPage()

      await screen.findAllByText('Enviada')

      expect(screen.getAllByTestId('alerta-atrasada')).toHaveLength(1)
    })
  })
})