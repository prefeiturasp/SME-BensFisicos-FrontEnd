import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BemImportPage from '../BemImportPage'
import * as useBemImportModule from '../../hooks/useBemImport'

// ---------------------------------------------------------------------------
// Mocks de infra
// ---------------------------------------------------------------------------

vi.mock('@/components/AppBreadcrumb', () => ({
  AppBreadcrumb: ({ items }: any) => (
    <nav data-testid='breadcrumb'>
      {items.map((i: any) => <span key={i.label}>{i.label}</span>)}
    </nav>
  ),
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, className, type }: any) => (
    <button onClick={onClick} disabled={disabled} className={className} type={type}>
      {children}
    </button>
  ),
}))

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => (
    <div data-testid='card' className={className}>{children}</div>
  ),
}))

vi.mock('lucide-react', () => ({
  Network: () => <svg data-testid='icon-network' />,
  Upload: () => <svg data-testid='icon-upload' />,
  Trash2: () => <svg data-testid='icon-trash' />,
  Paperclip: () => <svg data-testid='icon-paperclip' />,
}))

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function makeHookMock(overrides: Partial<ReturnType<typeof useBemImportModule.useBemImport>> = {}) {
  const fakeInputRef = { current: null } as React.RefObject<HTMLInputElement>

  const defaults: ReturnType<typeof useBemImportModule.useBemImport> = {
    estado: { tipo: 'idle' },
    arquivo: null,
    importando: false,
    inputRef: fakeInputRef,
    selecionarArquivo: vi.fn(),
    removerArquivo: vi.fn(),
    novoUpload: vi.fn(),
    importar: vi.fn(),
    cancelar: vi.fn(),
  }

  return { ...defaults, ...overrides }
}

function mockHook(overrides: Partial<ReturnType<typeof useBemImportModule.useBemImport>> = {}) {
  vi.spyOn(useBemImportModule, 'useBemImport').mockReturnValue(makeHookMock(overrides))
}

// ---------------------------------------------------------------------------
// Estado idle
// ---------------------------------------------------------------------------

describe('BemImportPage — estado idle', () => {
  beforeEach(() => mockHook())

  it('renderiza o título da página', () => {
    render(<BemImportPage />)
    expect(
      screen.getByRole('heading', { name: 'Importação de carga de Bens Patrimoniais' })
    ).toBeInTheDocument()
  })

  it('renderiza o breadcrumb com os itens corretos', () => {
    render(<BemImportPage />)
    const breadcrumb = screen.getByTestId('breadcrumb')
    expect(breadcrumb).toHaveTextContent('Bem Patrimonial')
    expect(breadcrumb).toHaveTextContent('Bens Patrimoniais')
    expect(breadcrumb).toHaveTextContent('Importação de carga de Bens Patrimoniais')
  })

  it('botão Importar está desabilitado quando não há arquivo', () => {
    render(<BemImportPage />)
    const btn = screen.getByText('Importar').closest('button') as HTMLButtonElement
    expect(btn).toBeDisabled()
  })

  it('botão Cancelar está habilitado', () => {
    render(<BemImportPage />)
    const btn = screen.getByText('Cancelar').closest('button') as HTMLButtonElement
    expect(btn).not.toBeDisabled()
  })

  it('botão Cancelar chama cancelar do hook', async () => {
    const cancelar = vi.fn()
    mockHook({ cancelar })
    render(<BemImportPage />)
    await userEvent.click(screen.getByText('Cancelar'))
    expect(cancelar).toHaveBeenCalledOnce()
  })

  it('exibe texto de instrução e link do modelo', () => {
    render(<BemImportPage />)
    expect(screen.getByText('Adicionar Bens Patrimoniais em lote')).toBeInTheDocument()
    expect(screen.getByText('[clique aqui para baixar o modelo]')).toBeInTheDocument()
    expect(
      screen.getByText(/É possível realizar importação de Bens apenas sem Conciliações em aberto\./)
    ).toBeInTheDocument()
  })

  it('exibe botão Anexar Documento', () => {
    render(<BemImportPage />)
    expect(screen.getByText('Anexar Documento')).toBeInTheDocument()
  })

  it('não exibe nenhum toast', () => {
    render(<BemImportPage />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('botão de download do modelo existe e é clicável', () => {
    render(<BemImportPage />)
    const btn = screen.getByText('[clique aqui para baixar o modelo]')
    expect(btn).toBeInTheDocument()
    expect((btn as HTMLButtonElement).type).toBe('button')
  })
})

// ---------------------------------------------------------------------------
// Estado arquivo_selecionado
// ---------------------------------------------------------------------------

describe('BemImportPage — estado arquivo_selecionado', () => {
  const arquivo = new File(['x'], 'bens.xlsx')

  beforeEach(() => {
    mockHook({
      estado: { tipo: 'arquivo_selecionado', arquivo },
      arquivo,
      importando: false,
    })
  })

  it('exibe o nome do arquivo', () => {
    render(<BemImportPage />)
    expect(screen.getByText('bens.xlsx')).toBeInTheDocument()
  })

  it('botão Importar está habilitado', () => {
    render(<BemImportPage />)
    const btn = screen.getByText('Importar').closest('button') as HTMLButtonElement
    expect(btn).not.toBeDisabled()
  })

  it('botão Importar chama importar do hook', async () => {
    const importar = vi.fn()
    mockHook({ estado: { tipo: 'arquivo_selecionado', arquivo }, arquivo, importar })
    render(<BemImportPage />)
    await userEvent.click(screen.getByText('Importar'))
    expect(importar).toHaveBeenCalledOnce()
  })

  it('botão de remover arquivo chama removerArquivo', async () => {
    const removerArquivo = vi.fn()
    mockHook({ estado: { tipo: 'arquivo_selecionado', arquivo }, arquivo, removerArquivo })
    render(<BemImportPage />)
    await userEvent.click(screen.getByRole('button', { name: 'Remover arquivo' }))
    expect(removerArquivo).toHaveBeenCalledOnce()
  })

  it('não exibe botão Anexar Documento (exibe ArquivoAnexado)', () => {
    render(<BemImportPage />)
    expect(screen.queryByText('Anexar Documento')).not.toBeInTheDocument()
    expect(screen.getByText('bens.xlsx')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Estado importando
// ---------------------------------------------------------------------------

describe('BemImportPage — estado importando', () => {
  beforeEach(() => {
    mockHook({
      estado: { tipo: 'importando' },
      arquivo: null,
      importando: true,
    })
  })

  it('botão exibe "Importando..."', () => {
    render(<BemImportPage />)
    expect(screen.getByText('Importando...')).toBeInTheDocument()
  })

  it('botão Importar está desabilitado durante importação', () => {
    render(<BemImportPage />)
    const btn = screen.getByText('Importando...').closest('button') as HTMLButtonElement
    expect(btn).toBeDisabled()
  })
})

// ---------------------------------------------------------------------------
// Estado sucesso
// ---------------------------------------------------------------------------

describe('BemImportPage — estado sucesso', () => {
  beforeEach(() => {
    mockHook({
      estado: {
        tipo: 'sucesso',
        resultado: {
          detail: '10 bens importados com sucesso.',
          importados: 10,
          ignorados_com_erro: 0,
          total_linhas: 10,
        },
      },
    })
  })

  it('exibe toast de sucesso', () => {
    render(<BemImportPage />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Importação realizada')).toBeInTheDocument()
    expect(screen.getByText('10 bens importados com sucesso.')).toBeInTheDocument()
  })

  it('toast de sucesso tem ícone ✓', () => {
    render(<BemImportPage />)
    expect(screen.getByText('✓')).toBeInTheDocument()
  })

  it('não exibe tabela de erros', () => {
    render(<BemImportPage />)
    expect(screen.queryByText('Foram identificados erros na planilha')).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Estado erro_total
// ---------------------------------------------------------------------------

describe('BemImportPage — estado erro_total', () => {
  const erros = [
    { linha: 1, numero_patrimonial: '001.000000001-0', campo: 'nome', tipo_erro: 'nome: Número patrimonial já cadastrado.' },
    { linha: 3, numero_patrimonial: '-', campo: 'marca', tipo_erro: 'marca: Duplicado no arquivo.' },
  ]

  beforeEach(() => {
    mockHook({
      estado: {
        tipo: 'erro_total',
        erros,
        detail: 'Nenhum bem foi importado.',
      },
    })
  })

  it('exibe toast de erro', () => {
    render(<BemImportPage />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Importação não realizada')).toBeInTheDocument()
    expect(screen.getByText('Nenhum bem foi importado.')).toBeInTheDocument()
  })

  it('toast de erro tem ícone ✗', () => {
    render(<BemImportPage />)
    expect(screen.getByText('✗')).toBeInTheDocument()
  })

  it('exibe cabeçalho de erros', () => {
    render(<BemImportPage />)
    expect(screen.getByText('Foram identificados erros na planilha')).toBeInTheDocument()
  })

  it('exibe botão Anexar Documento na tabela de erros', () => {
    render(<BemImportPage />)
    expect(screen.getByText('Anexar Documento')).toBeInTheDocument()
  })

  it('exibe todas as linhas de erro na tabela', () => {
    render(<BemImportPage />)
    expect(screen.getByText('001.000000001-0')).toBeInTheDocument()
    expect(screen.getByText('nome: Número patrimonial já cadastrado.')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('marca: Duplicado no arquivo.')).toBeInTheDocument()
  })

  it('exibe cabeçalhos da tabela incluindo Campo', () => {
    render(<BemImportPage />)
    expect(screen.getByText('Linha do Arquivo')).toBeInTheDocument()
    expect(screen.getByText('Número Patrimonial')).toBeInTheDocument()
    expect(screen.getByText('Campo')).toBeInTheDocument()
    expect(screen.getByText('Tipo de erro')).toBeInTheDocument()
  })

  it('exibe valores da coluna Campo', () => {
    render(<BemImportPage />)
    expect(screen.getByText('nome')).toBeInTheDocument()
    expect(screen.getByText('marca')).toBeInTheDocument()
  })

  it('botão Importar está desabilitado (sem arquivo selecionado)', () => {
    render(<BemImportPage />)
    const btn = screen.getByText('Importar').closest('button') as HTMLButtonElement
    expect(btn).toBeDisabled()
  })

  it('clique em Anexar Documento chama novoUpload', async () => {
    const novoUpload = vi.fn()
    mockHook({
      estado: { tipo: 'erro_total', erros, detail: 'Nenhum bem.' },
      novoUpload,
    })
    render(<BemImportPage />)
    await userEvent.click(screen.getByText('Anexar Documento'))
    expect(novoUpload).toHaveBeenCalledOnce()
  })

  it('selecionar novo arquivo na tabela de erros chama selecionarArquivo', () => {
    const selecionarArquivo = vi.fn()
    mockHook({
      estado: { tipo: 'erro_total', erros, detail: 'Nenhum bem.' },
      selecionarArquivo,
    })
    render(<BemImportPage />)

    const inputs = document.querySelectorAll('input[type="file"]')
    const inputTabela = inputs[inputs.length - 1] as HTMLInputElement
    const file = new File(['x'], 'novo.xlsx')
    Object.defineProperty(inputTabela, 'files', { value: [file], configurable: true })
    fireEvent.change(inputTabela)

    expect(selecionarArquivo).toHaveBeenCalledWith(file)
  })
})

// ---------------------------------------------------------------------------
// Estado erro_request
// ---------------------------------------------------------------------------

describe('BemImportPage — estado erro_request', () => {
  beforeEach(() => {
    mockHook({
      estado: {
        tipo: 'erro_request',
        mensagem: 'Formato de arquivo não suportado.',
      },
    })
  })

  it('exibe toast de erro com mensagem', () => {
    render(<BemImportPage />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Formato de arquivo não suportado.')).toBeInTheDocument()
  })

  it('não exibe tabela de erros', () => {
    render(<BemImportPage />)
    expect(screen.queryByText('Foram identificados erros na planilha')).not.toBeInTheDocument()
  })

  it('exibe botão Anexar Documento (card normal)', () => {
    render(<BemImportPage />)
    expect(screen.getByText('Anexar Documento')).toBeInTheDocument()
  })
})

describe('BemImportPage — bloqueio por Conciliação em aberto', () => {
  beforeEach(() => {
    mockHook({
      estado: {
        tipo: 'erro_request',
        mensagem: 'Importação não realizada: existe Conciliação em aberto.',
      },
    })
  })

  it('exibe toast "Importação não realizada" com a mensagem de conciliação em aberto', () => {
    render(<BemImportPage />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Importação não realizada')).toBeInTheDocument()
    expect(
      screen.getByText('Importação não realizada: existe Conciliação em aberto.')
    ).toBeInTheDocument()
  })

  it('não exibe tabela de erros nem processa nenhuma linha da planilha', () => {
    render(<BemImportPage />)
    expect(screen.queryByText('Foram identificados erros na planilha')).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// bem.service — importar (testes adicionais de cobertura)
// ---------------------------------------------------------------------------

describe('bem.service.importar — cobertura adicional', async () => {
  const { bemService } = await import('../../services/bem.service')
  const { api } = await import('@/api/http')
  const MockAdapter = (await import('axios-mock-adapter')).default
  const mock = new MockAdapter(api)

  beforeEach(() => mock.reset())

  it('201 → retorna status e data corretamente', async () => {
    const payload = { detail: 'OK', importados: 5, ignorados_com_erro: 0, total_linhas: 5 }
    mock.onPost('/bens/importar/').reply(201, payload)

    const file = new File(['x'], 'planilha.xlsx')
    const result = await bemService.importar(file)

    expect(result.status).toBe(201)
    expect(result.data).toEqual(payload)
  })

  it('422 → retorna status e data sem lançar exceção', async () => {
    const payload = { detail: 'Nenhum.', importados: 0, ignorados_com_erro: 5, total_linhas: 5 }
    mock.onPost('/bens/importar/').reply(422, payload)

    const file = new File(['x'], 'planilha.xlsx')
    const result = await bemService.importar(file)

    expect(result.status).toBe(422)
  })

  it('403 → retorna status 403 sem lançar exceção', async () => {
    mock.onPost('/bens/importar/').reply(403, { detail: 'Sem UA.' })

    const file = new File(['x'], 'planilha.xlsx')
    const result = await bemService.importar(file)

    expect(result.status).toBe(403)
  })

  it('400 → retorna status 400 sem lançar exceção', async () => {
    mock.onPost('/bens/importar/').reply(400, { detail: 'Arquivo inválido.' })

    const file = new File(['x'], 'planilha.xlsx')
    const result = await bemService.importar(file)

    expect(result.status).toBe(400)
  })

  it('envia o arquivo no campo "arquivo" via FormData', async () => {
    mock.onPost('/bens/importar/').reply((config) => {
      expect(config.data).toBeInstanceOf(FormData)
      return [201, { detail: 'OK', importados: 1, ignorados_com_erro: 0, total_linhas: 1 }]
    })

    const file = new File(['x'], 'planilha.xlsx')
    await bemService.importar(file)
  })

  it('erro de rede → lança "Erro de conexão com o servidor."', async () => {
    const { AxiosError } = await import('axios')
    vi.spyOn(api, 'post').mockRejectedValueOnce(new AxiosError('Network Error'))

    const file = new File(['x'], 'planilha.xlsx')
    await expect(bemService.importar(file)).rejects.toThrow('Erro de conexão com o servidor.')
  })

  it('500 → lança "Erro ao importar bens"', async () => {
    const { AxiosError } = await import('axios')
    vi.spyOn(api, 'post').mockRejectedValueOnce(
      new AxiosError('Internal Server Error', '500', undefined, undefined, {
        data: {},
        status: 500,
        statusText: 'Internal Server Error',
        headers: {},
        config: {} as any,
      } as any)
    )

    const file = new File(['x'], 'planilha.xlsx')
    await expect(bemService.importar(file)).rejects.toThrow('Erro ao importar bens')
  })
})

// ---------------------------------------------------------------------------
// baixarTemplate
// ---------------------------------------------------------------------------

describe('BemImportPage — baixarTemplate', () => {
  beforeEach(() => mockHook())

  it('cria elemento <a> com href e download corretos ao clicar no link do modelo', () => {
    const anchorMock = { href: '', download: '', click: vi.fn(), remove: vi.fn() }

    // Captura via prototype — imune a spies anteriores no document
    const originalCreateElement = Document.prototype.createElement.bind(document)

    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tag: string) =>
        tag === 'a' ? (anchorMock as unknown as HTMLAnchorElement) : originalCreateElement(tag)
      )

    // render ANTES de mockar appendChild
    render(<BemImportPage />)

    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => anchorMock as any)

    fireEvent.click(screen.getByText('[clique aqui para baixar o modelo]'))

    expect(anchorMock.download).toBe('template_importacao_bens.xlsx')
    expect(anchorMock.href).toContain('/assets/template_importacao_bens.xlsx')
    expect(anchorMock.click).toHaveBeenCalledOnce()
    expect(appendChildSpy).toHaveBeenCalledWith(anchorMock)
    expect(anchorMock.remove).toHaveBeenCalledOnce()

    createElementSpy.mockRestore()
    appendChildSpy.mockRestore()
  })

  it('o clique no link do modelo não navega para outra página', () => {
    const anchorMock = { href: '', download: '', click: vi.fn(), remove: vi.fn() }

    const originalCreateElement = Document.prototype.createElement.bind(document)

    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tag: string) =>
        tag === 'a' ? (anchorMock as unknown as HTMLAnchorElement) : originalCreateElement(tag)
      )

    // render ANTES de mockar appendChild
    render(<BemImportPage />)

    vi.spyOn(document.body, 'appendChild').mockImplementation(() => anchorMock as any)

    expect(() =>
      fireEvent.click(screen.getByText('[clique aqui para baixar o modelo]'))
    ).not.toThrow()

    createElementSpy.mockRestore()
  })
})