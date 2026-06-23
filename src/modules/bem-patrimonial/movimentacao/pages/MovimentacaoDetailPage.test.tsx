import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuth } from '@/auth/useAuth'
import MovimentacaoDetailPage from './MovimentacaoDetailPage'
import { movimentacaoService } from '../services/movimentacao.service'

const mockNavigate = vi.fn()
const toastError = vi.fn()
const toastSuccess = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@/auth/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => toastError(...args),
    success: (...args: unknown[]) => toastSuccess(...args),
  },
}))

vi.mock('@/components/AppBreadcrumb', () => ({
  AppBreadcrumb: () => <nav data-testid='breadcrumb' />,
}))

vi.mock('../services/movimentacao.service', () => ({
  movimentacaoService: {
    retrieve: vi.fn(),
    cancelar: vi.fn(),
    baixarDocumentoCimbpm: vi.fn(),
  },
}))

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 5,
    username: 'operador',
    nome: 'Operador',
    email: 'operador@example.com',
    rf: '123456',
    is_superuser: false,
    is_gestor_patrimonio: false,
    is_operador_inventario: true,
    must_change_password: false,
    ua_ativa: null,
    uo_ativa: null,
    opcoes_escopo: { grupos: [] },
    ...overrides,
  }
}

function makeMovimentacao(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    status: 'enviada',
    status_display: 'Enviada',
    numero_cimbpm: 'CIMBPM-1',
    observacao: 'Movimentação de teste',
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
      id: 200,
      codigo: '01.02',
      sigla: 'UO 02',
      nome: 'UO 02',
    },
    solicitado_por: {
      id: 5,
      username: 'operador',
      nome_completo: 'Operador Exemplo',
      email: 'operador@example.com',
    },
    aprovado_por: {
      id: 7,
      username: 'gestor',
      nome_completo: 'Gestor Exemplo',
      email: 'gestor@example.com',
    },
    rejeitado_por: null,
    cancelado_por: null,
    itens: [
      {
        id: 1,
        bem: {
          id: 77,
          numero_patrimonial: '0001',
          nome: 'Notebook',
          status: 'aprovado',
        },
      },
    ],
    url_aprovar: null,
    url_rejeitar: null,
    url_cancelar: null,
    url_historico: 'https://example.com/historico/1',
    url_documento_cimbpm: 'https://example.com/documento/1.pdf',
    ...overrides,
  }
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/movimentacoes/1']}>
      <Routes>
        <Route path='/movimentacoes/:id' element={<MovimentacaoDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('MovimentacaoDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:documento-cimbpm')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
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
    vi.mocked(movimentacaoService.retrieve).mockResolvedValue(makeMovimentacao())
    vi.mocked(movimentacaoService.cancelar).mockResolvedValue(makeMovimentacao())
    vi.mocked(movimentacaoService.baixarDocumentoCimbpm).mockResolvedValue(new Blob(['pdf']))
  })

  it('deve mostrar loader enquanto carrega', () => {
    vi.mocked(movimentacaoService.retrieve).mockReturnValue(new Promise(() => undefined))

    renderPage()

    expect(screen.getByTestId('loader')).toBeInTheDocument()
  })

  it('deve carregar e exibir a movimentação', async () => {
    renderPage()

    expect(
      await screen.findByText('Visualizar Movimentação de Bem Patrimonial'),
    ).toBeInTheDocument()
    expect(screen.getByTestId('breadcrumb')).toBeInTheDocument()
    expect(screen.getByText('Solicitação #0001')).toBeInTheDocument()
    expect(screen.getByText('Status: Enviada')).toBeInTheDocument()
    expect(screen.getByText('CIMBPM-1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /baixar documento cimbpm/i })).toBeInTheDocument()
    expect(screen.getByText('Operador Exemplo')).toBeInTheDocument()
    expect(screen.getByText('Gestor Exemplo')).toBeInTheDocument()
    expect(screen.getByText('01.01 - UO 01')).toBeInTheDocument()
    expect(screen.getByText('01.02 - UO 02')).toBeInTheDocument()
    expect(screen.getByText('01.01.001 - UA Origem')).toBeInTheDocument()
    expect(screen.getByText('01.01.002 - UA Destino')).toBeInTheDocument()
    expect(screen.getByText('Movimentação de teste')).toBeInTheDocument()
    expect(screen.getByText('0001 Notebook')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /salvar edição/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeEnabled()
    expect(screen.getByRole('link', { name: /histórico/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /voltar/i })).toBeInTheDocument()
    expect(movimentacaoService.retrieve).toHaveBeenCalledWith(1)
  })

  it('deve cancelar a movimentação quando permitido', async () => {
    renderPage()

    await screen.findByText('Visualizar Movimentação de Bem Patrimonial')
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }))

    await waitFor(() => {
      expect(movimentacaoService.cancelar).toHaveBeenCalledWith(1)
      expect(toastSuccess).toHaveBeenCalledWith(
        'Movimentação #0001 cancelada com sucesso. Bens desbloqueados.',
      )
    })

    expect(mockNavigate).toHaveBeenCalledWith('/movimentacoes')
  })

  it('deve exibir a mensagem padrão ao falhar no cancelamento sem Error', async () => {
    vi.mocked(movimentacaoService.cancelar).mockRejectedValueOnce('falha no cancelamento')

    renderPage()

    await screen.findByRole('heading', { name: /visualizar movimenta/i })
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Erro ao cancelar movimentação')
    })
  })

  it('deve abrir o documento CIMBPM em nova guia', async () => {
    renderPage()

    await screen.findByText('Visualizar Movimentação de Bem Patrimonial')
    fireEvent.click(screen.getByRole('button', { name: /baixar documento cimbpm/i }))

    await waitFor(() => {
      expect(movimentacaoService.baixarDocumentoCimbpm).toHaveBeenCalledWith(1)
      expect(URL.createObjectURL).toHaveBeenCalled()
    })
    expect(toastError).not.toHaveBeenCalled()
  })

  it('deve exibir a mensagem padrão ao falhar no download do CIMBPM sem Error', async () => {
    vi.mocked(movimentacaoService.baixarDocumentoCimbpm).mockRejectedValueOnce('falha no blob')

    renderPage()

    await screen.findByRole('heading', { name: /visualizar movimenta/i })
    fireEvent.click(screen.getByRole('button', { name: /baixar documento cimbpm/i }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Erro ao baixar documento CIMBPM')
    })
  })

  it('deve impedir operador de cancelar movimentação de outro usuário', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: makeUser({
        id: 99,
      }),
      isLoading: false,
      isAuthenticated: true,
      mustChangePassword: false,
      login: vi.fn(),
      logout: vi.fn(),
      isLoggingIn: false,
      loginError: null,
      loginAsync: vi.fn(),
    })

    renderPage()

    await screen.findByText('Visualizar Movimentação de Bem Patrimonial')

    expect(screen.getByRole('button', { name: /cancelar/i })).toBeDisabled()
  })

  it('deve voltar para a listagem ao clicar em voltar', async () => {
    renderPage()

    await screen.findByText('Visualizar Movimentação de Bem Patrimonial')
    fireEvent.click(screen.getByRole('button', { name: /voltar/i }))

    expect(mockNavigate).toHaveBeenCalledWith('/movimentacoes')
  })

  it('deve navegar para a listagem quando falhar o carregamento', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(movimentacaoService.retrieve).mockRejectedValueOnce(new Error('falhou'))

    renderPage()

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Erro ao carregar movimentação')
    })
    expect(mockNavigate).toHaveBeenCalledWith('/movimentacoes')
    consoleErrorSpy.mockRestore()
  })

  it('deve exibir traços para campos vazios', async () => {
    vi.mocked(movimentacaoService.retrieve).mockResolvedValueOnce(
      makeMovimentacao({
        numero_cimbpm: null,
        url_documento_cimbpm: null,
        url_historico: null,
        aprovado_por: null,
        itens: [],
        observacao: '',
      }),
    )

    renderPage()

    await screen.findByText('Visualizar Movimentação de Bem Patrimonial')
    expect(screen.getAllByText('-').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Número CIMBPM não gerado')).toBeInTheDocument()
    expect(screen.getByText('Nenhum item encontrado.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeEnabled()
  })
})
