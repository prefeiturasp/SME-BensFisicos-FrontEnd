import {
  createContext,
  useContext,
  type ReactNode,
} from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuth } from '@/auth/useAuth'
import AdicionarTransferenciaPage from '../AdicionarTransferenciaPage'
import { transferenciaService } from '../../services/transferencia.service'
import { bemService } from '@/modules/bem-patrimonial/bem/services/bem.service'

vi.mock('@/auth/useAuth')

vi.mock('../../services/transferencia.service', () => ({
  transferenciaService: {
    listOpcoesCadastro: vi.fn(),
    create: vi.fn(),
  },
}))

vi.mock('@/modules/bem-patrimonial/bem/services/bem.service', () => ({
  bemService: {
    list: vi.fn(),
  },
}))

const SelectContext = createContext<{
  onValueChange: (value: string) => void
} | null>(null)

vi.mock('@/components/ui/select', () => ({
  Select: ({
    value,
    onValueChange,
    children,
  }: {
    value: string
    onValueChange: (value: string) => void
    children: ReactNode
  }) => (
    <SelectContext.Provider value={{ onValueChange }}>
      <div data-testid='select' data-value={value}>
        {children}
      </div>
    </SelectContext.Provider>
  ),
  SelectTrigger: ({ children }: { children: ReactNode }) => (
    <div data-testid='select-trigger'>{children}</div>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => (
    <span data-testid='select-value' data-placeholder={placeholder} />
  ),
  SelectContent: ({ children }: { children: ReactNode }) => (
    <div data-testid='select-content'>{children}</div>
  ),
  SelectItem: ({ value, children }: { value: string; children: ReactNode }) => {
    const context = useContext(SelectContext)

    return (
      <button
        type='button'
        data-testid={`select-item-${value}`}
        onClick={() => context?.onValueChange(value)}
      >
        {children}
      </button>
    )
  },
}))

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

beforeEach(() => {
  vi.clearAllMocks()

  vi.mocked(useAuth).mockReturnValue({
    isAuthenticated: true,
    isLoading: false,
    mustChangePassword: false,
    user: {
      id: 1,
      username: 'operador',
      nome: 'Operador',
      email: 'operador@example.com',
      rf: '123',
      is_superuser: false,
      is_gestor_patrimonio: false,
      is_operador_inventario: true,
      must_change_password: false,
      uo_ativa: {
        id: 10,
        codigo: '01.16.10',
        nome: 'Secretaria',
        label: '01.16.10 - SME',
      },
      ua_ativa: {
        id: 100,
        codigo: '01.16.10.001',
        nome: 'UA Origem',
        label: '01.16.10.001 - UA Origem',
      },
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
            uas: [
              {
                id: 100,
                codigo: '01.16.10.001',
                nome: 'UA Origem',
                label: '01.16.10.001 - UA Origem',
                unidade_administrativa_id: 100,
                unidade_orcamentaria_id: 10,
              },
              {
                id: 101,
                codigo: '01.16.10.002',
                nome: 'UA Segunda',
                label: '01.16.10.002 - UA Segunda',
                unidade_administrativa_id: 101,
                unidade_orcamentaria_id: 10,
              },
            ],
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

  vi.mocked(transferenciaService.listOpcoesCadastro).mockResolvedValue([
    {
      id: 20,
      codigo: '99.01',
      nome: 'UO Destino',
      label: '99.01 - UO Destino',
      tem_ponto_central: true,
    },
    {
      id: 21,
      codigo: '01.16.10',
      nome: 'UO SME',
      label: '01.16.10 - SME',
      tem_ponto_central: true,
    },
  ] as never)

  vi.mocked(bemService.list).mockResolvedValue({
    count: 1,
    next: null,
    previous: null,
    results: [
      {
        id: 1,
        status: 'aprovado',
        status_display: 'Aprovado',
        nome: 'Notebook',
        descricao: 'Teste',
        numero_patrimonial: '123',
        localizacao: 'Sala 1',
        unidade_administrativa_codigo: '01.16.10.001',
        unidade_administrativa_nome: 'UA Origem',
        unidade_orcamentaria_nome: 'Secretaria',
      },
    ],
  } as never)
})

describe('AdicionarTransferenciaPage', () => {
  it('renderiza o formulário e carrega as opções iniciais', async () => {
    render(
      <MemoryRouter initialEntries={['/transferencias/novo']}>
        <AdicionarTransferenciaPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(transferenciaService.listOpcoesCadastro).toHaveBeenCalled()
    })

    expect(
      screen.getByRole('heading', { name: 'Adicionar Transferência de Bem Patrimonial' }),
    ).toBeInTheDocument()
    expect(screen.getByDisplayValue('01.16.10 - SME')).toBeInTheDocument()
    expect(screen.getByTestId('select-item-20')).toBeInTheDocument()
    expect(screen.queryByTestId('select-item-21')).not.toBeInTheDocument()
  })

  it('permite selecionar destino, escolher bem e salvar a transferência', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/transferencias/novo']}>
        <Routes>
          <Route path='/transferencias/novo' element={<AdicionarTransferenciaPage />} />
          <Route path='/transferencias' element={<div data-testid='transferencias-list' />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('select-item-20')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('select-item-20'))

    const bemInput = screen.getByLabelText('Buscar bem patrimonial')
    await user.type(bemInput, 'Note')

    await waitFor(() => {
      expect(bemService.list).toHaveBeenCalled()
    })

    await user.click(screen.getByRole('button', { name: /123 Notebook/i }))

    await user.type(screen.getByLabelText('Número do Processo'), '12345')
    await user.type(screen.getByLabelText('Observações'), 'Observação qualquer')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Salvar' })).toBeEnabled()
    })

    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => {
      expect(transferenciaService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          unidade_administrativa_origem: 10,
          unidade_orcamentaria_destino: 20,
          numero_processo: '12345',
          observacao: 'Observação qualquer',
          itens: [{ bem: 1 }],
        }),
      )
    })

    await waitFor(() => {
      expect(screen.getByTestId('transferencias-list')).toBeInTheDocument()
    })
  })

  it('exibe aviso quando a UO de destino não tiver ponto central', async () => {
    vi.mocked(transferenciaService.listOpcoesCadastro).mockResolvedValueOnce([
      {
        id: 30,
        codigo: '99.02',
        nome: 'UO Sem PC',
        label: '99.02 - UO Sem PC',
        tem_ponto_central: false,
      },
    ] as never)

    render(
      <MemoryRouter initialEntries={['/transferencias/novo']}>
        <AdicionarTransferenciaPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('select-item-30')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByTestId('select-item-30'))

    expect(
      screen.getByText(
        'Não há ponto central cadastrado na Unidade Orçamentária de destino. Por favor, entrar em contato com o gestor.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled()
  })

  it('mantém a lista vazia quando não consegue carregar as opções de cadastro', async () => {
    vi.mocked(transferenciaService.listOpcoesCadastro).mockRejectedValueOnce(new Error('falha'))

    render(
      <MemoryRouter initialEntries={['/transferencias/novo']}>
        <AdicionarTransferenciaPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Nenhuma UO disponível')).toBeInTheDocument()
    })
  })

  it('filtra bens por uma UA específica da unidade de origem', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/transferencias/novo']}>
        <AdicionarTransferenciaPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('select-item-20')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('select-item-20'))
    await user.click(screen.getByTestId('select-item-101'))

    const bemInput = screen.getByLabelText('Buscar bem patrimonial')
    await user.type(bemInput, 'Note')

    await waitFor(() => {
      expect(bemService.list).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'Note',
          status: 'aprovado',
          unidade_administrativa: 101,
          pageSize: 20,
        }),
      )
    })
  })

  it('permite adicionar, limpar e remover linhas de itens', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/transferencias/novo']}>
        <AdicionarTransferenciaPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('select-item-20')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('select-item-20'))

    const bemInput = screen.getByLabelText('Buscar bem patrimonial')
    await user.type(bemInput, 'Note')

    await waitFor(() => {
      expect(bemService.list).toHaveBeenCalled()
    })

    await user.click(screen.getByRole('button', { name: /123 Notebook/i }))
    await user.click(screen.getByRole('button', { name: 'Adicionar item' }))

    expect(screen.getAllByLabelText('Remover item')).toHaveLength(2)

    await user.click(screen.getByLabelText('Limpar bem selecionado'))

    expect(screen.getAllByLabelText('Buscar bem patrimonial')).toHaveLength(2)

    await user.click(screen.getAllByLabelText('Remover item')[1])

    expect(screen.getAllByLabelText('Remover item')).toHaveLength(1)
  })

  it('exibe erro ao salvar quando a criação falhar', async () => {
    const user = userEvent.setup()
    vi.mocked(transferenciaService.create).mockRejectedValueOnce(new Error('Falha ao salvar'))

    render(
      <MemoryRouter initialEntries={['/transferencias/novo']}>
        <AdicionarTransferenciaPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('select-item-20')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('select-item-20'))

    const bemInput = screen.getByLabelText('Buscar bem patrimonial')
    await user.type(bemInput, 'Note')

    await waitFor(() => {
      expect(bemService.list).toHaveBeenCalled()
    })

    await user.click(screen.getByRole('button', { name: /123 Notebook/i }))

    await user.type(screen.getByLabelText('Número do Processo'), '12345')
    await user.type(screen.getByLabelText('Observações'), 'Observação qualquer')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Salvar' })).toBeEnabled()
    })

    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Falha ao salvar')
    })
  })
})
