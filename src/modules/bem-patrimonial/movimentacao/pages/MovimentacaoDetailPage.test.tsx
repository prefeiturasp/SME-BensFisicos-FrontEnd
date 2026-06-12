import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import MovimentacaoDetailPage from './MovimentacaoDetailPage'
import { movimentacaoService } from '../services/movimentacao.service'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@/components/AppBreadcrumb', () => ({
  AppBreadcrumb: () => <nav data-testid='breadcrumb' />,
}))

vi.mock('../services/movimentacao.service', () => ({
  movimentacaoService: {
    retrieve: vi.fn(),
  },
}))

function makeMovimentacao() {
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
  }
}

describe('MovimentacaoDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(movimentacaoService.retrieve).mockResolvedValue(makeMovimentacao())
  })

  it('deve carregar e exibir a movimentação', async () => {
    render(
      <MemoryRouter initialEntries={['/movimentacoes/1']}>
        <Routes>
          <Route path='/movimentacoes/:id' element={<MovimentacaoDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Visualizar Movimentação de Bem Patrimonial')).toBeInTheDocument()
    expect(screen.getByTestId('breadcrumb')).toBeInTheDocument()
    expect(screen.getByText('Enviada')).toBeInTheDocument()
    expect(screen.getByText('Solicitante Exemplo')).toBeInTheDocument()
    expect(screen.getByText('Notebook')).toBeInTheDocument()
    expect(movimentacaoService.retrieve).toHaveBeenCalledWith(1)
  })
})
