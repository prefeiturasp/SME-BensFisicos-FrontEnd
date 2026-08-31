import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useBensList } from '../useBensList'
import { bemService } from '../../services/bem.service'

vi.mock('../../services/bem.service', () => ({
  bemService: {
    list: vi.fn(),
    aprovar: vi.fn(),
    reprovar: vi.fn(),
  },
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

import { toast } from 'sonner'

const listMock = vi.mocked(bemService.list)
const aprovarMock = vi.mocked(bemService.aprovar)
const reprovarMock = vi.mocked(bemService.reprovar)
const toastSuccessMock = vi.mocked(toast.success)
const toastErrorMock = vi.mocked(toast.error)

const EMPTY_RESPONSE = { results: [], count: 0 }

function buildBem(overrides: Partial<{ id: number; status: string }> = {}) {
  return {
    id: 1,
    status: 'aguardando_aprovacao',
    ...overrides,
  } as any
}

describe('useBensList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    listMock.mockResolvedValue(EMPTY_RESPONSE)
    aprovarMock.mockResolvedValue(undefined)
    reprovarMock.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ── busca inicial ──────────────────────────────────────────────────────

  it('busca bens ao montar', async () => {
    const { result } = renderHook(() => useBensList({ pageSize: 10 }))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(listMock).toHaveBeenCalledTimes(1)
    expect(result.current.bens).toEqual([])
    expect(result.current.count).toBe(0)
  })

  it('preenche bens e count com o resultado da API', async () => {
    const bem = buildBem()
    listMock.mockResolvedValueOnce({ results: [bem], count: 1 })

    const { result } = renderHook(() => useBensList({ pageSize: 10 }))

    await waitFor(() => {
      expect(result.current.bens).toEqual([bem])
    })

    expect(result.current.count).toBe(1)
  })

  it('envia status undefined quando statusFilter é "todos" (valor padrão)', async () => {
    renderHook(() => useBensList({ pageSize: 10 }))

    await waitFor(() => {
      expect(listMock).toHaveBeenCalledWith(
        expect.objectContaining({ status: undefined }),
      )
    })
  })

  it('envia o status selecionado quando diferente de "todos"', async () => {
    const { result } = renderHook(() => useBensList({ pageSize: 10 }))

    await waitFor(() => expect(result.current.loading).toBe(false))
    listMock.mockClear()

    act(() => {
      result.current.setStatusFilter('aprovado')
    })

    await waitFor(() => {
      expect(listMock).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'aprovado' }),
      )
    })
  })

  it('exibe toast de erro quando a busca falha', async () => {
    listMock.mockReset()
    listMock.mockRejectedValueOnce(new Error('falha'))

    const { result } = renderHook(() => useBensList({ pageSize: 10 }))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(toastErrorMock).toHaveBeenCalledWith('Erro ao listar bens')
  })

  // ── busca com debounce ─────────────────────────────────────────────────

  it('aplica debounce na busca textual e reseta a página', async () => {
    vi.useFakeTimers()

    const { result } = renderHook(() => useBensList({ pageSize: 10 }))

    act(() => {
      result.current.setPage(3)
    })

    act(() => {
      result.current.setSearchInput('patrimonio')
    })

    // Antes do debounce expirar, a busca ainda não deve ter sido enviada.
    expect(listMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ search: 'patrimonio' }),
    )

    await act(async () => {
      vi.advanceTimersByTime(400)
    })

    expect(listMock).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'patrimonio', page: 1 }),
    )
  })

  it('debounce reinicia quando o texto muda antes de completar o tempo', async () => {
    vi.useFakeTimers()

    const { result } = renderHook(() => useBensList({ pageSize: 10 }))

    act(() => {
      result.current.setSearchInput('pat')
    })

    await act(async () => {
      vi.advanceTimersByTime(200)
    })

    act(() => {
      result.current.setSearchInput('patrimonio')
    })

    await act(async () => {
      vi.advanceTimersByTime(200)
    })

    // Ainda não completou os 400ms desde a última alteração.
    expect(listMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ search: 'patrimonio' }),
    )

    await act(async () => {
      vi.advanceTimersByTime(200)
    })

    expect(listMock).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'patrimonio' }),
    )
  })

  // ── mapeamento de filtros ──────────────────────────────────────────────

  it('mapeia uma única UA selecionada para unidade_administrativa (array)', async () => {
    const { result } = renderHook(() => useBensList({ pageSize: 10 }))

    await waitFor(() => expect(result.current.loading).toBe(false))
    listMock.mockClear()

    act(() => {
      result.current.setUnidadesAdministrativas(['42'])
    })

    await waitFor(() => {
      expect(listMock).toHaveBeenCalledWith(
        expect.objectContaining({
          unidade_administrativa: ['42'],
        }),
      )
    })
  })

  it('mapeia múltiplas UAs selecionadas para unidade_administrativa', async () => {
    const { result } = renderHook(() => useBensList({ pageSize: 10 }))

    await waitFor(() => expect(result.current.loading).toBe(false))
    listMock.mockClear()

    act(() => {
      result.current.setUnidadesAdministrativas(['42', '7'])
    })

    await waitFor(() => {
      expect(listMock).toHaveBeenCalledWith(
        expect.objectContaining({
          unidade_administrativa: ['42', '7'],
        }),
      )
    })
  })

  it('não envia unidade_administrativa quando nenhuma UA está selecionada (Todas as UAs)', async () => {
    renderHook(() => useBensList({ pageSize: 10 }))

    await waitFor(() => {
      expect(listMock).toHaveBeenCalledWith(
        expect.objectContaining({
          unidade_administrativa: undefined,
        }),
      )
    })
  })

  it('consolida em unidade_orcamentaria quando todas as UAs da UO estão marcadas', async () => {
    const grupos = [
      {
        uo: { id: 1 },
        uas: [
          { unidade_administrativa_id: 100 },
          { unidade_administrativa_id: 101 },
        ],
      },
    ]
    const { result } = renderHook(() =>
      useBensList({ pageSize: 10, grupos }),
    )

    await waitFor(() => expect(result.current.loading).toBe(false))
    listMock.mockClear()

    act(() => {
      result.current.setUnidadesAdministrativas(['100', '101'])
    })

    await waitFor(() => {
      expect(listMock).toHaveBeenCalledWith(
        expect.objectContaining({
          unidade_orcamentaria: ['1'],
          unidade_administrativa: undefined,
        }),
      )
    })
  })

  it('envia UO consolidada e mantém UA avulsa quando a UO está parcialmente marcada', async () => {
    const grupos = [
      {
        uo: { id: 1 },
        uas: [
          { unidade_administrativa_id: 100 },
          { unidade_administrativa_id: 101 },
        ],
      },
      {
        uo: { id: 2 },
        uas: [{ unidade_administrativa_id: 200 }],
      },
    ]
    const { result } = renderHook(() =>
      useBensList({ pageSize: 10, grupos }),
    )

    await waitFor(() => expect(result.current.loading).toBe(false))
    listMock.mockClear()

    // UO 1 inteira + apenas uma UA da UO 2 (que só tem uma, então também vira UO)
    act(() => {
      result.current.setUnidadesAdministrativas(['100', '200'])
    })

    await waitFor(() => {
      const call = listMock.mock.calls.at(-1)?.[0]
      expect(call).toBeDefined()
      // UA 100 não cobre a UO 1 inteira -> vai avulsa; UA 200 cobre a UO 2 -> vira UO
      expect(call!.unidade_administrativa).toEqual(['100'])
      expect(call!.unidade_orcamentaria).toEqual(['2'])
    })
  })

  it('envia buscaGeralUos como undefined quando desmarcado e true quando marcado', async () => {
    const { result } = renderHook(() => useBensList({ pageSize: 10 }))

    await waitFor(() => {
      expect(listMock).toHaveBeenCalledWith(
        expect.objectContaining({ busca_geral_uos: undefined }),
      )
    })

    listMock.mockClear()

    act(() => {
      result.current.setBuscaGeralUos(true)
    })

    await waitFor(() => {
      expect(listMock).toHaveBeenCalledWith(
        expect.objectContaining({ busca_geral_uos: true }),
      )
    })
  })

  it('envia bens_baixados como undefined quando desmarcado e true quando marcado', async () => {
    const { result } = renderHook(() => useBensList({ pageSize: 10 }))

    await waitFor(() => {
      expect(listMock).toHaveBeenCalledWith(
        expect.objectContaining({ bens_baixados: undefined }),
      )
    })

    listMock.mockClear()

    act(() => {
      result.current.setBensBaixados(true)
    })

    await waitFor(() => {
      expect(listMock).toHaveBeenCalledWith(
        expect.objectContaining({ bens_baixados: true }),
      )
    })
  })

  it('envia o ordering informado', async () => {
    const { result } = renderHook(() => useBensList({ pageSize: 10 }))

    await waitFor(() => expect(result.current.loading).toBe(false))
    listMock.mockClear()

    act(() => {
      result.current.setOrdering('nome')
    })

    await waitFor(() => {
      expect(listMock).toHaveBeenCalledWith(
        expect.objectContaining({ ordering: 'nome' }),
      )
    })
  })

  // ── persistência via localStorage ──────────────────────────────────────

  it('sem persistKey, os filtros especiais iniciam desmarcados e nada é persistido', () => {
    const { result } = renderHook(() => useBensList({ pageSize: 10 }))

    expect(result.current.bensBaixados).toBe(false)
    expect(result.current.buscaGeralUos).toBe(false)

    act(() => {
      result.current.setBensBaixados(true)
    })

    expect(localStorage.getItem('undefined:bensBaixados')).toBeNull()
  })

  it('com persistKey, lê o estado inicial salvo no localStorage', () => {
    localStorage.setItem('bens-list:bensBaixados', 'true')
    localStorage.setItem('bens-list:buscaGeralUos', 'true')

    const { result } = renderHook(() =>
      useBensList({ pageSize: 10, persistKey: 'bens-list' }),
    )

    expect(result.current.bensBaixados).toBe(true)
    expect(result.current.buscaGeralUos).toBe(true)
  })

  it('com persistKey, persiste alterações dos filtros especiais', async () => {
    const { result } = renderHook(() =>
      useBensList({ pageSize: 10, persistKey: 'bens-list' }),
    )

    act(() => {
      result.current.setBensBaixados(true)
    })

    await waitFor(() => {
      expect(localStorage.getItem('bens-list:bensBaixados')).toBe('true')
    })

    act(() => {
      result.current.setBuscaGeralUos(true)
    })

    await waitFor(() => {
      expect(localStorage.getItem('bens-list:buscaGeralUos')).toBe('true')
    })
  })

  // ── seleção de itens ────────────────────────────────────────────────────

  it('alterna seleção quando o status é "aguardando_aprovacao"', () => {
    const { result } = renderHook(() => useBensList({ pageSize: 10 }))

    act(() => {
      result.current.toggleSelect(buildBem({ id: 1 }))
    })
    expect(result.current.selectedIds).toEqual([1])

    act(() => {
      result.current.toggleSelect(buildBem({ id: 1 }))
    })
    expect(result.current.selectedIds).toEqual([])
  })

  it('não seleciona quando o status é diferente de "aguardando_aprovacao"', () => {
    const { result } = renderHook(() => useBensList({ pageSize: 10 }))

    act(() => {
      result.current.toggleSelect(buildBem({ id: 1, status: 'aprovado' }))
    })

    expect(result.current.selectedIds).toHaveLength(0)
  })

  it('permite selecionar múltiplos bens simultaneamente', () => {
    const { result } = renderHook(() => useBensList({ pageSize: 10 }))

    act(() => {
      result.current.toggleSelect(buildBem({ id: 1 }))
      result.current.toggleSelect(buildBem({ id: 2 }))
    })

    expect(result.current.selectedIds).toEqual([1, 2])
  })

  // ── atualizarStatusSelecionados ─────────────────────────────────────────

  it('não chama a API quando não há itens selecionados', async () => {
    const { result } = renderHook(() => useBensList({ pageSize: 10 }))

    await act(async () => {
      await result.current.atualizarStatusSelecionados(
        'aprovar',
        'Aprovado com sucesso',
        'Erro ao aprovar',
      )
    })

    expect(aprovarMock).not.toHaveBeenCalled()
    expect(toastSuccessMock).not.toHaveBeenCalled()
  })

  it('aprova os itens selecionados, exibe toast de sucesso, limpa seleção e recarrega a lista', async () => {
    const { result } = renderHook(() => useBensList({ pageSize: 10 }))

    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => {
      result.current.toggleSelect(buildBem({ id: 1 }))
      result.current.toggleSelect(buildBem({ id: 2 }))
    })

    listMock.mockClear()

    await act(async () => {
      await result.current.atualizarStatusSelecionados(
        'aprovar',
        'Aprovado com sucesso',
        'Erro ao aprovar',
      )
    })

    expect(aprovarMock).toHaveBeenCalledWith([1, 2])
    expect(toastSuccessMock).toHaveBeenCalledWith('Aprovado com sucesso')
    expect(result.current.selectedIds).toEqual([])
    expect(listMock).toHaveBeenCalledTimes(1)
  })

  it('reprova os itens selecionados chamando o serviço correto', async () => {
    const { result } = renderHook(() => useBensList({ pageSize: 10 }))

    act(() => {
      result.current.toggleSelect(buildBem({ id: 5 }))
    })

    await act(async () => {
      await result.current.atualizarStatusSelecionados(
        'reprovar',
        'Reprovado com sucesso',
        'Erro ao reprovar',
      )
    })

    expect(reprovarMock).toHaveBeenCalledWith([5])
    expect(aprovarMock).not.toHaveBeenCalled()
    expect(toastSuccessMock).toHaveBeenCalledWith('Reprovado com sucesso')
  })

  it('exibe toast de erro e mantém a seleção quando a atualização falha', async () => {
    aprovarMock.mockRejectedValueOnce(new Error('falha'))

    const { result } = renderHook(() => useBensList({ pageSize: 10 }))

    act(() => {
      result.current.toggleSelect(buildBem({ id: 1 }))
    })

    await act(async () => {
      await result.current.atualizarStatusSelecionados(
        'aprovar',
        'Aprovado com sucesso',
        'Erro ao aprovar',
      )
    })

    expect(toastErrorMock).toHaveBeenCalledWith('Erro ao aprovar')
    expect(toastSuccessMock).not.toHaveBeenCalled()
    expect(result.current.selectedIds).toEqual([1])
  })
})