import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBemImport } from '../useBemImport'
import { bemService } from '../../services/bem.service'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockNavigate = vi.fn()

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('../../services/bem.service', () => ({
  bemService: {
    importar: vi.fn(),
  },
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Suite principal
// ---------------------------------------------------------------------------

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

    // Simula um input com value preenchido
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

    // Avança o setTimeout de 50ms
    act(() => vi.advanceTimersByTime(50))
    expect(fakeInput.click).toHaveBeenCalledOnce()
  })

  it('novoUpload não quebra se inputRef.current for null', () => {
    const { result } = renderHook(() => useBemImport())

    // inputRef.current é null por padrão no renderHook
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
  // importar: 207 parcial — com erros_por_linha e erros_campos
  // =========================================================================

  it('importar 207 → estado erro_parcial com erros parseados de erros_por_linha', async () => {
    vi.mocked(bemService.importar).mockResolvedValueOnce({
      status: 207,
      data: makeResultado({
        importados: 3,
        ignorados_com_erro: 2,
        erros_por_linha: [
          'Linha 4 | Número Patrimonial: 001.000000001-0 | Erro: Número patrimonial já cadastrado no sistema.',
          'Linha 7 | Número Patrimonial: - | Erro: Duplicado no arquivo.',
        ],
      }),
    })

    const { result } = renderHook(() => useBemImport())
    act(() => result.current.selecionarArquivo(makeFile()))
    await act(async () => { await result.current.importar() })

    expect(result.current.estado.tipo).toBe('erro_parcial')
    if (result.current.estado.tipo === 'erro_parcial') {
      expect(result.current.estado.erros).toHaveLength(2)
      expect(result.current.estado.erros[0].linha).toBe(4)
      expect(result.current.estado.erros[0].numero_patrimonial).toBe('001.000000001-0')
      expect(result.current.estado.erros[0].tipo_erro).toBe('Número patrimonial já cadastrado no sistema.')
      expect(result.current.estado.erros[1].linha).toBe(7)
      expect(result.current.estado.erros[1].numero_patrimonial).toBe('-')
    }
  })

  it('importar 207 → erros de erros_campos também são parseados', async () => {
    vi.mocked(bemService.importar).mockResolvedValueOnce({
      status: 207,
      data: makeResultado({
        importados: 1,
        ignorados_com_erro: 1,
        erros_campos: [
          { linha: 2, erros: { nome: ['Este campo é obrigatório.'], marca: ['Campo inválido.'] } },
        ],
      }),
    })

    const { result } = renderHook(() => useBemImport())
    act(() => result.current.selecionarArquivo(makeFile()))
    await act(async () => { await result.current.importar() })

    expect(result.current.estado.tipo).toBe('erro_parcial')
    if (result.current.estado.tipo === 'erro_parcial') {
      expect(result.current.estado.erros).toHaveLength(2)
      expect(result.current.estado.erros[0].linha).toBe(2)
      expect(result.current.estado.erros[0].numero_patrimonial).toBe('-')
      expect(result.current.estado.erros[0].tipo_erro).toBe('nome: Este campo é obrigatório.')
      expect(result.current.estado.erros[1].tipo_erro).toBe('marca: Campo inválido.')
    }
  })

  it('importar 207 → erros_por_linha e erros_campos são combinados', async () => {
    vi.mocked(bemService.importar).mockResolvedValueOnce({
      status: 207,
      data: makeResultado({
        importados: 1,
        ignorados_com_erro: 2,
        erros_por_linha: ['Linha 1 | Número Patrimonial: 001.000000001-0 | Erro: Duplicado.'],
        erros_campos: [{ linha: 3, erros: { nome: ['Obrigatório.'] } }],
      }),
    })

    const { result } = renderHook(() => useBemImport())
    act(() => result.current.selecionarArquivo(makeFile()))
    await act(async () => { await result.current.importar() })

    expect(result.current.estado.tipo).toBe('erro_parcial')
    if (result.current.estado.tipo === 'erro_parcial') {
      expect(result.current.estado.erros).toHaveLength(2)
    }
  })

  // =========================================================================
  // importar: 422 tudo com erro
  // =========================================================================

  it('importar 422 → estado erro_total com erros parseados', async () => {
    vi.mocked(bemService.importar).mockResolvedValueOnce({
      status: 422,
      data: makeResultado({
        importados: 0,
        ignorados_com_erro: 5,
        detail: 'Nenhum bem foi importado.',
        erros_por_linha: [
          'Linha 1 | Número Patrimonial: AAA | Erro: Já cadastrado.',
          'Linha 2 | Número Patrimonial: BBB | Erro: Duplicado no arquivo.',
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
    }
  })

  it('importar 422 → erros_campos também são incluídos', async () => {
    vi.mocked(bemService.importar).mockResolvedValueOnce({
      status: 422,
      data: makeResultado({
        importados: 0,
        erros_campos: [{ linha: 1, erros: { nome: ['Obrigatório.'] } }],
      }),
    })

    const { result } = renderHook(() => useBemImport())
    act(() => result.current.selecionarArquivo(makeFile()))
    await act(async () => { await result.current.importar() })

    expect(result.current.estado.tipo).toBe('erro_total')
    if (result.current.estado.tipo === 'erro_total') {
      expect(result.current.estado.erros).toHaveLength(1)
      expect(result.current.estado.erros[0].tipo_erro).toBe('nome: Obrigatório.')
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

  it('importar status desconhecido → erro_request com detail ou fallback', async () => {
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

  it('importar status desconhecido sem detail → "Erro desconhecido."', async () => {
    vi.mocked(bemService.importar).mockResolvedValueOnce({
      status: 409,
      data: { detail: undefined } as any,
    })

    const { result } = renderHook(() => useBemImport())
    act(() => result.current.selecionarArquivo(makeFile()))
    await act(async () => { await result.current.importar() })

    expect(result.current.estado.tipo).toBe('erro_request')
    if (result.current.estado.tipo === 'erro_request') {
      expect(result.current.estado.mensagem).toBe('Erro desconhecido.')
    }
  })

  // =========================================================================
  // importar: exceção (erro de rede / servidor)
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
  // parseErrosPorLinha — via estado do hook (linha número inválido → 0)
  // =========================================================================

  it('linha com número inválido na string de erro → linha = 0', async () => {
    vi.mocked(bemService.importar).mockResolvedValueOnce({
      status: 422,
      data: makeResultado({
        erros_por_linha: ['Linha XYZ | Número Patrimonial: 001.000000001-0 | Erro: Teste.'],
      }),
    })

    const { result } = renderHook(() => useBemImport())
    act(() => result.current.selecionarArquivo(makeFile()))
    await act(async () => { await result.current.importar() })

    if (result.current.estado.tipo === 'erro_total') {
      expect(result.current.estado.erros[0].linha).toBe(0)
    }
  })

  it('string de erro sem partes suficientes → tipo_erro usa a string original', async () => {
    vi.mocked(bemService.importar).mockResolvedValueOnce({
      status: 422,
      data: makeResultado({
        erros_por_linha: ['mensagem sem pipe'],
      }),
    })

    const { result } = renderHook(() => useBemImport())
    act(() => result.current.selecionarArquivo(makeFile()))
    await act(async () => { await result.current.importar() })

    if (result.current.estado.tipo === 'erro_total') {
      expect(result.current.estado.erros[0].tipo_erro).toBe('mensagem sem pipe')
    }
  })
})