import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBemImport } from '../useBemImport'
import { bemService } from '../../services/bem.service'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('../../services/bem.service', () => ({
  bemService: {
    importar: vi.fn(),
  },
}))

function makeFile(name = 'planilha.xlsx'): File {
  return new File(['conteudo'], name, {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

function makeResultado(overrides = {}) {
  return {
    detail: 'Importação concluída.',
    importados: 5,
    ignorados_com_erro: 0,
    total_linhas: 5,
    ...overrides,
  }
}

function makeErroLinha(overrides = {}) {
  return {
    linha: 1,
    numero_patrimonial: '001.000000001-0',
    campo: 'nome',
    mensagem: 'Este campo é obrigatório.',
    ...overrides,
  }
}

describe('useBemImport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // =========================================================================
  // Estado inicial
  // =========================================================================

  it('inicia no estado idle', () => {
    const { result } = renderHook(() => useBemImport())
    expect(result.current.estado.tipo).toBe('idle')
    expect(result.current.arquivo).toBeNull()
    expect(result.current.importando).toBe(false)
  })

  // =========================================================================
  // selecionarArquivo
  // =========================================================================

  it('selecionarArquivo muda estado para arquivo_selecionado', () => {
    const { result } = renderHook(() => useBemImport())
    const file = makeFile()

    act(() => result.current.selecionarArquivo(file))

    expect(result.current.estado.tipo).toBe('arquivo_selecionado')
    expect(result.current.arquivo).toBe(file)
    expect(result.current.importando).toBe(false)
  })

  // =========================================================================
  // removerArquivo
  // =========================================================================

  it('removerArquivo volta para idle', () => {
    const { result } = renderHook(() => useBemImport())

    act(() => result.current.selecionarArquivo(makeFile()))
    act(() => result.current.removerArquivo())

    expect(result.current.estado.tipo).toBe('idle')
    expect(result.current.arquivo).toBeNull()
  })

  it('removerArquivo limpa o value do inputRef se existir', () => {
    const { result } = renderHook(() => useBemImport())

    const fakeInput = { value: 'arquivo.xlsx', click: vi.fn() } as any
    Object.defineProperty(result.current.inputRef, 'current', {
      writable: true,
      value: fakeInput,
    })

    act(() => result.current.selecionarArquivo(makeFile()))
    act(() => result.current.removerArquivo())

    expect(fakeInput.value).toBe('')
  })

  // =========================================================================
  // novoUpload
  // =========================================================================

  it('novoUpload volta para idle e chama click no input após timeout', () => {
    const { result } = renderHook(() => useBemImport())

    const fakeInput = { value: 'arquivo.xlsx', click: vi.fn() } as any
    Object.defineProperty(result.current.inputRef, 'current', {
      writable: true,
      value: fakeInput,
    })

    act(() => result.current.selecionarArquivo(makeFile()))
    act(() => result.current.novoUpload())

    expect(result.current.estado.tipo).toBe('idle')
    expect(fakeInput.value).toBe('')
    expect(fakeInput.click).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(50))
    expect(fakeInput.click).toHaveBeenCalledOnce()
  })

  it('novoUpload não quebra se inputRef.current for null', () => {
    const { result } = renderHook(() => useBemImport())

    expect(() => {
      act(() => result.current.novoUpload())
      act(() => vi.advanceTimersByTime(50))
    }).not.toThrow()
  })

  // =========================================================================
  // cancelar
  // =========================================================================

  it('cancelar navega para /bens-patrimoniais', () => {
    const { result } = renderHook(() => useBemImport())
    act(() => result.current.cancelar())
    expect(mockNavigate).toHaveBeenCalledWith('/bens-patrimoniais')
  })

  // =========================================================================
  // importar: guard — estado diferente de arquivo_selecionado
  // =========================================================================

  it('importar não faz nada se estado não for arquivo_selecionado', async () => {
    const { result } = renderHook(() => useBemImport())

    await act(async () => { await result.current.importar() })

    expect(bemService.importar).not.toHaveBeenCalled()
    expect(result.current.estado.tipo).toBe('idle')
  })

  // =========================================================================
  // importar: 201 sucesso
  // =========================================================================

  it('importar 201 → estado sucesso', async () => {
    vi.mocked(bemService.importar).mockResolvedValueOnce({
      status: 201,
      data: makeResultado({ importados: 10, detail: '10 bens importados.' }),
    })

    const { result } = renderHook(() => useBemImport())
    act(() => result.current.selecionarArquivo(makeFile()))
    await act(async () => { await result.current.importar() })

    expect(result.current.estado.tipo).toBe('sucesso')
    if (result.current.estado.tipo === 'sucesso') {
      expect(result.current.estado.resultado.importados).toBe(10)
    }
  })

  // =========================================================================
  // importar: 422 tudo com erro — novo formato de erros_por_linha
  // =========================================================================

  it('importar 422 → estado erro_total com erros parseados do novo formato', async () => {
    vi.mocked(bemService.importar).mockResolvedValueOnce({
      status: 422,
      data: makeResultado({
        importados: 0,
        ignorados_com_erro: 2,
        detail: 'Nenhum bem foi importado.',
        erros_por_linha: [
          makeErroLinha({ linha: 1, numero_patrimonial: 'AAA', campo: 'nome', mensagem: 'Obrigatório.' }),
          makeErroLinha({ linha: 2, numero_patrimonial: 'BBB', campo: 'marca', mensagem: 'Inválido.' }),
        ],
      }),
    })

    const { result } = renderHook(() => useBemImport())
    act(() => result.current.selecionarArquivo(makeFile()))
    await act(async () => { await result.current.importar() })

    expect(result.current.estado.tipo).toBe('erro_total')
    if (result.current.estado.tipo === 'erro_total') {
      expect(result.current.estado.detail).toBe('Nenhum bem foi importado.')
      expect(result.current.estado.erros).toHaveLength(2)
      expect(result.current.estado.erros[0].linha).toBe(1)
      expect(result.current.estado.erros[0].numero_patrimonial).toBe('AAA')
      expect(result.current.estado.erros[0].campo).toBe('nome')
      expect(result.current.estado.erros[0].tipo_erro).toBe('nome: Obrigatório.')
      expect(result.current.estado.erros[1].linha).toBe(2)
      expect(result.current.estado.erros[1].numero_patrimonial).toBe('BBB')
      expect(result.current.estado.erros[1].campo).toBe('marca')
      expect(result.current.estado.erros[1].tipo_erro).toBe('marca: Inválido.')
    }
  })

  it('importar 422 → numero_patrimonial ausente usa "-"', async () => {
    vi.mocked(bemService.importar).mockResolvedValueOnce({
      status: 422,
      data: makeResultado({
        erros_por_linha: [
          makeErroLinha({ numero_patrimonial: '', campo: 'nome', mensagem: 'Vazio.' }),
        ],
      }),
    })

    const { result } = renderHook(() => useBemImport())
    act(() => result.current.selecionarArquivo(makeFile()))
    await act(async () => { await result.current.importar() })

    if (result.current.estado.tipo === 'erro_total') {
      expect(result.current.estado.erros[0].numero_patrimonial).toBe('-')
    }
  })

  it('importar 422 → erros_por_linha ausente resulta em array vazio', async () => {
    vi.mocked(bemService.importar).mockResolvedValueOnce({
      status: 422,
      data: makeResultado({ importados: 0, detail: 'Falha total.' }),
    })

    const { result } = renderHook(() => useBemImport())
    act(() => result.current.selecionarArquivo(makeFile()))
    await act(async () => { await result.current.importar() })

    expect(result.current.estado.tipo).toBe('erro_total')
    if (result.current.estado.tipo === 'erro_total') {
      expect(result.current.estado.erros).toHaveLength(0)
    }
  })

  // =========================================================================
  // importar: sem estado erro_parcial — 207 cai no fallback
  // =========================================================================

  it('importar 207 → erro_request (sem importação parcial)', async () => {
    vi.mocked(bemService.importar).mockResolvedValueOnce({
      status: 207,
      data: makeResultado({ detail: 'Parcial inesperado.' }),
    })

    const { result } = renderHook(() => useBemImport())
    act(() => result.current.selecionarArquivo(makeFile()))
    await act(async () => { await result.current.importar() })

    expect(result.current.estado.tipo).toBe('erro_request')
    if (result.current.estado.tipo === 'erro_request') {
      expect(result.current.estado.mensagem).toBe('Parcial inesperado.')
    }
  })

  // =========================================================================
  // importar: 403 sem permissão
  // =========================================================================

  it('importar 403 → erro_request com mensagem do backend', async () => {
    vi.mocked(bemService.importar).mockResolvedValueOnce({
      status: 403,
      data: makeResultado({ detail: 'Usuário sem UA vinculada.' }),
    })

    const { result } = renderHook(() => useBemImport())
    act(() => result.current.selecionarArquivo(makeFile()))
    await act(async () => { await result.current.importar() })

    expect(result.current.estado.tipo).toBe('erro_request')
    if (result.current.estado.tipo === 'erro_request') {
      expect(result.current.estado.mensagem).toBe('Usuário sem UA vinculada.')
    }
  })

  it('importar 403 → fallback quando detail for undefined', async () => {
    vi.mocked(bemService.importar).mockResolvedValueOnce({
      status: 403,
      data: { detail: undefined } as any,
    })

    const { result } = renderHook(() => useBemImport())
    act(() => result.current.selecionarArquivo(makeFile()))
    await act(async () => { await result.current.importar() })

    expect(result.current.estado.tipo).toBe('erro_request')
    if (result.current.estado.tipo === 'erro_request') {
      expect(result.current.estado.mensagem).toBe('Sem permissão para importar.')
    }
  })

  // =========================================================================
  // importar: 400 arquivo inválido
  // =========================================================================

  it('importar 400 com erros.arquivo → junta mensagens', async () => {
    vi.mocked(bemService.importar).mockResolvedValueOnce({
      status: 400,
      data: {
        detail: 'Arquivo inválido.',
        erros: { arquivo: ['Formato não suportado.', 'Use XLSX.'] },
      } as any,
    })

    const { result } = renderHook(() => useBemImport())
    act(() => result.current.selecionarArquivo(makeFile()))
    await act(async () => { await result.current.importar() })

    expect(result.current.estado.tipo).toBe('erro_request')
    if (result.current.estado.tipo === 'erro_request') {
      expect(result.current.estado.mensagem).toBe('Formato não suportado. Use XLSX.')
    }
  })

  it('importar 400 sem erros.arquivo → usa detail', async () => {
    vi.mocked(bemService.importar).mockResolvedValueOnce({
      status: 400,
      data: { detail: 'Arquivo vazio.' } as any,
    })

    const { result } = renderHook(() => useBemImport())
    act(() => result.current.selecionarArquivo(makeFile()))
    await act(async () => { await result.current.importar() })

    expect(result.current.estado.tipo).toBe('erro_request')
    if (result.current.estado.tipo === 'erro_request') {
      expect(result.current.estado.mensagem).toBe('Arquivo vazio.')
    }
  })

  it('importar 400 sem erros.arquivo e sem detail → fallback "Arquivo inválido."', async () => {
    vi.mocked(bemService.importar).mockResolvedValueOnce({
      status: 400,
      data: {} as any,
    })

    const { result } = renderHook(() => useBemImport())
    act(() => result.current.selecionarArquivo(makeFile()))
    await act(async () => { await result.current.importar() })

    expect(result.current.estado.tipo).toBe('erro_request')
    if (result.current.estado.tipo === 'erro_request') {
      expect(result.current.estado.mensagem).toBe('Arquivo inválido.')
    }
  })

  // =========================================================================
  // importar: status desconhecido (ex: 409)
  // =========================================================================

  it('importar status desconhecido → erro_request com detail', async () => {
    vi.mocked(bemService.importar).mockResolvedValueOnce({
      status: 409,
      data: makeResultado({ detail: 'Conflito inesperado.' }),
    })

    const { result } = renderHook(() => useBemImport())
    act(() => result.current.selecionarArquivo(makeFile()))
    await act(async () => { await result.current.importar() })

    expect(result.current.estado.tipo).toBe('erro_request')
    if (result.current.estado.tipo === 'erro_request') {
      expect(result.current.estado.mensagem).toBe('Conflito inesperado.')
    }
  })

  it('importar status desconhecido sem detail → "Erro desconhecido. Nenhum bem foi importado."', async () => {
    vi.mocked(bemService.importar).mockResolvedValueOnce({
      status: 409,
      data: { detail: undefined } as any,
    })

    const { result } = renderHook(() => useBemImport())
    act(() => result.current.selecionarArquivo(makeFile()))
    await act(async () => { await result.current.importar() })

    expect(result.current.estado.tipo).toBe('erro_request')
    if (result.current.estado.tipo === 'erro_request') {
      expect(result.current.estado.mensagem).toBe('Erro desconhecido. Nenhum bem foi importado.')
    }
  })

  // =========================================================================
  // importar: exceção
  // =========================================================================

  it('importar com Error lançado → erro_request com message do erro', async () => {
    vi.mocked(bemService.importar).mockRejectedValueOnce(
      new Error('Erro de conexão com o servidor.')
    )

    const { result } = renderHook(() => useBemImport())
    act(() => result.current.selecionarArquivo(makeFile()))
    await act(async () => { await result.current.importar() })

    expect(result.current.estado.tipo).toBe('erro_request')
    if (result.current.estado.tipo === 'erro_request') {
      expect(result.current.estado.mensagem).toBe('Erro de conexão com o servidor.')
    }
  })

  it('importar com exceção não-Error → mensagem genérica', async () => {
    vi.mocked(bemService.importar).mockRejectedValueOnce('string de erro')

    const { result } = renderHook(() => useBemImport())
    act(() => result.current.selecionarArquivo(makeFile()))
    await act(async () => { await result.current.importar() })

    expect(result.current.estado.tipo).toBe('erro_request')
    if (result.current.estado.tipo === 'erro_request') {
      expect(result.current.estado.mensagem).toBe(
        'Não foi possível conectar ao servidor. Tente novamente.'
      )
    }
  })

  // =========================================================================
  // importar: envia o arquivo correto para bemService
  // =========================================================================

  it('importar chama bemService.importar com o arquivo selecionado', async () => {
    vi.mocked(bemService.importar).mockResolvedValueOnce({
      status: 201,
      data: makeResultado(),
    })

    const file = makeFile('minha_planilha.xlsx')
    const { result } = renderHook(() => useBemImport())
    act(() => result.current.selecionarArquivo(file))
    await act(async () => { await result.current.importar() })

    expect(bemService.importar).toHaveBeenCalledWith(file)
  })

  // =========================================================================
  // parseErrosPorLinha — tipo_erro montado como "campo: mensagem"
  // =========================================================================

  it('tipo_erro é montado como "campo: mensagem"', async () => {
    vi.mocked(bemService.importar).mockResolvedValueOnce({
      status: 422,
      data: makeResultado({
        erros_por_linha: [
          makeErroLinha({ campo: 'numero_patrimonial', mensagem: 'Já cadastrado no sistema.' }),
        ],
      }),
    })

    const { result } = renderHook(() => useBemImport())
    act(() => result.current.selecionarArquivo(makeFile()))
    await act(async () => { await result.current.importar() })

    if (result.current.estado.tipo === 'erro_total') {
      expect(result.current.estado.erros[0].tipo_erro).toBe('numero_patrimonial: Já cadastrado no sistema.')
    }
  })
})