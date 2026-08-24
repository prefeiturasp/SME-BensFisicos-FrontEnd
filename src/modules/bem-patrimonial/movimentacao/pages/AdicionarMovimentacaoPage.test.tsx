import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuth } from '@/auth/useAuth'
import { toast } from 'sonner'
import AdicionarMovimentacaoPage from './AdicionarMovimentacaoPage'
import { unidadesAdministrativasService } from '@/modules/configuracoes/unidades-administrativas/services/unidades-administrativas.service'
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
  Select: ({
    value,
    onValueChange,
    disabled,
    children,
  }: {
    value?: string
    onValueChange?: (value: string) => void
    disabled?: boolean
    children?: ReactNode
  }) => (
    <select
      data-testid='select'
      value={value ?? ''}
      disabled={disabled}
      onChange={(event) => onValueChange?.(event.target.value)}
    >
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: { children?: ReactNode }) => <>{children}</>,
  SelectValue: () => null,
  SelectContent: ({ children }: { children?: ReactNode }) => <>{children}</>,
  SelectItem: ({
    value,
    children,
    disabled,
  }: {
    value: string
    children?: ReactNode
    disabled?: boolean
  }) => (
    <option value={value} disabled={disabled}>
      {children}
    </option>
  ),
}))

vi.mock(
  '@/modules/configuracoes/unidades-administrativas/services/unidades-administrativas.service',
  () => ({
    unidadesAdministrativasService: {
      list: vi.fn(),
    },
  }),
)

vi.mock('../services/movimentacao.service', () => ({
  movimentacaoService: {
    listOpcoesCadastro: vi.fn(),
    resolverItensLote: vi.fn(),
    listBensMovimentaveis: vi.fn(),
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

async function waitForUoOptions() {
  await waitFor(() => {
    expect(screen.getByRole('option', { name: '01.02 - UO Destino' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '01.03 - UO Reserva' })).toBeInTheDocument()
  })
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

    vi.mocked(movimentacaoService.resolverItensLote).mockResolvedValue({
      itens: [makeBem()],
    })
    vi.mocked(movimentacaoService.listBensMovimentaveis).mockResolvedValue([makeBem()])

    vi.mocked(unidadesAdministrativasService.list).mockResolvedValue({
      count: 4,
      next: null,
      previous: null,
      results: [
        {
          id: 10,
          codigo: '001',
          sigla: 'UA Origem',
          nome: 'UA Origem',
          status: 'ativa',
          status_display: 'Ativa',
          unidade_orcamentaria: 1000,
          unidade_orcamentaria_codigo: '01.01',
          unidade_orcamentaria_nome: 'UO Ativa',
          unidade_orcamentaria_sigla: '01.01',
          created_at: '2026-06-01T12:00:00Z',
          updated_at: '2026-06-01T12:00:00Z',
        },
        {
          id: 11,
          codigo: '002',
          sigla: 'UA Ativa 2',
          nome: 'UA Ativa 2',
          status: 'ativa',
          status_display: 'Ativa',
          unidade_orcamentaria: 1000,
          unidade_orcamentaria_codigo: '01.01',
          unidade_orcamentaria_nome: 'UO Ativa',
          unidade_orcamentaria_sigla: '01.01',
          created_at: '2026-06-01T12:00:00Z',
          updated_at: '2026-06-01T12:00:00Z',
        },
        {
          id: 12,
          codigo: '003',
          sigla: 'UA Oculta',
          nome: 'UA Oculta',
          status: 'ativa',
          status_display: 'Ativa',
          unidade_orcamentaria: 1000,
          unidade_orcamentaria_codigo: '01.01',
          unidade_orcamentaria_nome: 'UO Ativa',
          unidade_orcamentaria_sigla: '01.01',
          created_at: '2026-06-01T12:00:00Z',
          updated_at: '2026-06-01T12:00:00Z',
        },
        {
          id: 20,
          codigo: '001',
          sigla: 'UA Outra UO',
          nome: 'UA Outra UO',
          status: 'ativa',
          status_display: 'Ativa',
          unidade_orcamentaria: 200,
          unidade_orcamentaria_codigo: '01.02',
          unidade_orcamentaria_nome: 'UO Destino',
          unidade_orcamentaria_sigla: '01.02',
          created_at: '2026-06-01T12:00:00Z',
          updated_at: '2026-06-01T12:00:00Z',
        },
      ],
    })

    vi.mocked(movimentacaoService.listOpcoesCadastro).mockResolvedValue([
      {
        id: 1000,
        codigo: '01.01',
        nome: 'UO Ativa',
        label: '01.01 - UO Ativa',
        tem_ponto_central: false,
      },
      {
        id: 200,
        codigo: '01.02',
        nome: 'UO Destino',
        label: '01.02 - UO Destino',
        tem_ponto_central: true,
      },
      {
        id: 201,
        codigo: '01.03',
        nome: 'UO Reserva',
        label: '01.03 - UO Reserva',
        tem_ponto_central: false,
      },
    ])
  })

  it('deve renderizar título, breadcrumb e a UA de origem fixa', async () => {
    renderPage()
    await waitForUoOptions()

    expect(
      screen.getByRole('heading', { name: /adicionar movimentação de bem patrimonial/i }),
    ).toBeInTheDocument()
    expect(screen.getByTestId('breadcrumb')).toBeInTheDocument()
    expect(screen.getByDisplayValue('001 - UA Origem')).toBeInTheDocument()
  })

  it('deve manter a UA de destino desabilitada até selecionar a UO', async () => {
    renderPage()
    await waitForUoOptions()

    const selects = screen.getAllByRole('combobox')
    expect(selects).toHaveLength(2)
    expect(selects[1]).toBeDisabled()
  })

  it('deve navegar para a listagem ao clicar em Cancelar', async () => {
    renderPage()
    await waitForUoOptions()

    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }))

    expect(mockNavigate).toHaveBeenCalledWith('/movimentacoes')
  })

  it('deve permitir seleção manual quando a UO de destino é a mesma da referência', async () => {
    renderPage()

    await waitForUoOptions()

    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: '1000' } })

    await waitFor(() => {
      expect(screen.getAllByRole('combobox')[1]).not.toBeDisabled()
    })

    expect(unidadesAdministrativasService.list).toHaveBeenCalledWith({ pageSize: 1000 })

    expect(screen.queryByRole('option', { name: '001 - UA Origem' })).not.toBeInTheDocument()
    expect(screen.getByRole('option', { name: '002 - UA Ativa 2' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '003 - UA Oculta' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: '001 - UA Outra UO' })).not.toBeInTheDocument()
  })

  it('deve desabilitar a UA e permitir movimentação para outra UO com ponto central', async () => {
    renderPage()

    await waitForUoOptions()

    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: '200' } })

    await waitFor(() => {
      expect(screen.getAllByRole('combobox')[1]).toBeDisabled()
    })
  })

  it('deve mostrar mensagem quando a UO selecionada não tiver ponto central', async () => {
    renderPage()

    await waitForUoOptions()

    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: '201' } })

    await waitFor(() => {
      expect(screen.getAllByRole('combobox')[1]).toBeDisabled()
    })

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Não há ponto central cadastrado na Unidade Orçamentária de destino. Por favor, entrar em contato com o gestor.',
    )
  })

  it('deve adicionar uma faixa, exibir o resumo e permitir sua exclusão', async () => {
    renderPage()

    fireEvent.change(screen.getByLabelText('Número Patrimonial - De'), {
      target: { value: '001.000000001-1' },
    })
    fireEvent.change(screen.getByLabelText('Número Patrimonial - Até'), {
      target: { value: '001.000000002-2' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^adicionar$/i }))

    await waitFor(() => {
      expect(movimentacaoService.resolverItensLote).toHaveBeenCalledWith({
        unidade_administrativa_origem: 10,
        faixas: [
          {
            numero_patrimonial_de: '001.000000001-1',
            numero_patrimonial_ate: '001.000000002-2',
          },
        ],
      })
    })
    expect(screen.getByText('001.000000001-1 até 001.000000002-2')).toBeInTheDocument()
    expect(screen.getByText('Notebook')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /excluir faixa/i }))
    expect(screen.queryByText('001.000000001-1 até 001.000000002-2')).not.toBeInTheDocument()
  })

  it('deve manter o botão salvar desabilitado até preencher os critérios obrigatórios', async () => {
    renderPage()

    const saveButton = screen.getByRole('button', { name: /^salvar$/i })
    expect(saveButton).toBeDisabled()

    await waitForUoOptions()

    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: '1000' } })

    await waitFor(() => {
      expect(screen.getAllByRole('combobox')[1]).not.toBeDisabled()
    })

    expect(saveButton).toBeDisabled()

    fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: '11' } })
    expect(saveButton).toBeDisabled()

    fireEvent.change(screen.getByLabelText('Número Patrimonial - De'), {
      target: { value: '001.000000001-1' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^adicionar$/i }))

    await waitFor(() => {
      expect(saveButton).not.toBeDisabled()
    })
  })

  it('deve informar o erro retornado ao incluir uma faixa inválida', async () => {
    vi.mocked(movimentacaoService.resolverItensLote).mockRejectedValue(
      new Error('O(s) Bem(ns) com Número Patrimonial 001.000000002 não pode ser movimentado.'),
    )
    renderPage()

    fireEvent.change(screen.getByLabelText('Número Patrimonial - De'), {
      target: { value: '001.000000001-1' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^adicionar$/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('não pode ser movimentado')
  })

  it('deve exibir erro quando o salvamento falhar', async () => {
    vi.mocked(movimentacaoService.create).mockRejectedValue(new Error('Falha ao salvar'))

    renderPage()

    await waitForUoOptions()

    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: '1000' } })
    await waitFor(() => {
      expect(screen.getAllByRole('combobox')[1]).not.toBeDisabled()
    })
    fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: '11' } })
    fireEvent.change(screen.getByLabelText('Número Patrimonial - De'), {
      target: { value: '001.000000001-1' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^adicionar$/i }))
    await waitFor(() => {
      expect(screen.getByText('Notebook')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /^salvar$/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Falha ao salvar')
    expect(toast.error).toHaveBeenCalledWith('Falha ao salvar')
  })

  it('deve criar a movimentação e redirecionar para a listagem', async () => {
    vi.mocked(movimentacaoService.create).mockResolvedValue(makeMovimentacaoDetail())

    renderPage()

    await waitForUoOptions()

    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: '200' } })

    await waitFor(() => {
      expect(screen.getAllByRole('combobox')[1]).toBeDisabled()
    })

    fireEvent.change(screen.getByLabelText('Número Patrimonial - De'), {
      target: { value: '001.000000001-1' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^adicionar$/i }))
    await waitFor(() => {
      expect(screen.getByText('Notebook')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /^salvar$/i }))

    await waitFor(() => {
      expect(movimentacaoService.create).toHaveBeenCalledWith({
        unidade_administrativa_origem: 10,
        unidade_orcamentaria_destino: 200,
        observacao: '',
        faixas: [
          {
            numero_patrimonial_de: '001.000000001-1',
            numero_patrimonial_ate: '001.000000001-1',
          },
        ],
      })
    })

    expect(toast.success).toHaveBeenCalledWith(
      'Cadastro realizado com sucesso - A movimentação do bem foi cadastrada e enviada para aprovação.',
    )
    expect(mockNavigate).toHaveBeenCalledWith('/movimentacoes')
  })

  it('deve usar a seleção de todos os bens aprovados no salvamento', async () => {
    vi.mocked(movimentacaoService.create).mockResolvedValue(makeMovimentacaoDetail())
    renderPage()
    await waitForUoOptions()

    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: '200' } })
    fireEvent.click(screen.getByRole('checkbox', { name: /selecionar todos os bens aprovados/i }))

    await waitFor(() => {
      expect(movimentacaoService.resolverItensLote).toHaveBeenCalledWith({
        unidade_administrativa_origem: 10,
        selecionar_todos: true,
      })
    })
    fireEvent.click(screen.getByRole('button', { name: /^salvar$/i }))

    await waitFor(() => {
      expect(movimentacaoService.create).toHaveBeenCalledWith({
        unidade_administrativa_origem: 10,
        unidade_orcamentaria_destino: 200,
        observacao: '',
        selecionar_todos: true,
      })
    })
  })

  it('lista os bens aprovados da UA de origem ao pesquisar um número patrimonial', async () => {
    renderPage()

    const numeroDe = screen.getByLabelText('Número Patrimonial - De')
    fireEvent.focus(numeroDe)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '123 - Notebook' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: '123 - Notebook' }))

    expect(numeroDe).toHaveValue('123')
    expect(movimentacaoService.listBensMovimentaveis).toHaveBeenCalledWith(10, '')
  })

  it('deve exibir e remover o resumo da seleção de todos os bens', async () => {
    renderPage()

    fireEvent.click(screen.getByRole('checkbox', { name: /selecionar todos os bens aprovados/i }))

    await waitFor(() => {
      expect(screen.getByText('Todos os Bens aprovados da UA de origem')).toBeInTheDocument()
    })
    expect(screen.getByText('1 bem(ns) selecionado(s)')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /excluir seleção de todos os bens/i }))

    expect(screen.queryByText('1 bem(ns) selecionado(s)')).not.toBeInTheDocument()
  })
})
