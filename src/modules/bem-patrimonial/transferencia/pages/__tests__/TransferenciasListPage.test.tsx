import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuth } from '@/auth/useAuth'
import { unidadesOrcamentariasService } from '@/modules/configuracoes/unidades-orcamentarias/services/unidades-orcamentarias.service'
import TransferenciasListPage from '../TransferenciasListPage'
import { transferenciaService } from '../../services/transferencia.service'

vi.mock('@/auth/useAuth')

vi.mock('../../services/transferencia.service', () => ({
  transferenciaService: {
    list: vi.fn(),
  },
}))

vi.mock('@/modules/bem-patrimonial/components/FilterSelect', () => ({
  FilterSelect: ({
    label,
    value,
    placeholder,
    options,
    onChange,
  }: {
    label: string
    value: string
    placeholder: string
    options: Array<{ value: string; label: string }>
    onChange: (value: string) => void
  }) => (
    <label>
      <span>{label}</span>
      <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value='todos'>{placeholder}</option>
        {options
          .filter((option) => option.value !== 'todos')
          .map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
      </select>
    </label>
  ),
}))

vi.mock('@/modules/configuracoes/unidades-orcamentarias/services/unidades-orcamentarias.service', () => ({
  unidadesOrcamentariasService: {
    list: vi.fn(),
  },
}))

const mockTransferencia = {
  id: 1,
  nome_bem: 'Notebook Dell',
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

  vi.mocked(unidadesOrcamentariasService.list).mockResolvedValue({
    count: 2,
    next: null,
    previous: null,
    results: [
      {
        id: 10,
        codigo: '01.16.10',
        sigla: 'SME',
        nome: 'Secretaria',
        sigla_orgao: 'SME',
        orgao: 'Secretaria',
        codigo_orgao: '01.16',
        ativa: true,
        ativa_display: 'Ativa',
      },
      {
        id: 20,
        codigo: '99.01',
        sigla: 'DEST',
        nome: 'Destino',
        sigla_orgao: 'EXT',
        orgao: 'Destino',
        codigo_orgao: '99.01',
        ativa: true,
        ativa_display: 'Ativa',
      },
    ],
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

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Notebook Dell')).toBeInTheDocument()
    expect(screen.getByText('001.0000001.2026')).toBeInTheDocument()
    expect(screen.getByText('12345')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Voltar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Adicionar/i })).toBeInTheDocument()
  })

  it('permite selecionar e deselecionar a transferência exibida', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/transferencias']}>
        <TransferenciasListPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getAllByRole('checkbox')[1]).toBeEnabled()
    })

    const [selectAll, rowCheckbox] = screen.getAllByRole('checkbox')
    await user.click(rowCheckbox)

    await waitFor(() => {
      expect(rowCheckbox).toBeChecked()
      expect(selectAll).toBeChecked()
    })

    await user.click(selectAll)

    await waitFor(() => {
      expect(selectAll).not.toBeChecked()
    })
  })

  it('seleciona todas as transferências ao clicar no checkbox mestre', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/transferencias']}>
        <TransferenciasListPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getAllByRole('checkbox')[0]).toBeEnabled()
    })

    const [selectAll, rowCheckbox] = screen.getAllByRole('checkbox')
    await user.click(selectAll)

    await waitFor(() => {
      expect(selectAll).toBeChecked()
      expect(rowCheckbox).toBeChecked()
    })
  })

  it('aplica os filtros e refaz a busca com os parâmetros corretos', async () => {
    const user = userEvent.setup()

    vi.mocked(transferenciaService.list).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [mockTransferencia],
    } as never)

    render(
      <MemoryRouter initialEntries={['/transferencias']}>
        <TransferenciasListPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(transferenciaService.list).toHaveBeenCalled()
    })

    const [nomeBemInput, ntbpmInput, processoInput] = screen.getAllByRole('textbox')
    const [uoOrigemSelect, uoDestinoSelect] = screen.getAllByRole('combobox')

    await user.type(nomeBemInput, 'Notebook')
    await user.type(ntbpmInput, 'NTBPM-100')
    await user.type(processoInput, '54321')
    await user.selectOptions(uoOrigemSelect, '10')
    await user.selectOptions(uoDestinoSelect, '20')

    await waitFor(() => {
      expect(transferenciaService.list).toHaveBeenLastCalledWith(
        expect.objectContaining({
          page: 1,
          pageSize: 10,
          nome_bem: 'Notebook',
          numero_ntbpm: 'NTBPM-100',
          numero_processo: '54321',
          unidade_orcamentaria_origem: 10,
          unidade_orcamentaria_destino: 20,
          ordering: '-criado_em',
        }),
      )
    })
  })

  it('navega entre as páginas anterior e próxima', async () => {
    const user = userEvent.setup()

    vi.mocked(transferenciaService.list).mockResolvedValue({
      count: 25,
      next: 'next',
      previous: null,
      results: [mockTransferencia],
    } as never)

    render(
      <MemoryRouter initialEntries={['/transferencias']}>
        <TransferenciasListPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(transferenciaService.list).toHaveBeenCalled()
    })

    const nextButton = screen
      .getAllByRole('button')
      .find((button) => button.getAttribute('aria-label')?.includes('Pr')) as HTMLButtonElement

    await user.click(nextButton)

    await waitFor(() => {
      expect(transferenciaService.list).toHaveBeenLastCalledWith(
        expect.objectContaining({
          page: 2,
          pageSize: 10,
        }),
      )
    })

    const previousButton = screen
      .getAllByRole('button')
      .find((button) => button.getAttribute('aria-label')?.includes('Anterior')) as HTMLButtonElement

    await user.click(previousButton)

    await waitFor(() => {
      expect(transferenciaService.list).toHaveBeenLastCalledWith(
        expect.objectContaining({
          page: 1,
          pageSize: 10,
        }),
      )
    })
  })

  it('navega para a home ao clicar em voltar', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/transferencias']}>
        <Routes>
          <Route path='/transferencias' element={<TransferenciasListPage />} />
          <Route path='/home' element={<div data-testid='home-page' />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(transferenciaService.list).toHaveBeenCalled()
    })

    await user.click(screen.getByRole('button', { name: 'Voltar' }))

    expect(screen.getByTestId('home-page')).toBeInTheDocument()
  })

  it('mantém os filtros de UO vazios quando o carregamento das opções falhar', async () => {
    vi.mocked(unidadesOrcamentariasService.list).mockRejectedValueOnce(new Error('falha'))

    render(
      <MemoryRouter initialEntries={['/transferencias']}>
        <TransferenciasListPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(unidadesOrcamentariasService.list).toHaveBeenCalledWith({ pageSize: 100, ativa: 'true' })
    })

    const origemSelect = screen.getAllByRole('combobox')[0] as HTMLSelectElement

    expect(origemSelect.options).toHaveLength(1)
    expect(origemSelect.options[0].value).toBe('todos')
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

    await user.click(screen.getByRole('button', { name: /Visualizar/i }))

    expect(screen.getByTestId('transferencia-detail')).toBeInTheDocument()
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

    const addButton = screen
      .getAllByRole('button')
      .find((button) => button.textContent?.includes('Adicionar')) as HTMLButtonElement

    await user.click(addButton)

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
      expect(screen.getByText(/Nenhuma/i)).toBeInTheDocument()
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
