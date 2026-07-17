import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuth } from '@/auth/useAuth'
import TransferenciasListPage from '../TransferenciasListPage'
import { transferenciaService } from '../../services/transferencia.service'

vi.mock('@/auth/useAuth')

vi.mock('../../services/transferencia.service', () => ({
  transferenciaService: {
    list: vi.fn(),
  },
}))

const mockTransferencia = {
  id: 1,
  numero_ntbpm: '001.0000001.2026',
  numero_processo: '12345',
  observacao: 'Teste',
  criado_em: '2026-07-17T10:00:00-03:00',
  atualizado_em: '2026-07-17T10:10:00-03:00',
  total_itens: 2,
  unidade_orcamentaria_origem: {
    id: 10,
    codigo: '01.16.10',
    sigla: 'SME',
    nome: 'Secretaria',
    label: '01.16.10 - SME',
  },
  unidade_orcamentaria_destino: {
    id: 20,
    codigo: '99.01',
    sigla: 'DEST',
    nome: 'Destino',
    label: '99.01 - DEST',
  },
  criado_por: {
    id: 3,
    username: 'operador',
    nome_completo: 'Operador 1',
  },
  url_documento_ntbpm: '/api/documento-ntbpm/1/download/',
}

beforeEach(() => {
  vi.clearAllMocks()

  vi.mocked(useAuth).mockReturnValue({
    isAuthenticated: true,
    isLoading: false,
    mustChangePassword: false,
    user: {
      id: 1,
      username: 'gestor',
      nome: 'Gestor',
      email: 'gestor@example.com',
      rf: '123',
      is_superuser: false,
      is_gestor_patrimonio: true,
      is_operador_inventario: false,
      must_change_password: false,
      uo_ativa: {
        id: 10,
        codigo: '01.16.10',
        nome: 'Secretaria',
        label: '01.16.10 - SME',
      },
      ua_ativa: null,
      opcoes_escopo: {
        grupos: [
          {
            uo: {
              id: 10,
              codigo: '01.16.10',
              nome: 'Secretaria',
              label: '01.16.10 - SME',
              selecionavel: true,
              unidade_administrativa_id: null,
              unidade_orcamentaria_id: 10,
            },
            uas: [],
          },
        ],
      },
    },
    login: vi.fn(),
    logout: vi.fn(),
    isLoggingIn: false,
    loginError: null,
    loginAsync: vi.fn(),
  } as never)

  vi.mocked(transferenciaService.list).mockResolvedValue({
    count: 1,
    next: null,
    previous: null,
    results: [mockTransferencia],
  } as never)
})

describe('TransferenciasListPage', () => {
  it('renderiza título, filtros e listagem', async () => {
    render(
      <MemoryRouter initialEntries={['/transferencias']}>
        <TransferenciasListPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(transferenciaService.list).toHaveBeenCalled()
    })

    expect(
      screen.getByRole('heading', { name: 'Transferência de Bens Patrimoniais' }),
    ).toBeInTheDocument()
    expect(screen.getByText('001.0000001.2026')).toBeInTheDocument()
    expect(screen.getByText('12345')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Adicionar Transferência' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Voltar' })).toBeInTheDocument()
  })

  it('permite selecionar e deselecionar a transferência exibida', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/transferencias']}>
        <TransferenciasListPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByLabelText('Selecionar transferência 1')).toBeEnabled()
    })

    const checkbox = screen.getByLabelText('Selecionar transferência 1')
    await user.click(checkbox)

    await waitFor(() => {
      expect(checkbox).toBeChecked()
      expect(screen.getByLabelText('Selecionar todas as transferências')).toBeChecked()
    })

    const selectAll = screen.getByLabelText('Selecionar todas as transferências')
    await user.click(selectAll)

    await waitFor(() => {
      expect(selectAll).not.toBeChecked()
    })
  })

  it('seleciona todas as transferências ao clicar no checkbox mestre', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/transferencias']} >
        <TransferenciasListPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByLabelText('Selecionar todas as transferências')).toBeEnabled()
    })

    await user.click(screen.getByLabelText('Selecionar todas as transferências'))

    await waitFor(() => {
      expect(screen.getByLabelText('Selecionar todas as transferências')).toBeChecked()
      expect(screen.getByLabelText('Selecionar transferência 1')).toBeChecked()
    })
  })

  it('navega para a visualização da transferência ao clicar no ícone', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/transferencias']}>
        <Routes>
          <Route path='/transferencias' element={<TransferenciasListPage />} />
          <Route path='/transferencias/:id' element={<div data-testid='transferencia-detail' />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(transferenciaService.list).toHaveBeenCalled()
    })

    await user.click(screen.getByLabelText('Visualizar transferência 1'))

    expect(screen.getByTestId('transferencia-detail')).toBeInTheDocument()
  })

  it('aplica filtros e paginação nas chamadas da API', async () => {
    vi.mocked(transferenciaService.list).mockResolvedValue({
      count: 100,
      next: null,
      previous: null,
      results: [mockTransferencia],
    } as never)

    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/transferencias']}>
        <TransferenciasListPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('...')).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText('Filtrar por NTBPM'), 'NTBPM-100')
    await user.type(screen.getByLabelText('Filtrar por Número do Processo'), '54321')

    await waitFor(() => {
      expect(transferenciaService.list).toHaveBeenLastCalledWith(
        expect.objectContaining({
          page: 1,
          pageSize: 10,
          numero_ntbpm: 'NTBPM-100',
          numero_processo: '54321',
          ordering: '-criado_em',
        }),
      )
    })

    await user.click(screen.getByRole('button', { name: '2' }))

    await waitFor(() => {
      expect(transferenciaService.list).toHaveBeenLastCalledWith(
        expect.objectContaining({
          page: 2,
          pageSize: 10,
          numero_ntbpm: 'NTBPM-100',
          numero_processo: '54321',
          ordering: '-criado_em',
        }),
      )
    })
  })

  it('navega para a tela de cadastro ao clicar em adicionar', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/transferencias']}>
        <Routes>
          <Route path='/transferencias' element={<TransferenciasListPage />} />
          <Route path='/transferencias/novo' element={<div data-testid='transferencia-create' />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(transferenciaService.list).toHaveBeenCalled()
    })

    await user.click(screen.getByRole('button', { name: 'Adicionar Transferência' }))

    expect(screen.getByTestId('transferencia-create')).toBeInTheDocument()
  })

  it('exibe estado vazio quando não houver transferências', async () => {
    vi.mocked(transferenciaService.list).mockResolvedValueOnce({
      count: 0,
      next: null,
      previous: null,
      results: [],
    } as never)

    render(
      <MemoryRouter initialEntries={['/transferencias']}>
        <TransferenciasListPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Nenhuma transferência encontrada.')).toBeInTheDocument()
    })
  })

  it('registra erro quando a listagem falhar', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.mocked(transferenciaService.list).mockRejectedValueOnce(new Error('falha'))

    render(
      <MemoryRouter initialEntries={['/transferencias']}>
        <TransferenciasListPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    consoleErrorSpy.mockRestore()
  })
})
