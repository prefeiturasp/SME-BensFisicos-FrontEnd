import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuth } from '@/auth/useAuth'
import { toast } from 'sonner'
import { unidadesAdministrativasService } from '@/modules/configuracoes/unidades-administrativas/services/unidades-administrativas.service'
import { movimentacaoService } from '../services/movimentacao.service'
import AdicionarMovimentacaoPage from './AdicionarMovimentacaoPage'
import { MovimentacaoBensSelection } from '../components/MovimentacaoBensSelection'

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
  movimentacaoService: {
    listOpcoesCadastro: vi.fn(),
    listBensMovimentaveis: vi.fn(),
    resolverItensLote: vi.fn(),
    buscarBens: vi.fn(),
    create: vi.fn(),
  },
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
  status: 'aprovado',
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

async function salvarEConfirmar() {
  fireEvent.click(screen.getByRole('button', { name: /^salvar$/i }))
  await screen.findByRole('dialog', { name: 'Revisar e salvar movimentação' })
  expect(movimentacaoService.create).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Salvar movimentação' }))
}

async function importarFaixaParaEdicao() {
  fireEvent.click(screen.getByRole('tab', { name: 'Busca por faixa' }))
  fireEvent.change(screen.getByLabelText('Número Patrimonial - De'), { target: { value: bemFaixa.numero_patrimonial } })
  fireEvent.click(screen.getByRole('button', { name: /^buscar$/i }))
  fireEvent.click(await screen.findByRole('button', { name: 'Importar Faixa' }))
  return screen.findByRole('button', { name: /^Ver\/editar faixa / })
}

describe('AdicionarMovimentacaoPage', () => {
  beforeAll(() => {
    vi.stubGlobal('ResizeObserver', class {
      observe = vi.fn()
      unobserve = vi.fn()
      disconnect = vi.fn()
    })
  })

  afterAll(() => vi.unstubAllGlobals())

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
    vi.mocked(movimentacaoService.listBensMovimentaveis).mockResolvedValue([])
    vi.mocked(movimentacaoService.resolverItensLote).mockImplementation(async (payload) => ({
      itens: [{ ...(payload.faixas ? bemFaixa : bem), status: 'aprovado' }],
    }))
    vi.mocked(movimentacaoService.create).mockResolvedValue({} as Awaited<ReturnType<typeof movimentacaoService.create>>)
  })

  it('mostra duas formas de seleção e três abas manuais sem tabelas vazias', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByRole('option', { name: '01.02 - UO Destino' })).toBeInTheDocument())
    expect(screen.getByRole('radio', { name: 'Seleção manual' })).toBeChecked()
    expect(screen.getByRole('tab', { name: 'Busca geral' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Busca por faixa' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Todos os bens da UA' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Visualizar todos' })).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByText('Selecionados (0)')).not.toBeInTheDocument()
  })

  it('busca nome, seleciona bem sem número e envia apenas o ID marcado', async () => {
    vi.mocked(movimentacaoService.buscarBens).mockResolvedValue({ count: 1, pagina: 1, proxima_pagina: null, itens: [bem] })
    renderPage()
    await selecionarDestino()
    buscarGeral('cadeira')
    await waitFor(() => expect(movimentacaoService.buscarBens).toHaveBeenCalledWith({
      unidade_administrativa_origem: 10, termo_busca: 'cadeira', pagina: 1,
    }))
    expect(screen.getAllByRole('table')).toHaveLength(1)
    fireEvent.click(screen.getByRole('checkbox', { name: 'Selecionar bem ID 52' }))
    await salvarEConfirmar()
    await waitFor(() => expect(movimentacaoService.create).toHaveBeenCalledWith({
      unidade_administrativa_origem: 10, unidade_orcamentaria_destino: 200,
      observacao: '', itens: [{ bem: 52 }],
    }))
    expect(navigate).toHaveBeenCalledWith('/movimentacoes')
  })

  it('exibe autocomplete patrimonial após o debounce da faixa', async () => {
    vi.mocked(movimentacaoService.listBensMovimentaveis).mockResolvedValue([
      { ...bemFaixa, descricao: 'Mesa', status: 'aprovado' },
    ])
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: 'Busca por faixa' }))

    fireEvent.change(
      screen.getByLabelText('Número Patrimonial - De'),
      { target: { value: '0010000000300' } },
    )

    expect(movimentacaoService.listBensMovimentaveis).not.toHaveBeenCalled()
    const opcao = await screen.findByRole('button', {
      name: '001.000000030-0 - Mesa branca',
    })
    expect(movimentacaoService.listBensMovimentaveis).toHaveBeenCalledWith(
      10,
      '001.000000030-0',
    )
    fireEvent.click(opcao)
    expect(screen.getByLabelText('Número Patrimonial - De')).toHaveValue('001.000000030-0')
  })

  it('não dispara automaticamente a busca geral durante a digitação', async () => {
    renderPage()

    fireEvent.change(
      screen.getByLabelText('Buscar por nome, descrição, ID ou número patrimonial'),
      { target: { value: 'cadeira' } },
    )
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350))
    })

    expect(movimentacaoService.buscarBens).not.toHaveBeenCalled()
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
    fireEvent.click(screen.getByRole('tab', { name: 'Busca por faixa' }))
    expect(screen.getAllByRole('table')).toHaveLength(1)
    expect(screen.queryByRole('checkbox', { name: 'Selecionar bem ID 52' })).not.toBeInTheDocument()
    expect(screen.getByText('Selecionados (1)')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Número Patrimonial - De'), { target: { value: '0010000000300' } })
    fireEvent.click(screen.getByRole('button', { name: /^buscar$/i }))
    await screen.findByRole('button', { name: 'Importar Faixa' })
    vi.mocked(movimentacaoService.resolverItensLote).mockResolvedValue({ itens: [{ ...bemFaixa, status: 'aprovado' }] })
    fireEvent.click(screen.getByRole('button', { name: 'Importar Faixa' }))
    await waitFor(() => expect(screen.getByText('Selecionados (2)')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('tab', { name: 'Busca geral' }))
    await salvarEConfirmar()
    await waitFor(() => expect(movimentacaoService.create).toHaveBeenCalledWith({
      unidade_administrativa_origem: 10, unidade_orcamentaria_destino: 200,
      observacao: '', itens: [{ bem: 52 }, { bem: 53 }],
    }))
  })

  it('busca uma faixa e impede De maior que Até', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: 'Busca por faixa' }))
    fireEvent.change(screen.getByLabelText('Número Patrimonial - De'), { target: { value: '0010000000200' } })
    fireEvent.change(screen.getByLabelText('Número Patrimonial - Até'), { target: { value: '0010000000100' } })
    fireEvent.click(screen.getByRole('button', { name: /^buscar$/i }))
    expect(movimentacaoService.buscarBens).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalled()
    fireEvent.change(screen.getByLabelText('Número Patrimonial - Até'), { target: { value: '0010000000300' } })
    fireEvent.click(screen.getByRole('button', { name: /^buscar$/i }))
    await waitFor(() => expect(movimentacaoService.resolverItensLote).toHaveBeenCalledWith({
      unidade_administrativa_origem: 10,
      faixas: [{ numero_patrimonial_de: '001.000000020-0', numero_patrimonial_ate: '001.000000030-0' }],
    }))
  })

  it.each([
    'Bloqueado por inventário',
    'Este bem já possui uma movimentação pendente.',
    'Este bem está com status Baixa Física e não pode ser movimentado.',
    "O bem 'ID 52' está com status 'Aguardando aprovação' e não pode ser adicionado à movimentação. Somente bens com status 'Aprovado' podem ser incluídos.",
  ])('explica o impedimento em texto e tooltip: %s', async (motivo) => {
    const user = userEvent.setup()
    vi.mocked(movimentacaoService.buscarBens).mockResolvedValue({
      count: 1, pagina: 1, proxima_pagina: null,
      itens: [{ ...bem, apto: false, motivo }],
    })
    renderPage()
    buscarGeral('cadeira')
    expect(await screen.findByText(motivo)).toHaveClass('truncate')
    expect(screen.getByRole('checkbox', { name: 'Selecionar bem ID 52' })).toBeDisabled()
    await user.hover(screen.getByText(motivo))
    expect(await screen.findByRole('tooltip')).toHaveTextContent(motivo)
  })

  it('permite consultar o motivo completo do bloqueio pelo teclado', async () => {
    const user = userEvent.setup()
    const motivo = 'Este bem já possui uma movimentação pendente e não pode ser selecionado.'
    vi.mocked(movimentacaoService.buscarBens).mockResolvedValue({
      count: 1, pagina: 1, proxima_pagina: null,
      itens: [{ ...bem, apto: false, motivo }],
    })
    renderPage()
    buscarGeral('cadeira')
    const trigger = await screen.findByRole('button', { name: 'Motivo do bloqueio do bem ID 52' })
    act(() => trigger.focus())
    expect(trigger).toHaveFocus()
    expect(await screen.findByRole('tooltip')).toHaveTextContent(motivo)
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument())
  })

  it('explica a faixa junto aos campos e ao botão de importação', async () => {
    const user = userEvent.setup()
    vi.mocked(movimentacaoService.buscarBens).mockResolvedValue({
      count: 1, pagina: 1, proxima_pagina: null, itens: [bemFaixa],
    })
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: 'Busca por faixa' }))
    expect(screen.getByRole('button', { name: 'Ajuda sobre Número Patrimonial - De' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ajuda sobre Número Patrimonial - Até' })).toBeInTheDocument()
    await user.hover(screen.getByRole('button', { name: 'Ajuda sobre Número Patrimonial - Até' }))
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Se Até não for preenchido, a busca procurará exatamente o número informado em De.')
    await user.unhover(screen.getByRole('button', { name: 'Ajuda sobre Número Patrimonial - Até' }))
    await user.hover(screen.getByRole('button', { name: 'Exemplos de faixa' }))
    expect(await screen.findByRole('tooltip')).toHaveTextContent('O dígito após o hífen não é considerado')
    expect(screen.getByRole('tooltip')).toHaveTextContent('independentemente do dígito final')
    await user.unhover(screen.getByRole('button', { name: 'Exemplos de faixa' }))
    fireEvent.change(screen.getByLabelText('Número Patrimonial - De'), { target: { value: '0010000000300' } })
    fireEvent.click(screen.getByRole('button', { name: /^buscar$/i }))
    await user.hover(await screen.findByRole('button', { name: 'Ajuda sobre importar faixa' }))
    expect(await screen.findByRole('tooltip')).toHaveTextContent('nenhum bem dessa faixa será adicionado')
    expect(screen.getByRole('tooltip')).toHaveTextContent('até 500 bens')
  })

  it('explica a aprovação obrigatória e os demais impedimentos nos resultados', async () => {
    const user = userEvent.setup()
    vi.mocked(movimentacaoService.buscarBens).mockResolvedValue({ count: 1, pagina: 1, proxima_pagina: null, itens: [bem] })
    renderPage()
    buscarGeral('cadeira')
    await user.hover(await screen.findByRole('button', { name: 'Quem pode ser adicionado?' }))

    const tooltip = await screen.findByRole('tooltip')
    expect(tooltip).toHaveTextContent('status Aprovado')
    expect(tooltip).toHaveTextContent('sem bloqueio por inventário')
    expect(tooltip).toHaveTextContent('sem outra movimentação pendente')
    expect(tooltip).toHaveTextContent('Aparecer na busca não significa que o bem pode ser adicionado')
  })

  it('prioriza o impedimento atual de um bem já incluído em faixa', async () => {
    const user = userEvent.setup()
    const motivo = 'Este bem está bloqueado por inventário e não pode ser adicionado.'
    render(
      <MovimentacaoBensSelection
        resultados={[{ ...bemFaixa, apto: false, motivo }]}
        selecoes={[{ id: 'faixa', tipo: 'faixa', numeroDe: bemFaixa.numero_patrimonial, numeroAte: bemFaixa.numero_patrimonial, bens: [bemFaixa] }]}
        buscaRealizada totalResultados={1} buscando={false} proximaPagina={null}
        permiteImportarFaixa={false} permiteSelecionarResultados modoTodos={false}
        onAlternarBem={vi.fn()} onAlternarResultados={vi.fn()} onImportarFaixa={vi.fn()}
        onCarregarMais={vi.fn()} onRemoverSelecao={vi.fn()}
      />,
    )

    expect(screen.getByText(motivo)).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Selecionar bem ID 53' })).toBeDisabled()
    await user.hover(screen.getByRole('button', { name: 'Motivo do bloqueio do bem ID 53' }))
    expect(await screen.findByRole('tooltip')).toHaveTextContent(motivo)
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
    expect(screen.getByRole('dialog', { name: 'Descartar seleção?' })).toBeInTheDocument()
    expect(movimentacaoService.resolverItensLote).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Descartar selecionados' }))
    await waitFor(() => expect(movimentacaoService.resolverItensLote).toHaveBeenCalledWith({
      unidade_administrativa_origem: 10, selecionar_todos: true,
    }))
    expect(await screen.findByText('Todos os bens aptos da UA de origem')).toBeInTheDocument()
    expect(screen.getByText('Selecionados (1)')).toBeInTheDocument()
    await salvarEConfirmar()
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
    fireEvent.click(screen.getByRole('tab', { name: 'Busca por faixa' }))
    await salvarEConfirmar()
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
    await salvarEConfirmar()
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

  it.each(['sucesso', 'falha'])('ignora %s de importação da UA anterior após trocar a origem', async (resultado) => {
    configurarUsuario(true)
    renderPage()
    await screen.findByRole('option', { name: '002 - UA Alternativa' })
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: '10' } })
    fireEvent.click(screen.getByRole('tab', { name: 'Busca por faixa' }))
    fireEvent.change(screen.getByLabelText('Número Patrimonial - De'), { target: { value: bemFaixa.numero_patrimonial } })
    fireEvent.click(screen.getByRole('button', { name: /^buscar$/i }))
    await screen.findByRole('button', { name: 'Importar Faixa' })
    let concluir!: (value: Awaited<ReturnType<typeof movimentacaoService.resolverItensLote>>) => void
    let falhar!: (reason: Error) => void
    vi.mocked(movimentacaoService.resolverItensLote).mockReturnValueOnce(new Promise((resolve, reject) => {
      concluir = resolve
      falhar = reject
    }))
    fireEvent.click(screen.getByRole('button', { name: 'Importar Faixa' }))
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: '11' } })
    await act(async () => {
      if (resultado === 'sucesso') concluir({ itens: [bemFaixa] })
      else falhar(new Error('Falha na UA anterior'))
    })
    expect(screen.getAllByRole('combobox')[0]).toHaveValue('11')
    expect(screen.queryByText('Selecionados (1)')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Remover seleção/ })).not.toBeInTheDocument()
    expect(toast.error).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /^buscar$/i })).toBeEnabled()
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
    expect(screen.getByRole('radio', { name: 'Seleção manual' })).toBeChecked()
    expect(screen.getByText('Selecionados (1)')).toBeInTheDocument()
    expect(movimentacaoService.resolverItensLote).not.toHaveBeenCalled()
    expect(screen.getByRole('checkbox', { name: 'Selecionar bem ID 52' })).toBeChecked()
    expect(screen.getByLabelText('Buscar por nome, descrição, ID ou número patrimonial')).toHaveValue('cadeira')
  })

  it('seleciona todos sem confirmação quando a lista está vazia e não exibe ações', async () => {
    vi.mocked(movimentacaoService.resolverItensLote).mockResolvedValue({ itens: [{ ...bemTodos, status: 'aprovado' }] })
    renderPage()
    fireEvent.click(screen.getByRole('radio', { name: 'Todos os bens da UA' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await waitFor(() => expect(movimentacaoService.resolverItensLote).toHaveBeenCalledWith({
      unidade_administrativa_origem: 10, selecionar_todos: true,
    }))
    await screen.findByText('Todos os bens aptos da UA de origem')
    expect(screen.queryByRole('button', { name: /Remover seleção/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: 'Selecionar todos os resultados' })).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: `Selecionar bem ID ${bemTodos.id}` })).not.toBeInTheDocument()
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

      fireEvent.click(screen.getByRole('radio', { name: 'Seleção manual' }))
      if (modoDestino === 'Buscar Faixa') fireEvent.click(screen.getByRole('tab', { name: 'Busca por faixa' }))

      expect(screen.queryByText('Selecionados (0)')).not.toBeInTheDocument()
      expect(screen.queryByText('Todos os bens aptos da UA de origem')).not.toBeInTheDocument()
    },
  )

  it('mantém o filtro de faixa se selecionar todos falhar com a lista vazia', async () => {
    vi.mocked(movimentacaoService.resolverItensLote).mockRejectedValue(new Error('Falha ao carregar.'))
    renderPage()
    await waitFor(() => expect(screen.getByRole('option', { name: '01.02 - UO Destino' })).toBeInTheDocument())
    fireEvent.click(screen.getByRole('tab', { name: 'Busca por faixa' }))
    fireEvent.change(screen.getByLabelText('Número Patrimonial - De'), { target: { value: '0010000000300' } })
    fireEvent.click(screen.getByRole('radio', { name: 'Todos os bens da UA' }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Falha ao carregar.'))

    expect(screen.getByRole('radio', { name: 'Seleção manual' })).toBeChecked()
    expect(screen.getByRole('tab', { name: 'Busca por faixa' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByLabelText('Número Patrimonial - De')).toHaveValue('001.000000030-0')
    expect(movimentacaoService.resolverItensLote).toHaveBeenCalled()
  })

  it.each(['Busca geral', 'Busca por faixa', 'Visualizar todos'])(
    'não reexibe erro de itens ao voltar de Todos para %s após tentativa de salvar',
    async (aba) => {
      renderPage()
      fireEvent.click(screen.getByRole('button', { name: /^salvar$/i }))
      expect(await screen.findByText('Adicione ao menos um item de movimentação.')).toBeInTheDocument()
      fireEvent.click(screen.getByRole('radio', { name: 'Todos os bens da UA' }))
      await screen.findByText('Todos os bens aptos da UA de origem')
      await act(async () => { fireEvent.click(screen.getByRole('radio', { name: 'Seleção manual' })) })
      expect(screen.queryByText('Adicione ao menos um item de movimentação.')).not.toBeInTheDocument()
      await act(async () => { fireEvent.click(screen.getByRole('tab', { name: aba })) })
      expect(screen.queryByText('Adicione ao menos um item de movimentação.')).not.toBeInTheDocument()
      expect(screen.getByText('Itens de Movimentação')).toHaveAttribute('data-error', 'false')
      fireEvent.click(screen.getByRole('button', { name: /^salvar$/i }))
      expect(await screen.findByText('Adicione ao menos um item de movimentação.')).toBeInTheDocument()
      expect(movimentacaoService.create).not.toHaveBeenCalled()
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
    fireEvent.click(screen.getByRole('tab', { name: 'Busca por faixa' }))
    fireEvent.change(screen.getByLabelText('Número Patrimonial - De'), { target: { value: '0010000000300' } })
    fireEvent.change(screen.getByLabelText('Número Patrimonial - Até'), { target: { value: '0010000000301' } })
    fireEvent.click(screen.getByRole('button', { name: /^buscar$/i }))
    await screen.findByRole('button', { name: 'Importar Faixa' })
    fireEvent.click(screen.getByRole('button', { name: 'Importar Faixa' }))
    expect(await screen.findByText('Selecionados (2)')).toBeInTheDocument()
    expect(screen.getByText('Mesa branca, Mesa lateral')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'Busca geral' }))
    buscarGeral('mesa')
    expect(await screen.findByRole('checkbox', { name: 'Selecionar bem ID 53' })).toBeDisabled()
    expect(screen.getByRole('checkbox', { name: 'Selecionar bem ID 53' })).toBeChecked()
    await salvarEConfirmar()
    await waitFor(() => expect(movimentacaoService.create).toHaveBeenCalledWith({
      unidade_administrativa_origem: 10,
      unidade_orcamentaria_destino: 200,
      observacao: '',
      itens: [{ bem: 53 }, { bem: 55 }],
    }))
  })

  it('abre a faixa com todos os bens e cancela sem alterar a seleção', async () => {
    vi.mocked(movimentacaoService.resolverItensLote).mockResolvedValue({
      itens: [bemFaixa, bemFaixaSeguinte, { ...bemTodos, numero_patrimonial: '001.000000031-2' }],
    })
    renderPage()
    fireEvent.click(await importarFaixaParaEdicao())
    const dialog = screen.getByRole('dialog', { name: 'Ver/editar faixa' })
    expect(screen.getByText('Mesa branca, Mesa lateral e mais 1')).toBeInTheDocument()
    expect(within(dialog).getAllByRole('row')).toHaveLength(4)
    expect(within(dialog).getByText('Armário')).toBeInTheDocument()
    expect(within(dialog).queryByRole('checkbox')).not.toBeInTheDocument()
    expect(within(dialog).getByLabelText('Número Patrimonial - De')).toHaveValue(bemFaixa.numero_patrimonial)
    fireEvent.change(within(dialog).getByLabelText('Número Patrimonial - Até'), { target: { value: '0010000000355' } })
    expect(within(dialog).getByLabelText('Número Patrimonial - Até')).toHaveValue('001.000000035-5')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('Selecionados (3)')).toBeInTheDocument()
    expect(movimentacaoService.resolverItensLote).toHaveBeenCalledTimes(2)
    fireEvent.click(screen.getByRole('button', { name: /^Ver\/editar faixa / }))
    expect(within(screen.getByRole('dialog')).getByLabelText('Número Patrimonial - Até')).toHaveValue(bemFaixa.numero_patrimonial)
  })

  it('substitui a faixa validada e envia somente os bens da nova seleção', async () => {
    renderPage()
    await selecionarDestino()
    fireEvent.click(await importarFaixaParaEdicao())
    const dialog = screen.getByRole('dialog', { name: 'Ver/editar faixa' })
    fireEvent.change(within(dialog).getByLabelText('Número Patrimonial - Até'), { target: { value: '0010000000311' } })
    const novoBem = { ...bemFaixaSeguinte, numero_patrimonial: '001.000000031-1' }
    vi.mocked(movimentacaoService.resolverItensLote).mockResolvedValueOnce({ itens: [bemFaixa, novoBem] })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Aplicar faixa' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByText('Selecionados (2)')).toBeInTheDocument()
    expect(movimentacaoService.resolverItensLote).toHaveBeenLastCalledWith({
      unidade_administrativa_origem: 10,
      faixas: [{ numero_patrimonial_de: bemFaixa.numero_patrimonial, numero_patrimonial_ate: '001.000000031-1' }],
    })
    await salvarEConfirmar()
    await waitFor(() => expect(movimentacaoService.create).toHaveBeenCalledWith({
      unidade_administrativa_origem: 10, unidade_orcamentaria_destino: 200,
      observacao: '', itens: [{ bem: 53 }, { bem: 55 }],
    }))
  })

  it('libera o bem removido da faixa e mantém bloqueado o bem que permaneceu', async () => {
    vi.mocked(movimentacaoService.resolverItensLote).mockResolvedValue({ itens: [bemFaixa, bemFaixaSeguinte] })
    vi.mocked(movimentacaoService.buscarBens).mockResolvedValue({ count: 2, pagina: 1, proxima_pagina: null, itens: [bemFaixa, bemFaixaSeguinte] })
    renderPage()
    const editar = await importarFaixaParaEdicao()
    fireEvent.click(screen.getByRole('tab', { name: 'Busca geral' }))
    buscarGeral('mesa')
    expect(await screen.findByRole('checkbox', { name: 'Selecionar bem ID 55' })).toBeDisabled()
    fireEvent.click(editar)
    vi.mocked(movimentacaoService.resolverItensLote).mockResolvedValueOnce({ itens: [bemFaixa] })
    const dialog = screen.getByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('Número Patrimonial - Até'), { target: { value: '' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Aplicar faixa' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByRole('checkbox', { name: 'Selecionar bem ID 53' })).toBeDisabled()
    expect(screen.getByRole('checkbox', { name: 'Selecionar bem ID 55' })).toBeEnabled()
    expect(screen.getByRole('checkbox', { name: 'Selecionar bem ID 55' })).not.toBeChecked()
    expect(movimentacaoService.resolverItensLote).toHaveBeenLastCalledWith({
      unidade_administrativa_origem: 10, faixas: [{ numero_patrimonial_de: bemFaixa.numero_patrimonial }],
    })
  })

  it.each(['Há um número ausente na sequência.', 'Este bem possui uma movimentação pendente.'])(
    'mantém a faixa original quando a validação rejeita: %s', async (mensagem) => {
      renderPage()
      fireEvent.click(await importarFaixaParaEdicao())
      const dialog = screen.getByRole('dialog')
      vi.mocked(movimentacaoService.resolverItensLote).mockRejectedValueOnce(new Error(mensagem))
      fireEvent.click(within(dialog).getByRole('button', { name: 'Aplicar faixa' }))
      expect(await within(dialog).findByRole('alert')).toHaveTextContent(mensagem)
      expect(screen.getByText('Selecionados (1)')).toBeInTheDocument()
      expect(within(dialog).getByText(bemFaixa.nome)).toBeInTheDocument()
      expect(within(dialog).getByRole('button', { name: 'Aplicar faixa' })).toBeEnabled()
    },
  )

  it('mantém a seleção e bloqueia novos cliques enquanto valida a edição', async () => {
    renderPage()
    fireEvent.click(await importarFaixaParaEdicao())
    let concluir!: (value: Awaited<ReturnType<typeof movimentacaoService.resolverItensLote>>) => void
    vi.mocked(movimentacaoService.resolverItensLote).mockReturnValueOnce(new Promise((resolve) => { concluir = resolve }))
    const dialog = screen.getByRole('dialog')
    const aplicar = within(dialog).getByRole('button', { name: 'Aplicar faixa' })
    fireEvent.click(aplicar)
    fireEvent.click(aplicar)
    expect(within(dialog).getByLabelText('Número Patrimonial - De')).toBeDisabled()
    expect(within(dialog).getByRole('button', { name: 'Cancelar' })).toBeDisabled()
    expect(within(dialog).getByRole('button', { name: 'Validando faixa...' })).toBeDisabled()
    expect(screen.getByText('Selecionados (1)')).toBeInTheDocument()
    expect(movimentacaoService.resolverItensLote).toHaveBeenCalledTimes(3)
    await act(async () => concluir({ itens: [] }))
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Nenhum bem apto foi encontrado')
    expect(within(dialog).getByRole('button', { name: 'Aplicar faixa' })).toBeEnabled()
    expect(screen.getByText('Selecionados (1)')).toBeInTheDocument()
  })

  it('permite reimportar os limites anteriores após substituir a faixa', async () => {
    renderPage()
    fireEvent.click(await importarFaixaParaEdicao())
    const dialog = screen.getByRole('dialog')
    const novoBem = { ...bemFaixaSeguinte, numero_patrimonial: '001.000000031-1' }
    fireEvent.change(within(dialog).getByLabelText('Número Patrimonial - De'), { target: { value: novoBem.numero_patrimonial } })
    fireEvent.change(within(dialog).getByLabelText('Número Patrimonial - Até'), { target: { value: '' } })
    vi.mocked(movimentacaoService.resolverItensLote).mockResolvedValueOnce({ itens: [novoBem] })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Aplicar faixa' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    fireEvent.change(screen.getByLabelText('Número Patrimonial - De'), { target: { value: bemFaixa.numero_patrimonial } })
    fireEvent.click(screen.getByRole('button', { name: /^buscar$/i }))
    fireEvent.click(await screen.findByRole('button', { name: 'Importar Faixa' }))
    await screen.findByText('Selecionados (2)')
    const removerOriginal = screen.getByRole('button', { name: `Remover seleção ${bemFaixa.numero_patrimonial}` })
    fireEvent.click(removerOriginal)
    expect(screen.getByText('Selecionados (2)')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Remover da seleção' }))
    expect(screen.getByText('Selecionados (1)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: `Remover seleção ${novoBem.numero_patrimonial}` })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: `Remover seleção ${bemFaixa.numero_patrimonial}` })).not.toBeInTheDocument()
  })

  it('impede sobreposição com um bem selecionado individualmente', async () => {
    vi.mocked(movimentacaoService.buscarBens).mockResolvedValue({ count: 1, pagina: 1, proxima_pagina: null, itens: [bem] })
    renderPage()
    buscarGeral('cadeira')
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Selecionar bem ID 52' }))
    fireEvent.click(await importarFaixaParaEdicao())
    vi.mocked(movimentacaoService.resolverItensLote).mockResolvedValueOnce({ itens: [bemFaixa, bem] })
    const dialog = screen.getByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Aplicar faixa' }))
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Um ou mais bens da faixa já foram adicionados')
    expect(screen.getByText('Selecionados (2)')).toBeInTheDocument()
    expect(within(dialog).queryByText(bem.nome)).not.toBeInTheDocument()
  })

  it.each([
    ['', '', 'Informe o Número Patrimonial - De.'],
    ['001.000000040-0', '001.000000030-0', 'O Número Patrimonial Até deve ser maior ou igual'],
  ])('não consulta a API para limites inválidos: %s / %s', async (de, ate, erro) => {
    renderPage()
    fireEvent.click(await importarFaixaParaEdicao())
    const dialog = screen.getByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('Número Patrimonial - De'), { target: { value: de } })
    fireEvent.change(within(dialog).getByLabelText('Número Patrimonial - Até'), { target: { value: ate } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Aplicar faixa' }))
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(erro)
    expect(movimentacaoService.resolverItensLote).toHaveBeenCalledTimes(2)
  })

  it('não importa uma faixa duplicada', async () => {
    vi.mocked(movimentacaoService.buscarBens).mockResolvedValue({ count: 1, pagina: 1, proxima_pagina: null, itens: [bemFaixa] })
    vi.mocked(movimentacaoService.resolverItensLote).mockResolvedValue({ itens: [{ ...bemFaixa, status: 'aprovado' }] })
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: 'Busca por faixa' }))
    const de = screen.getByLabelText('Número Patrimonial - De')
    fireEvent.change(de, { target: { value: '0010000000300' } })
    fireEvent.click(screen.getByRole('button', { name: /^buscar$/i }))
    fireEvent.click(await screen.findByRole('button', { name: 'Importar Faixa' }))
    await screen.findByText('Selecionados (1)')
    expect(movimentacaoService.resolverItensLote).toHaveBeenCalledTimes(2)
    fireEvent.change(de, { target: { value: '0010000000300' } })
    fireEvent.click(screen.getByRole('button', { name: /^buscar$/i }))
    fireEvent.click(await screen.findByRole('button', { name: 'Importar Faixa' }))
    expect(toast.error).toHaveBeenCalledWith('A faixa informada já foi adicionada à movimentação.')
    expect(movimentacaoService.resolverItensLote).toHaveBeenCalledTimes(3)
  })

  it('apresenta a falha específica ao importar uma faixa', async () => {
    vi.mocked(movimentacaoService.buscarBens).mockResolvedValue({ count: 1, pagina: 1, proxima_pagina: null, itens: [bemFaixa] })
    vi.mocked(movimentacaoService.resolverItensLote)
      .mockResolvedValueOnce({ itens: [{ ...bemFaixa, status: 'aprovado' }] })
      .mockRejectedValueOnce(new Error('Bem bloqueado por inventário.'))
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: 'Busca por faixa' }))
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
    await salvarEConfirmar()
    expect((await screen.findAllByText('Não foi possível salvar a movimentação.')).length).toBeGreaterThan(0)
    expect(toast.error).toHaveBeenCalledWith('Não foi possível salvar a movimentação.')
    expect(navigate).not.toHaveBeenCalled()
  })

  it('aplica a máscara nos dois campos patrimoniais da faixa', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByRole('option', { name: '01.02 - UO Destino' })).toBeInTheDocument())
    fireEvent.click(screen.getByRole('tab', { name: 'Busca por faixa' }))
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
    await salvarEConfirmar()
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
    expect(screen.queryByText('Selecionados (0)')).not.toBeInTheDocument()
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
    fireEvent.click(screen.getByRole('button', { name: 'Remover seleção Sem número patrimonial' }))
    expect(screen.getByText('Selecionados (1)')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }))
    expect(screen.getByText('Selecionados (1)')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Remover seleção Sem número patrimonial' }))
    fireEvent.click(screen.getByRole('button', { name: 'Remover da seleção' }))
    expect(screen.queryByText('Selecionados (1)')).not.toBeInTheDocument()
    expect(screen.queryByText('Selecionados (0)')).not.toBeInTheDocument()
    expect(screen.queryByText('Nenhum bem selecionado.')).not.toBeInTheDocument()
  })

  it('busca em branco consulta todos os bens da UA sem selecionar automaticamente', async () => {
    vi.mocked(movimentacaoService.buscarBens).mockResolvedValue({ count: 1, pagina: 1, proxima_pagina: null, itens: [bem] })
    renderPage()
    buscarGeral('   ')
    expect(await screen.findByRole('checkbox', { name: 'Selecionar bem ID 52' })).not.toBeChecked()
    expect(movimentacaoService.buscarBens).toHaveBeenCalledWith({ unidade_administrativa_origem: 10, pagina: 1 })
    expect(screen.getAllByRole('table')).toHaveLength(1)
  })

  it('Visualizar todos permite marcar e desmarcar sem perder seleções ao mudar de aba', async () => {
    vi.mocked(movimentacaoService.buscarBens).mockResolvedValue({ count: 2, pagina: 1, proxima_pagina: null, itens: [bem, bemTodos] })
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: 'Visualizar todos' }))
    const primeiro = await screen.findByRole('checkbox', { name: 'Selecionar bem ID 52' })
    fireEvent.click(screen.getByRole('checkbox', { name: 'Selecionar todos os resultados' }))
    expect(primeiro).toBeChecked()
    fireEvent.click(primeiro)
    expect(primeiro).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Selecionar bem ID 54' })).toBeChecked()
    fireEvent.click(screen.getByRole('tab', { name: 'Busca geral' }))
    expect(screen.getByText('Selecionados (1)')).toBeInTheDocument()
    expect(screen.getByText('Armário')).toBeInTheDocument()
  })

  it('Visualizar todos carrega mais sem selecionar bens impedidos', async () => {
    vi.mocked(movimentacaoService.buscarBens)
      .mockResolvedValueOnce({ count: 2, pagina: 1, proxima_pagina: 2, itens: [bem] })
      .mockResolvedValueOnce({ count: 2, pagina: 2, proxima_pagina: null, itens: [{ ...bemTodos, apto: false, motivo: 'Bloqueado por inventário' }] })
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: 'Visualizar todos' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Carregar mais' }))
    expect(await screen.findByRole('checkbox', { name: 'Selecionar bem ID 54' })).toBeDisabled()
    fireEvent.click(screen.getByRole('checkbox', { name: 'Selecionar todos os resultados' }))
    expect(screen.getByRole('checkbox', { name: 'Selecionar bem ID 52' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Selecionar bem ID 54' })).not.toBeChecked()
    expect(movimentacaoService.buscarBens).toHaveBeenLastCalledWith({ unidade_administrativa_origem: 10, pagina: 2 })
  })

  it('confere origem, destino, observação e bens antes de gravar e preserva ao voltar', async () => {
    vi.mocked(movimentacaoService.buscarBens).mockResolvedValue({ count: 1, pagina: 1, proxima_pagina: null, itens: [bem] })
    renderPage()
    await selecionarDestino()
    fireEvent.change(screen.getByLabelText('Observação'), { target: { value: 'Reposição da sala' } })
    buscarGeral('cadeira')
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Selecionar bem ID 52' }))
    fireEvent.click(screen.getByRole('button', { name: /^salvar$/i }))
    const resumo = within(await screen.findByRole('dialog', { name: 'Revisar e salvar movimentação' }))
    expect(resumo.getByText('001 - UA Origem')).toBeInTheDocument()
    expect(resumo.getByText('01.02 - UO Destino')).toBeInTheDocument()
    expect(resumo.getByText('Reposição da sala')).toBeInTheDocument()
    expect(resumo.getByText('Cadeira azul')).toBeInTheDocument()
    expect(resumo.queryByRole('button', { name: /Remover seleção/ })).not.toBeInTheDocument()
    expect(movimentacaoService.create).not.toHaveBeenCalled()
    fireEvent.click(resumo.getByRole('button', { name: 'Voltar para editar' }))
    expect(screen.getByLabelText('Observação')).toHaveValue('Reposição da sala')
    expect(screen.getByRole('checkbox', { name: 'Selecionar bem ID 52' })).toBeChecked()
  })

  it('avisa quais seleções serão substituídas e preserva tudo se a consulta de todos falhar', async () => {
    vi.mocked(movimentacaoService.buscarBens).mockResolvedValue({ count: 1, pagina: 1, proxima_pagina: null, itens: [bem] })
    vi.mocked(movimentacaoService.resolverItensLote).mockRejectedValue(new Error('Consulta indisponível'))
    renderPage()
    buscarGeral('cadeira')
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Selecionar bem ID 52' }))
    fireEvent.click(screen.getByRole('radio', { name: 'Todos os bens da UA' }))
    const aviso = within(screen.getByRole('dialog', { name: 'Descartar seleção?' }))
    expect(aviso.getByText('Cadeira azul')).toBeInTheDocument()
    expect(aviso.queryByRole('button', { name: /Remover seleção/ })).not.toBeInTheDocument()
    fireEvent.click(aviso.getByRole('button', { name: 'Descartar selecionados' }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Consulta indisponível'))
    expect(aviso.getByRole('alert')).toHaveTextContent('Consulta indisponível')
    expect(screen.getByRole('radio', { name: 'Seleção manual' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Selecionar bem ID 52' })).toBeChecked()
    vi.mocked(movimentacaoService.resolverItensLote).mockResolvedValue({ itens: [{ ...bem, status: 'aprovado' }] })
    fireEvent.click(aviso.getByRole('button', { name: 'Descartar selecionados' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByRole('radio', { name: 'Todos os bens da UA' })).toBeChecked()
  })

  it('mantém os itens de faixa bloqueados em Visualizar todos', async () => {
    vi.mocked(movimentacaoService.buscarBens).mockResolvedValue({ count: 1, pagina: 1, proxima_pagina: null, itens: [bemFaixa] })
    vi.mocked(movimentacaoService.resolverItensLote).mockResolvedValue({ itens: [{ ...bemFaixa, status: 'aprovado' }] })
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: 'Busca por faixa' }))
    fireEvent.change(screen.getByLabelText('Número Patrimonial - De'), { target: { value: bemFaixa.numero_patrimonial } })
    fireEvent.click(screen.getByRole('button', { name: /^buscar$/i }))
    fireEvent.click(await screen.findByRole('button', { name: 'Importar Faixa' }))
    await screen.findByText('Selecionados (1)')
    fireEvent.click(screen.getByRole('tab', { name: 'Visualizar todos' }))
    const item = await screen.findByRole('checkbox', { name: 'Selecionar bem ID 53' })
    expect(item).toBeChecked()
    expect(item).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: `Remover seleção ${bemFaixa.numero_patrimonial}` }))
    expect(screen.getByRole('checkbox', { name: 'Selecionar bem ID 53' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Remover da seleção' }))
    expect(item).not.toBeChecked()
    expect(item).toBeEnabled()
  })

  it('impede envio duplicado enquanto confirma e salva a movimentação', async () => {
    let concluir: ((value: Awaited<ReturnType<typeof movimentacaoService.create>>) => void) | undefined
    vi.mocked(movimentacaoService.create).mockReturnValue(new Promise((resolve) => { concluir = resolve }))
    vi.mocked(movimentacaoService.buscarBens).mockResolvedValue({ count: 1, pagina: 1, proxima_pagina: null, itens: [bem] })
    renderPage()
    await selecionarDestino()
    buscarGeral('cadeira')
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Selecionar bem ID 52' }))
    fireEvent.click(screen.getByRole('button', { name: /^salvar$/i }))
    const confirmar = await screen.findByRole('button', { name: 'Salvar movimentação' })
    fireEvent.click(confirmar)
    fireEvent.click(confirmar)
    await waitFor(() => expect(movimentacaoService.create).toHaveBeenCalledTimes(1))
    expect(within(screen.getByRole('dialog', { name: 'Revisar e salvar movimentação' })).getByRole('button', { name: 'Salvando...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Voltar para editar' })).toBeDisabled()
    await act(async () => { concluir?.({} as Awaited<ReturnType<typeof movimentacaoService.create>>) })
    expect(navigate).toHaveBeenCalledWith('/movimentacoes')
  })

  it('distingue visualmente bens impedidos sem bloquear um bem apto sem numeração', async () => {
    vi.mocked(movimentacaoService.buscarBens).mockResolvedValue({ count: 2, pagina: 1, proxima_pagina: null, itens: [bem,
      { ...bemTodos, apto: false, motivo: 'Movimentação pendente' },
    ] })
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: 'Visualizar todos' }))
    const apto = await screen.findByRole('checkbox', { name: 'Selecionar bem ID 52' })
    const impedido = screen.getByRole('checkbox', { name: 'Selecionar bem ID 54' })
    expect(apto).toBeEnabled()
    expect(apto.closest('tr')).toHaveAttribute('aria-disabled', 'false')
    expect(impedido).toBeDisabled()
    expect(impedido.closest('tr')).toHaveClass('bg-gray-100', 'text-gray-500')
    fireEvent.click(apto)
    expect(screen.getByRole('region', { name: 'Bens selecionados' })).toHaveTextContent('Sem número patrimonial')
    expect(screen.getByRole('region', { name: 'Bens selecionados' })).not.toHaveTextContent('ID 52')
  })

  it('não mostra aviso de busca vazia após selecionar todos automaticamente', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('radio', { name: 'Todos os bens da UA' }))
    const selecionados = within(await screen.findByRole('region', { name: 'Bens selecionados automaticamente' }))
    expect(selecionados.getByRole('table')).toBeInTheDocument()
    expect(selecionados.getByText('Cadeira azul')).toBeVisible()
    expect(selecionados.getByText('Sem número patrimonial')).toBeVisible()
    expect(selecionados.queryByText('Ver bens incluídos')).not.toBeInTheDocument()
    expect(selecionados.queryByRole('columnheader', { name: 'Ação' })).not.toBeInTheDocument()
    expect(selecionados.queryByRole('columnheader', { name: 'Quantidade' })).not.toBeInTheDocument()
    expect(selecionados.queryByRole('checkbox')).not.toBeInTheDocument()
    expect(screen.queryByText('Nenhum bem encontrado para a busca informada.')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Remover seleção/ })).not.toBeInTheDocument()
  })

  it('valida De e Até antes de exibir resultados sem checkbox e sem selecionar automaticamente', async () => {
    vi.mocked(movimentacaoService.resolverItensLote).mockResolvedValue({
      itens: [bemFaixa, bemFaixaSeguinte].map((item) => ({ ...item, status: 'aprovado' })),
    })
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: 'Busca por faixa' }))
    expect(screen.queryByRole('button', { name: 'Escolher faixa na lista' })).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Número Patrimonial - De'), { target: { value: bemFaixa.numero_patrimonial } })
    fireEvent.change(screen.getByLabelText('Número Patrimonial - Até'), { target: { value: bemFaixaSeguinte.numero_patrimonial } })
    fireEvent.click(screen.getByRole('button', { name: /^buscar$/i }))
    expect(await screen.findByText('Resultados da Busca (2)')).toBeInTheDocument()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Importar Faixa' })).toBeEnabled()
    expect(movimentacaoService.resolverItensLote).toHaveBeenLastCalledWith({
      unidade_administrativa_origem: 10,
      faixas: [{ numero_patrimonial_de: bemFaixa.numero_patrimonial, numero_patrimonial_ate: bemFaixaSeguinte.numero_patrimonial }],
    })
    expect(screen.queryByText('Selecionados (1)')).not.toBeInTheDocument()
    expect(movimentacaoService.create).not.toHaveBeenCalled()
    expect(movimentacaoService.buscarBens).not.toHaveBeenCalled()
  })

  it.each([
    'O número 001.000000011 não existe na UA de origem.',
    'Um bem da faixa está bloqueado por inventário.',
    'Informe números patrimoniais comparáveis.',
    'Cada faixa pode conter no máximo 500 bens.',
  ])('não apresenta uma faixa rejeitada como resultado válido: %s', async (motivo) => {
    vi.mocked(movimentacaoService.resolverItensLote).mockRejectedValue(new Error(motivo))
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: 'Busca por faixa' }))
    fireEvent.change(screen.getByLabelText('Número Patrimonial - De'), { target: { value: '0010000000100' } })
    fireEvent.change(screen.getByLabelText('Número Patrimonial - Até'), { target: { value: '0010000000120' } })
    fireEvent.click(screen.getByRole('button', { name: /^buscar$/i }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(motivo))
    expect(screen.getByText(motivo)).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Importar Faixa' })).not.toBeInTheDocument()
  })

  it('retira resultados anteriores se a mesma faixa deixar de ser válida', async () => {
    vi.mocked(movimentacaoService.resolverItensLote)
      .mockResolvedValueOnce({ itens: [{ ...bemFaixa, status: 'aprovado' }] })
      .mockRejectedValueOnce(new Error('Um bem passou a ter movimentação pendente.'))
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: 'Busca por faixa' }))
    fireEvent.change(screen.getByLabelText('Número Patrimonial - De'), { target: { value: bemFaixa.numero_patrimonial } })
    fireEvent.click(screen.getByRole('button', { name: /^buscar$/i }))
    await screen.findByRole('button', { name: 'Importar Faixa' })
    fireEvent.click(screen.getByRole('button', { name: /^buscar$/i }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Um bem passou a ter movimentação pendente.'))
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Importar Faixa' })).not.toBeInTheDocument()
  })

  it('sem Até valida somente o De e ignora a resposta de uma busca desatualizada', async () => {
    type Resposta = Awaited<ReturnType<typeof movimentacaoService.resolverItensLote>>
    let concluir: ((resposta: Resposta) => void) | undefined
    vi.mocked(movimentacaoService.resolverItensLote).mockReturnValueOnce(new Promise((resolve) => { concluir = resolve }))
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: 'Busca por faixa' }))
    fireEvent.change(screen.getByLabelText('Número Patrimonial - De'), { target: { value: bemFaixa.numero_patrimonial } })
    fireEvent.click(screen.getByRole('button', { name: /^buscar$/i }))
    expect(movimentacaoService.resolverItensLote).toHaveBeenCalledWith({
      unidade_administrativa_origem: 10, faixas: [{ numero_patrimonial_de: bemFaixa.numero_patrimonial }],
    })
    fireEvent.change(screen.getByLabelText('Número Patrimonial - Até'), { target: { value: '0010000000400' } })
    await act(async () => { concluir?.({ itens: [{ ...bemFaixa, status: 'aprovado' }] }) })
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Importar Faixa' })).not.toBeInTheDocument()
  })
})
