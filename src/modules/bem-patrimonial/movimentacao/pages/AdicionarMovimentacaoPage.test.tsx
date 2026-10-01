import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuth } from '@/auth/useAuth'
import { toast } from 'sonner'
import { unidadesAdministrativasService } from '@/modules/configuracoes/unidades-administrativas/services/unidades-administrativas.service'
import { movimentacaoService } from '../services/movimentacao.service'
import AdicionarMovimentacaoPage from './AdicionarMovimentacaoPage'

const navigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => navigate }
})
vi.mock('@/auth/useAuth')
vi.mock('@/components/AppBreadcrumb', () => ({ AppBreadcrumb: () => <nav data-testid='breadcrumb' /> }))
vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, disabled, children }: {
    value?: string
    onValueChange?: (value: string) => void
    disabled?: boolean
    children?: ReactNode
  }) => <select value={value ?? ''} disabled={disabled} onChange={(event) => onValueChange?.(event.target.value)}>{children}</select>,
  SelectTrigger: ({ children }: { children?: ReactNode }) => <>{children}</>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => <option value=''>{placeholder}</option>,
  SelectContent: ({ children }: { children?: ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children, disabled }: { value: string; children?: ReactNode; disabled?: boolean }) => (
    <option value={value} disabled={disabled}>{children}</option>
  ),
}))
vi.mock('@/modules/configuracoes/unidades-administrativas/services/unidades-administrativas.service', () => ({
  unidadesAdministrativasService: { list: vi.fn() },
}))
vi.mock('../services/movimentacao.service', () => ({
  movimentacaoService: { listOpcoesCadastro: vi.fn(), resolverItensLote: vi.fn(), buscarBens: vi.fn(), create: vi.fn() },
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const bem = {
  id: 52,
  numero_patrimonial: null,
  nome: 'Cadeira azul',
  descricao: 'Cadeira com estofado azul',
  localizacao: 'Sala 2',
  apto: true,
  motivo: null,
}
const bemFaixa = { ...bem, id: 53, numero_patrimonial: '001.000000030-0', nome: 'Mesa branca' }
const bemFaixaSeguinte = {
  ...bemFaixa, id: 55, numero_patrimonial: '001.000000030-1', nome: 'Mesa lateral',
}
const bemTodos = { ...bem, id: 54, nome: 'Armário' }

function usuario(nivelUo = false) {
  return {
    id: 1, username: 'gestor', nome: 'Gestor', email: 'gestor@test.com', rf: '123456',
    is_gestor_patrimonio: true, is_operador_inventario: true, must_change_password: false,
    uo_ativa: { id: 1000, codigo: '01.01', nome: 'UO Ativa', label: '01.01 - UO Ativa' },
    ua_ativa: nivelUo ? null : { id: 10, codigo: '001', nome: 'UA Origem', label: '001 - UA Origem' },
    opcoes_escopo: { grupos: [{
      uo: { id: 1000, codigo: '01.01', nome: 'UO Ativa', label: '01.01 - UO Ativa', selecionavel: true, unidade_administrativa_id: null, unidade_orcamentaria_id: 1000 },
      uas: [
        { id: 10, codigo: '001', nome: 'UA Origem', label: '001 - UA Origem', unidade_administrativa_id: 10, unidade_orcamentaria_id: 1000 },
        { id: 11, codigo: '002', nome: 'UA Alternativa', label: '002 - UA Alternativa', unidade_administrativa_id: 11, unidade_orcamentaria_id: 1000 },
      ],
    }] },
  }
}

function configurarUsuario(nivelUo = false) {
  vi.mocked(useAuth).mockReturnValue({
    user: usuario(nivelUo), isLoading: false, isAuthenticated: true, mustChangePassword: false,
    login: vi.fn(), logout: vi.fn(), isLoggingIn: false, loginError: null, loginAsync: vi.fn(),
  })
}

function renderPage() {
  return render(<MemoryRouter><AdicionarMovimentacaoPage /></MemoryRouter>)
}

function buscarGeral(termo: string) {
  fireEvent.change(screen.getByLabelText('Buscar por nome, descrição, ID ou número patrimonial'), { target: { value: termo } })
  fireEvent.click(screen.getByRole('button', { name: /^buscar$/i }))
}

async function selecionarDestino() {
  await waitFor(() => expect(screen.getByRole('option', { name: '01.02 - UO Destino' })).toBeInTheDocument())
  fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: '200' } })
}

describe('AdicionarMovimentacaoPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    configurarUsuario()
    vi.mocked(movimentacaoService.listOpcoesCadastro).mockResolvedValue([
      { id: 1000, codigo: '01.01', nome: 'UO Ativa', label: '01.01 - UO Ativa', tem_ponto_central: false },
      { id: 200, codigo: '01.02', nome: 'UO Destino', label: '01.02 - UO Destino', tem_ponto_central: true },
    ])
    vi.mocked(unidadesAdministrativasService.list).mockResolvedValue({
      count: 2, next: null, previous: null, results: [
        { id: 10, codigo: '001', sigla: 'Origem', nome: 'UA Origem', status: 'ativa', status_display: 'Ativa', unidade_orcamentaria: 1000, unidade_orcamentaria_codigo: '01.01', unidade_orcamentaria_nome: 'UO Ativa', unidade_orcamentaria_sigla: '01.01', created_at: '', updated_at: '' },
        { id: 11, codigo: '002', sigla: 'Alternativa', nome: 'UA Alternativa', status: 'ativa', status_display: 'Ativa', unidade_orcamentaria: 1000, unidade_orcamentaria_codigo: '01.01', unidade_orcamentaria_nome: 'UO Ativa', unidade_orcamentaria_sigla: '01.01', created_at: '', updated_at: '' },
      ],
    })
    vi.mocked(movimentacaoService.buscarBens).mockResolvedValue({ count: 0, pagina: 1, proxima_pagina: null, itens: [] })
    vi.mocked(movimentacaoService.resolverItensLote).mockResolvedValue({ itens: [{ ...bem, status: 'aprovado' }] })
    vi.mocked(movimentacaoService.create).mockResolvedValue({} as Awaited<ReturnType<typeof movimentacaoService.create>>)
  })

  it('mostra os três modos, resultados e selecionados', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByRole('option', { name: '01.02 - UO Destino' })).toBeInTheDocument())
    expect(screen.getByRole('radio', { name: 'Buscar Geral' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Buscar Faixa' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Todos os bens da UA' })).toBeInTheDocument()
    expect(screen.getAllByRole('table')).toHaveLength(2)
    expect(screen.getByText('Selecionados (0)')).toBeInTheDocument()
  })

  it('busca nome, seleciona bem sem número e envia apenas o ID marcado', async () => {
    vi.mocked(movimentacaoService.buscarBens).mockResolvedValue({ count: 1, pagina: 1, proxima_pagina: null, itens: [bem] })
    renderPage()
    await selecionarDestino()
    buscarGeral('cadeira')
    await waitFor(() => expect(movimentacaoService.buscarBens).toHaveBeenCalledWith({
      unidade_administrativa_origem: 10, termo_busca: 'cadeira', pagina: 1,
    }))
    expect(screen.getAllByRole('table')).toHaveLength(2)
    fireEvent.click(screen.getByRole('checkbox', { name: 'Selecionar bem ID 52' }))
    fireEvent.click(screen.getByRole('button', { name: /^salvar$/i }))
    await waitFor(() => expect(movimentacaoService.create).toHaveBeenCalledWith({
      unidade_administrativa_origem: 10, unidade_orcamentaria_destino: 200,
      observacao: '', itens: [{ bem: 52 }],
    }))
    expect(navigate).toHaveBeenCalledWith('/movimentacoes')
  })

  it('busca automaticamente após o debounce da busca geral', async () => {
    vi.mocked(movimentacaoService.buscarBens).mockResolvedValue({
      count: 1, pagina: 1, proxima_pagina: null, itens: [bem],
    })
    renderPage()

    fireEvent.change(
      screen.getByLabelText('Buscar por nome, descrição, ID ou número patrimonial'),
      { target: { value: 'cadeira' } },
    )

    expect(movimentacaoService.buscarBens).not.toHaveBeenCalled()
    await waitFor(() => expect(movimentacaoService.buscarBens).toHaveBeenCalledWith({
      unidade_administrativa_origem: 10, termo_busca: 'cadeira', pagina: 1,
    }))
  })

  it('acumula seleção geral e faixa na lista única', async () => {
    vi.mocked(movimentacaoService.buscarBens).mockImplementation(async (params) => ({
      count: 1, pagina: 1, proxima_pagina: null,
      itens: [params.termo_busca ? bem : bemFaixa],
    }))
    renderPage()
    await selecionarDestino()
    buscarGeral('cadeira')
    await screen.findByRole('checkbox', { name: 'Selecionar bem ID 52' })
    fireEvent.click(screen.getByRole('checkbox', { name: 'Selecionar bem ID 52' }))
    fireEvent.click(screen.getByRole('radio', { name: 'Buscar Faixa' }))
    expect(screen.getAllByRole('table')).toHaveLength(2)
    expect(screen.queryByRole('checkbox', { name: 'Selecionar bem ID 52' })).not.toBeInTheDocument()
    expect(screen.getByText('Selecionados (1)')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Número Patrimonial - De'), { target: { value: '0010000000300' } })
    fireEvent.click(screen.getByRole('button', { name: /^buscar$/i }))
    await screen.findByRole('checkbox', { name: 'Selecionar bem ID 53' })
    vi.mocked(movimentacaoService.resolverItensLote).mockResolvedValue({ itens: [{ ...bemFaixa, status: 'aprovado' }] })
    fireEvent.click(screen.getByRole('button', { name: 'Importar Faixa' }))
    await waitFor(() => expect(screen.getByText('Selecionados (2)')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('radio', { name: 'Buscar Geral' }))
    fireEvent.click(screen.getByRole('button', { name: /^salvar$/i }))
    await waitFor(() => expect(movimentacaoService.create).toHaveBeenCalledWith({
      unidade_administrativa_origem: 10, unidade_orcamentaria_destino: 200,
      observacao: '', itens: [{ bem: 52 }, { bem: 53 }],
    }))
  })

  it('busca uma faixa e impede De maior que Até', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('radio', { name: 'Buscar Faixa' }))
    fireEvent.change(screen.getByLabelText('Número Patrimonial - De'), { target: { value: '0010000000200' } })
    fireEvent.change(screen.getByLabelText('Número Patrimonial - Até'), { target: { value: '0010000000100' } })
    fireEvent.click(screen.getByRole('button', { name: /^buscar$/i }))
    expect(movimentacaoService.buscarBens).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalled()
    fireEvent.change(screen.getByLabelText('Número Patrimonial - Até'), { target: { value: '0010000000300' } })
    fireEvent.click(screen.getByRole('button', { name: /^buscar$/i }))
    await waitFor(() => expect(movimentacaoService.buscarBens).toHaveBeenCalledWith({
      unidade_administrativa_origem: 10, pagina: 1,
      numero_patrimonial_de: '001.000000020-0', numero_patrimonial_ate: '001.000000030-0',
    }))
  })

  it('identifica bem impedido antes de selecionar', async () => {
    vi.mocked(movimentacaoService.buscarBens).mockResolvedValue({
      count: 1, pagina: 1, proxima_pagina: null,
      itens: [{ ...bem, apto: false, motivo: 'Bloqueado por inventário' }],
    })
    renderPage()
    buscarGeral('cadeira')
    expect(await screen.findByText('Bloqueado por inventário')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Selecionar bem ID 52' })).toBeDisabled()
  })

  it('informa ausência de resultados', async () => {
    renderPage()
    buscarGeral('inexistente')
    expect(await screen.findByText('Nenhum bem encontrado para a busca informada.')).toBeInTheDocument()
  })

  it('confirma antes de substituir a seleção por todos os bens', async () => {
    vi.mocked(movimentacaoService.buscarBens).mockResolvedValue({ count: 1, pagina: 1, proxima_pagina: null, itens: [bem] })
    vi.mocked(movimentacaoService.resolverItensLote).mockResolvedValue({ itens: [{ ...bemTodos, status: 'aprovado' }] })
    renderPage()
    await selecionarDestino()
    buscarGeral('cadeira')
    await screen.findByRole('checkbox', { name: 'Selecionar bem ID 52' })
    fireEvent.click(screen.getByRole('checkbox', { name: 'Selecionar bem ID 52' }))
    fireEvent.click(screen.getByRole('radio', { name: 'Todos os bens da UA' }))
    expect(screen.getByRole('dialog', { name: 'Selecionar todos os bens da UA' })).toBeInTheDocument()
    expect(movimentacaoService.resolverItensLote).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    await waitFor(() => expect(movimentacaoService.resolverItensLote).toHaveBeenCalledWith({
      unidade_administrativa_origem: 10, selecionar_todos: true,
    }))
    expect(await screen.findByText('Todos os bens aptos da UA de origem')).toBeInTheDocument()
    expect(screen.getByText('Selecionados (1)')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /^salvar$/i }))
    await waitFor(() => expect(movimentacaoService.create).toHaveBeenCalledWith({
      unidade_administrativa_origem: 10, unidade_orcamentaria_destino: 200,
      observacao: '', selecionar_todos: true,
    }))
  })

  it('mantém a seleção ao navegar entre os filtros', async () => {
    vi.mocked(movimentacaoService.buscarBens).mockResolvedValue({ count: 1, pagina: 1, proxima_pagina: null, itens: [bem] })
    renderPage()
    await selecionarDestino()
    buscarGeral('cadeira')
    await screen.findByRole('checkbox', { name: 'Selecionar bem ID 52' })
    fireEvent.click(screen.getByRole('checkbox', { name: 'Selecionar bem ID 52' }))
    fireEvent.click(screen.getByRole('radio', { name: 'Buscar Faixa' }))
    fireEvent.click(screen.getByRole('button', { name: /^salvar$/i }))
    await waitFor(() => expect(movimentacaoService.create).toHaveBeenCalledWith({
      unidade_administrativa_origem: 10, unidade_orcamentaria_destino: 200,
      observacao: '', itens: [{ bem: 52 }],
    }))
  })

  it('seleciona todos os resultados visíveis pela caixa do cabeçalho', async () => {
    vi.mocked(movimentacaoService.buscarBens).mockResolvedValue({ count: 2, pagina: 1, proxima_pagina: null, itens: [bem, bemTodos] })
    renderPage()
    await selecionarDestino()
    buscarGeral('bem')
    await screen.findByRole('checkbox', { name: 'Selecionar bem ID 54' })
    fireEvent.click(screen.getByRole('checkbox', { name: 'Selecionar todos os resultados' }))
    expect(screen.getByRole('checkbox', { name: 'Selecionar bem ID 52' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Selecionar bem ID 54' })).toBeChecked()
    fireEvent.click(screen.getByRole('button', { name: /^salvar$/i }))
    await waitFor(() => expect(movimentacaoService.create).toHaveBeenCalledWith({
      unidade_administrativa_origem: 10, unidade_orcamentaria_destino: 200,
      observacao: '', itens: [{ bem: 52 }, { bem: 54 }],
    }))
  })

  it('no nível UO permite escolher UA de origem e habilita UA de destino da mesma UO', async () => {
    configurarUsuario(true)
    renderPage()
    await waitFor(() => expect(screen.getByRole('option', { name: '002 - UA Alternativa' })).toBeInTheDocument())
    expect(screen.getAllByRole('combobox')[0]).toHaveValue('')
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: '11' } })
    fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: '1000' } })
    expect(screen.getAllByRole('combobox')[2]).not.toBeDisabled()
    buscarGeral('cadeira')
    await waitFor(() => expect(movimentacaoService.buscarBens).toHaveBeenCalledWith({
      unidade_administrativa_origem: 11, termo_busca: 'cadeira', pagina: 1,
    }))
  })

  it('mantém a UA de destino desabilitada até selecionar a UO', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByRole('option', { name: '01.02 - UO Destino' })).toBeInTheDocument())
    expect(screen.getAllByRole('combobox')[1]).toBeDisabled()
  })

  it('seleciona automaticamente a única UO de destino disponível', async () => {
    vi.mocked(movimentacaoService.listOpcoesCadastro).mockResolvedValue([
      { id: 200, codigo: '01.02', nome: 'UO Destino', label: '01.02 - UO Destino', tem_ponto_central: true },
    ])
    renderPage()
    await waitFor(() => expect(screen.getAllByRole('combobox')[0]).toHaveValue('200'))
  })

  it('seleciona automaticamente a única UA de destino da mesma UO', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByRole('option', { name: '01.01 - UO Ativa' })).toBeInTheDocument())
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: '1000' } })
    await waitFor(() => expect(screen.getAllByRole('combobox')[1]).toHaveValue('11'))
  })

  it('volta para a listagem ao cancelar', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByRole('option', { name: '01.02 - UO Destino' })).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(navigate).toHaveBeenCalledWith('/movimentacoes')
  })

  it('informa quando a UO de destino não possui ponto central', async () => {
    vi.mocked(movimentacaoService.listOpcoesCadastro).mockResolvedValue([
      { id: 200, codigo: '01.02', nome: 'UO Destino', label: '01.02 - UO Destino', tem_ponto_central: false },
    ])
    renderPage()
    expect(await screen.findByText(/Não há ponto central cadastrado/)).toBeInTheDocument()
    expect(screen.getAllByRole('combobox')[1]).toBeDisabled()
  })

  it('exibe erro ao buscar sem selecionar a UA de origem', async () => {
    configurarUsuario(true)
    renderPage()
    buscarGeral('cadeira')
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Informe a Unidade Administrativa de origem.'))
    expect(movimentacaoService.buscarBens).not.toHaveBeenCalled()
  })

  it('cancela a substituição por todos e preserva os selecionados', async () => {
    vi.mocked(movimentacaoService.buscarBens).mockResolvedValue({ count: 1, pagina: 1, proxima_pagina: null, itens: [bem] })
    renderPage()
    buscarGeral('cadeira')
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Selecionar bem ID 52' }))
    fireEvent.click(screen.getByRole('radio', { name: 'Todos os bens da UA' }))
    fireEvent.click(screen.getByTestId('confirm-dialog-cancel'))
    expect(screen.getByRole('radio', { name: 'Buscar Geral' })).toBeChecked()
    expect(screen.getByText('Selecionados (1)')).toBeInTheDocument()
    expect(movimentacaoService.resolverItensLote).not.toHaveBeenCalled()
  })

  it('seleciona todos diretamente quando a lista ainda está vazia', async () => {
    vi.mocked(movimentacaoService.resolverItensLote).mockResolvedValue({ itens: [{ ...bemTodos, status: 'aprovado' }] })
    renderPage()
    fireEvent.click(screen.getByRole('radio', { name: 'Todos os bens da UA' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await waitFor(() => expect(movimentacaoService.resolverItensLote).toHaveBeenCalledWith({
      unidade_administrativa_origem: 10, selecionar_todos: true,
    }))
    expect(
      screen.getByRole('button', { name: 'Remover seleção Todos os bens aptos da UA de origem' }),
    ).toBeDisabled()
  })

  it.each(['Buscar Geral', 'Buscar Faixa'])(
    'limpa a seleção exclusiva de todos os bens ao mudar para %s',
    async (modoDestino) => {
      vi.mocked(movimentacaoService.resolverItensLote).mockResolvedValue({
        itens: [{ ...bemTodos, status: 'aprovado' }],
      })
      renderPage()

      fireEvent.click(screen.getByRole('radio', { name: 'Todos os bens da UA' }))
      await screen.findByText('Todos os bens aptos da UA de origem')

      fireEvent.click(screen.getByRole('radio', { name: modoDestino }))

      expect(screen.getByText('Selecionados (0)')).toBeInTheDocument()
      expect(screen.queryByText('Todos os bens aptos da UA de origem')).not.toBeInTheDocument()
    },
  )

  it('resume a faixa com quantidade e bloqueia seus bens em nova busca', async () => {
    vi.mocked(movimentacaoService.buscarBens).mockResolvedValue({
      count: 2, pagina: 1, proxima_pagina: null, itens: [bemFaixa, bemFaixaSeguinte],
    })
    vi.mocked(movimentacaoService.resolverItensLote).mockResolvedValue({
      itens: [
        { ...bemFaixa, status: 'aprovado' },
        { ...bemFaixaSeguinte, status: 'aprovado' },
      ],
    })
    renderPage()
    await selecionarDestino()
    fireEvent.click(screen.getByRole('radio', { name: 'Buscar Faixa' }))
    fireEvent.change(screen.getByLabelText('Número Patrimonial - De'), { target: { value: '0010000000300' } })
    fireEvent.change(screen.getByLabelText('Número Patrimonial - Até'), { target: { value: '0010000000301' } })
    fireEvent.click(screen.getByRole('button', { name: /^buscar$/i }))
    await screen.findByRole('button', { name: 'Importar Faixa' })
    fireEvent.click(screen.getByRole('button', { name: 'Importar Faixa' }))
    expect(await screen.findByText('Selecionados (2)')).toBeInTheDocument()
    expect(screen.getByText('Mesa branca, Mesa lateral')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('radio', { name: 'Buscar Geral' }))
    buscarGeral('mesa')
    expect(await screen.findByRole('checkbox', { name: 'Selecionar bem ID 53' })).toBeDisabled()
    expect(screen.getByRole('checkbox', { name: 'Selecionar bem ID 53' })).toBeChecked()
    fireEvent.click(screen.getByRole('button', { name: /^salvar$/i }))
    await waitFor(() => expect(movimentacaoService.create).toHaveBeenCalledWith({
      unidade_administrativa_origem: 10,
      unidade_orcamentaria_destino: 200,
      observacao: '',
      itens: [{ bem: 53 }, { bem: 55 }],
    }))
  })

  it('não importa uma faixa duplicada', async () => {
    vi.mocked(movimentacaoService.buscarBens).mockResolvedValue({ count: 1, pagina: 1, proxima_pagina: null, itens: [bemFaixa] })
    vi.mocked(movimentacaoService.resolverItensLote).mockResolvedValue({ itens: [{ ...bemFaixa, status: 'aprovado' }] })
    renderPage()
    fireEvent.click(screen.getByRole('radio', { name: 'Buscar Faixa' }))
    const de = screen.getByLabelText('Número Patrimonial - De')
    fireEvent.change(de, { target: { value: '0010000000300' } })
    fireEvent.click(screen.getByRole('button', { name: /^buscar$/i }))
    fireEvent.click(await screen.findByRole('button', { name: 'Importar Faixa' }))
    await waitFor(() => expect(movimentacaoService.resolverItensLote).toHaveBeenCalledTimes(1))
    fireEvent.change(de, { target: { value: '0010000000300' } })
    fireEvent.click(screen.getByRole('button', { name: /^buscar$/i }))
    fireEvent.click(await screen.findByRole('button', { name: 'Importar Faixa' }))
    expect(toast.error).toHaveBeenCalledWith('A faixa informada já foi adicionada à movimentação.')
    expect(movimentacaoService.resolverItensLote).toHaveBeenCalledTimes(1)
  })

  it('apresenta a falha específica ao importar uma faixa', async () => {
    vi.mocked(movimentacaoService.buscarBens).mockResolvedValue({ count: 1, pagina: 1, proxima_pagina: null, itens: [bemFaixa] })
    vi.mocked(movimentacaoService.resolverItensLote).mockRejectedValue(new Error('Bem bloqueado por inventário.'))
    renderPage()
    fireEvent.click(screen.getByRole('radio', { name: 'Buscar Faixa' }))
    fireEvent.change(screen.getByLabelText('Número Patrimonial - De'), { target: { value: '0010000000300' } })
    fireEvent.click(screen.getByRole('button', { name: /^buscar$/i }))
    fireEvent.click(await screen.findByRole('button', { name: 'Importar Faixa' }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Bem bloqueado por inventário.'))
  })

  it('mantém a mensagem retornada quando o salvamento falha', async () => {
    vi.mocked(movimentacaoService.buscarBens).mockResolvedValue({ count: 1, pagina: 1, proxima_pagina: null, itens: [bem] })
    vi.mocked(movimentacaoService.create).mockRejectedValue(new Error('Não foi possível salvar a movimentação.'))
    renderPage()
    await selecionarDestino()
    buscarGeral('cadeira')
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Selecionar bem ID 52' }))
    fireEvent.click(screen.getByRole('button', { name: /^salvar$/i }))
    expect(await screen.findByText('Não foi possível salvar a movimentação.')).toBeInTheDocument()
    expect(toast.error).toHaveBeenCalledWith('Não foi possível salvar a movimentação.')
    expect(navigate).not.toHaveBeenCalled()
  })

  it('aplica a máscara nos dois campos patrimoniais da faixa', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByRole('option', { name: '01.02 - UO Destino' })).toBeInTheDocument())
    fireEvent.click(screen.getByRole('radio', { name: 'Buscar Faixa' }))
    fireEvent.change(screen.getByLabelText('Número Patrimonial - De'), { target: { value: '0010000000300' } })
    fireEvent.change(screen.getByLabelText('Número Patrimonial - Até'), { target: { value: '0010000000400' } })
    expect(screen.getByLabelText('Número Patrimonial - De')).toHaveValue('001.000000030-0')
    expect(screen.getByLabelText('Número Patrimonial - Até')).toHaveValue('001.000000040-0')
  })

  it('não salva sem destino e sem bens selecionados', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /^salvar$/i }))
    expect(await screen.findByText('Adicione ao menos um item de movimentação.')).toBeInTheDocument()
    expect(movimentacaoService.create).not.toHaveBeenCalled()
  })

  it('envia a UA de destino quando a movimentação permanece na mesma UO', async () => {
    vi.mocked(movimentacaoService.buscarBens).mockResolvedValue({ count: 1, pagina: 1, proxima_pagina: null, itens: [bem] })
    renderPage()
    await waitFor(() => expect(screen.getByRole('option', { name: '01.01 - UO Ativa' })).toBeInTheDocument())
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: '1000' } })
    await waitFor(() => expect(screen.getAllByRole('combobox')[1]).toHaveValue('11'))
    buscarGeral('cadeira')
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Selecionar bem ID 52' }))
    fireEvent.click(screen.getByRole('button', { name: /^salvar$/i }))
    await waitFor(() => expect(movimentacaoService.create).toHaveBeenCalledWith({
      unidade_administrativa_origem: 10,
      unidade_orcamentaria_destino: 1000,
      unidade_administrativa_destino: 11,
      observacao: '',
      itens: [{ bem: 52 }],
    }))
  })

  it('bloqueia o salvamento enquanto a busca está em andamento', async () => {
    let concluirBusca: ((value: { count: number; pagina: number; proxima_pagina: null; itens: (typeof bem)[] }) => void) | undefined
    vi.mocked(movimentacaoService.buscarBens).mockReturnValue(new Promise((resolve) => { concluirBusca = resolve }))
    renderPage()
    buscarGeral('cadeira')
    await waitFor(() => expect(screen.getByRole('button', { name: /^salvar$/i })).toBeDisabled())
    concluirBusca?.({ count: 1, pagina: 1, proxima_pagina: null, itens: [bem] })
    await waitFor(() => expect(screen.getByRole('button', { name: /^salvar$/i })).not.toBeDisabled())
  })

  it('informa quando todos os bens da UA não retorna itens aptos', async () => {
    vi.mocked(movimentacaoService.resolverItensLote).mockResolvedValue({ itens: [] })
    renderPage()
    fireEvent.click(screen.getByRole('radio', { name: 'Todos os bens da UA' }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(
      'Nenhum bem aprovado foi encontrado na unidade administrativa de origem.',
    ))
    expect(screen.getByText('Selecionados (0)')).toBeInTheDocument()
  })

  it('apresenta erro da API ao selecionar todos os bens da UA', async () => {
    vi.mocked(movimentacaoService.resolverItensLote).mockRejectedValue(new Error('Falha ao carregar os bens.'))
    renderPage()
    fireEvent.click(screen.getByRole('radio', { name: 'Todos os bens da UA' }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Falha ao carregar os bens.'))
  })

  it('permite retirar um item da lista antes de salvar', async () => {
    vi.mocked(movimentacaoService.buscarBens).mockResolvedValue({ count: 1, pagina: 1, proxima_pagina: null, itens: [bem] })
    renderPage()
    buscarGeral('cadeira')
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Selecionar bem ID 52' }))
    fireEvent.click(screen.getByRole('button', { name: 'Remover seleção ID 52' }))
    expect(screen.getByText('Selecionados (0)')).toBeInTheDocument()
    expect(screen.getByText('Nenhum bem selecionado.')).toBeInTheDocument()
  })
})
