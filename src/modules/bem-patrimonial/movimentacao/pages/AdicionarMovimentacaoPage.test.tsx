import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuth } from '@/auth/useAuth'
import { toast } from 'sonner'
import AdicionarMovimentacaoPage from './AdicionarMovimentacaoPage'
import { bemService } from '../../bem/services/bem.service'
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
  Select: ({ value, onValueChange, disabled, children }: any) => (
    <select
      data-testid='select'
      value={value ?? ''}
      disabled={disabled}
      onChange={(event) => onValueChange?.(event.target.value)}
    >
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectValue: () => null,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children, disabled }: any) => (
    <option value={value} disabled={disabled}>
      {children}
    </option>
  ),
}))

vi.mock('../../bem/services/bem.service', () => ({
  bemService: {
    list: vi.fn(),
  },
}))

vi.mock('../services/movimentacao.service', () => ({
  movimentacaoService: {
    create: vi.fn(),
  },
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

function makeBem(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    status: 'aprovado',
    status_display: 'Aprovado',
    numero_formato_antigo: false,
    sem_numeracao: false,
    nome: 'Notebook',
    descricao: 'Notebook de teste',
    numero_patrimonial: '123',
    marca: 'Dell',
    modelo: 'Latitude',
    localizacao: 'Sala 1',
    unidade_administrativa_codigo: '001',
    unidade_administrativa_nome: 'UA Origem',
    unidade_orcamentaria_nome: 'UO Origem',
    ...overrides,
  }
}

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
    uo_ativa: {
      id: 1000,
      codigo: '01.01',
      nome: 'UO Ativa',
      label: '01.01 - UO Ativa',
    },
    ua_ativa: {
      id: 10,
      codigo: '001',
      nome: 'UA Origem',
      label: '001 - UA Origem',
    },
    opcoes_escopo: {
      grupos: [
        {
          uo: {
            id: 1000,
            codigo: '01.01',
            nome: 'UO Ativa',
            label: '01.01 - UO Ativa',
            selecionavel: true,
            unidade_administrativa_id: null,
            unidade_orcamentaria_id: 1000,
          },
          uas: [
            {
              id: 10,
              codigo: '001',
              nome: 'UA Origem',
              label: '001 - UA Origem',
              unidade_administrativa_id: 10,
              unidade_orcamentaria_id: 1000,
            },
            {
              id: 11,
              codigo: '002',
              nome: 'UA Ativa 2',
              label: '002 - UA Ativa 2',
              unidade_administrativa_id: 11,
              unidade_orcamentaria_id: 1000,
            },
          ],
        },
        {
          uo: {
            id: 200,
            codigo: '01.02',
            nome: 'UO Destino',
            label: '01.02 - UO Destino',
            selecionavel: true,
            unidade_administrativa_id: null,
            unidade_orcamentaria_id: 200,
          },
          uas: [
            {
              id: 20,
              codigo: '001',
              nome: 'UA Destino Central',
              label: '001 - UA Destino Central',
              unidade_administrativa_id: 20,
              unidade_orcamentaria_id: 200,
            },
            {
              id: 21,
              codigo: '010',
              nome: 'UA Destino 2',
              label: '010 - UA Destino 2',
              unidade_administrativa_id: 21,
              unidade_orcamentaria_id: 200,
            },
          ],
        },
        {
          uo: {
            id: 201,
            codigo: '01.03',
            nome: 'UO Reserva',
            label: '01.03 - UO Reserva',
            selecionavel: true,
            unidade_administrativa_id: null,
            unidade_orcamentaria_id: 201,
          },
          uas: [
            {
              id: 30,
              codigo: '010',
              nome: 'UA Reserva',
              label: '010 - UA Reserva',
              unidade_administrativa_id: 30,
              unidade_orcamentaria_id: 201,
            },
          ],
        },
      ],
    },
  }
}

function makeMovimentacaoDetail() {
  return {
    id: 10,
    status: 'enviada',
    status_display: 'Enviada',
    numero_cimbpm: 'CIMBPM-001',
    observacao: 'Movimentação interna',
    criado_em: '2026-06-11T12:00:00Z',
    atualizado_em: '2026-06-11T12:00:00Z',
    total_itens: 1,
    unidade_administrativa_origem: {
      id: 10,
      codigo: '001',
      sigla: '001',
      nome: 'UA Origem',
    },
    unidade_orcamentaria_origem: {
      id: 1000,
      codigo: '01.01',
      sigla: '01.01',
      nome: 'UO Origem',
    },
    unidade_administrativa_destino: {
      id: 20,
      codigo: '001',
      sigla: '001',
      nome: 'UA Destino Central',
    },
    unidade_orcamentaria_destino: {
      id: 200,
      codigo: '01.02',
      sigla: '01.02',
      nome: 'UO Destino',
    },
    solicitado_por: {
      id: 1,
      username: 'gestor',
      nome_completo: 'Gestor',
      email: 'gestor@example.com',
    },
    aprovado_por: null,
    rejeitado_por: null,
    cancelado_por: null,
    itens: [
      {
        id: 1,
        bem: makeBem(),
      },
    ],
    url_aprovar: null,
    url_rejeitar: null,
    url_cancelar: null,
    url_historico: null,
    url_documento_cimbpm: null,
  }
}

function renderPage() {
  return render(
    <MemoryRouter>
      <AdicionarMovimentacaoPage />
    </MemoryRouter>,
  )
}

describe('AdicionarMovimentacaoPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()

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

    vi.mocked(bemService.list).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [makeBem()],
    })
  })

  it('deve renderizar título, breadcrumb e a UA de origem fixa', () => {
    renderPage()

    expect(
      screen.getByRole('heading', { name: /adicionar movimentação de bem patrimonial/i }),
    ).toBeInTheDocument()
    expect(screen.getByTestId('breadcrumb')).toBeInTheDocument()
    expect(screen.getByDisplayValue('001 - UA Origem')).toBeInTheDocument()
  })

  it('deve manter a UA de destino desabilitada até selecionar a UO', () => {
    renderPage()

    const selects = screen.getAllByRole('combobox')
    expect(selects).toHaveLength(2)
    expect(selects[1]).toBeDisabled()
  })

  it('deve navegar para a listagem ao clicar em Cancelar', () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }))

    expect(mockNavigate).toHaveBeenCalledWith('/movimentacoes')
  })

  it('deve permitir seleção manual quando a UO de destino é a mesma da referência', async () => {
    renderPage()

    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: '1000' } })

    await waitFor(() => {
      expect(screen.getAllByRole('combobox')[1]).not.toBeDisabled()
    })

    expect(screen.queryByRole('option', { name: '001 - UA Origem' })).not.toBeInTheDocument()
    expect(screen.getByRole('option', { name: '002 - UA Ativa 2' })).toBeInTheDocument()
  })

  it('deve auto-selecionar o ponto central e desabilitar a UA quando a UO de destino for diferente', async () => {
    renderPage()

    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: '200' } })

    await waitFor(() => {
      expect(screen.getAllByRole('combobox')[1]).toBeDisabled()
    })

    expect(screen.getAllByRole('combobox')[1]).toHaveValue('20')
    expect(screen.getByRole('option', { name: '001 - UA Destino Central' })).toBeInTheDocument()
  })

  it('deve mostrar mensagem quando a UO selecionada não tiver ponto central', async () => {
    renderPage()

    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: '201' } })

    await waitFor(() => {
      expect(screen.getAllByRole('combobox')[1]).toBeDisabled()
    })

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Não há ponto central cadastrado na Unidade Orçamentária de destino. Por favor, entrar em contato com o gestor.',
    )
  })

  it('deve permitir adicionar e remover linhas de itens', async () => {
    renderPage()

    expect(screen.getAllByPlaceholderText('Buscar bem patrimonial')).toHaveLength(1)
    expect(screen.getByLabelText('Remover item')).toBeDisabled()

    fireEvent.click(screen.getByLabelText('Adicionar item'))
    await waitFor(() => {
      expect(screen.getAllByPlaceholderText('Buscar bem patrimonial')).toHaveLength(2)
    })

    expect(screen.getAllByLabelText('Remover item')[0]).not.toBeDisabled()
    expect(screen.getAllByLabelText('Remover item')[1]).not.toBeDisabled()

    fireEvent.click(screen.getAllByLabelText('Remover item')[0])
    await waitFor(() => {
      expect(screen.getAllByPlaceholderText('Buscar bem patrimonial')).toHaveLength(1)
    })

    expect(screen.getByLabelText('Remover item')).toBeDisabled()
  })

  it('deve manter o botão salvar desabilitado até preencher os critérios obrigatórios', async () => {
    renderPage()

    const saveButton = screen.getByRole('button', { name: /^salvar$/i })
    expect(saveButton).toBeDisabled()

    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: '1000' } })

    await waitFor(() => {
      expect(screen.getAllByRole('combobox')[1]).not.toBeDisabled()
    })

    expect(saveButton).toBeDisabled()

    fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: '11' } })
    expect(saveButton).toBeDisabled()

    fireEvent.focus(screen.getByPlaceholderText('Buscar bem patrimonial'))

    await waitFor(() => {
      expect(screen.getByText('Notebook')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Notebook'))

    await waitFor(() => {
      expect(saveButton).not.toBeDisabled()
    })
  })

  it('deve exibir erro quando o salvamento falhar', async () => {
    vi.mocked(movimentacaoService.create).mockRejectedValue(new Error('Falha ao salvar'))

    renderPage()

    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: '1000' } })
    await waitFor(() => {
      expect(screen.getAllByRole('combobox')[1]).not.toBeDisabled()
    })
    fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: '11' } })
    fireEvent.change(screen.getByPlaceholderText('Digite uma observação'), {
      target: { value: 'Observação de teste' },
    })
    fireEvent.focus(screen.getByPlaceholderText('Buscar bem patrimonial'))

    await waitFor(() => {
      expect(screen.getByText('Notebook')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Notebook'))
    fireEvent.click(screen.getByRole('button', { name: /^salvar$/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Falha ao salvar')
    expect(toast.error).toHaveBeenCalledWith('Falha ao salvar')
  })

  it('deve criar a movimentação e redirecionar para a listagem', async () => {
    vi.mocked(movimentacaoService.create).mockResolvedValue(makeMovimentacaoDetail())

    renderPage()

    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: '200' } })

    await waitFor(() => {
      expect(screen.getAllByRole('combobox')[1]).toBeDisabled()
      expect(screen.getAllByRole('combobox')[1]).toHaveValue('20')
    })

    fireEvent.change(screen.getByPlaceholderText('Digite uma observação'), {
      target: { value: 'Movimentação interna' },
    })

    fireEvent.focus(screen.getByPlaceholderText('Buscar bem patrimonial'))

    await waitFor(() => {
      expect(bemService.list).toHaveBeenCalledWith({
        search: '',
        status: 'aprovado',
        unidade_administrativa: 10,
        pageSize: 20,
      })
    })

    await waitFor(() => {
      expect(screen.getByText('Notebook')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Notebook'))

    fireEvent.click(screen.getByRole('button', { name: /^salvar$/i }))

    await waitFor(() => {
      expect(movimentacaoService.create).toHaveBeenCalledWith({
        unidade_administrativa_origem: 10,
        unidade_orcamentaria_destino: 200,
        unidade_administrativa_destino: 20,
        observacao: 'Movimentação interna',
        itens: [{ bem: 1 }],
      })
    })

    expect(toast.success).toHaveBeenCalledWith(
      'Cadastro realizado com sucesso - A movimentação do bem foi cadastrada e enviada para aprovação.',
    )
    expect(mockNavigate).toHaveBeenCalledWith('/movimentacoes')
  })
})
