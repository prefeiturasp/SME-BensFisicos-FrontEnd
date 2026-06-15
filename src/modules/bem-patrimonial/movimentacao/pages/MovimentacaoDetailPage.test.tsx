import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import MovimentacaoDetailPage from './MovimentacaoDetailPage'
import { movimentacaoService } from '../services/movimentacao.service'

const mockNavigate = vi.fn()
const toastError = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => toastError(...args),
  },
}))

vi.mock('@/components/AppBreadcrumb', () => ({
  AppBreadcrumb: () => <nav data-testid='breadcrumb' />,
}))

vi.mock('../services/movimentacao.service', () => ({
  movimentacaoService: {
    retrieve: vi.fn(),
  },
}))

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
    url_historico: null,
    url_documento_cimbpm: null,
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
    vi.mocked(movimentacaoService.retrieve).mockResolvedValue(makeMovimentacao())
  })

  it('deve mostrar loader enquanto carrega', () => {
    vi.mocked(movimentacaoService.retrieve).mockReturnValue(
      new Promise(() => undefined),
    )

    renderPage()

    expect(screen.getByTestId('loader')).toBeInTheDocument()
  })

  it('deve carregar e exibir a movimentação', async () => {
    renderPage()

    expect(await screen.findByText('Visualizar Movimentação de Bem Patrimonial')).toBeInTheDocument()
    expect(screen.getByTestId('breadcrumb')).toBeInTheDocument()
    expect(screen.getByText('Enviada')).toBeInTheDocument()
    expect(screen.getByText('Solicitante Exemplo')).toBeInTheDocument()
    expect(screen.getByText('Notebook')).toBeInTheDocument()
    expect(screen.getByText('CIMBPM-1')).toBeInTheDocument()
    expect(movimentacaoService.retrieve).toHaveBeenCalledWith(1)
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
        observacao: '',
        itens: [],
      }),
    )

    renderPage()

    await screen.findByText('Visualizar Movimentação de Bem Patrimonial')
    expect(screen.getAllByText('-')).toHaveLength(2)
    expect(screen.getByText('Nenhum item encontrado.')).toBeInTheDocument()
  })
})
