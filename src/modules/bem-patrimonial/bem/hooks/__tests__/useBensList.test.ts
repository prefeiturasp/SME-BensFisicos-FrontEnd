import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useBensList } from '../useBensList'
import { bemService } from '../../services/bem.service'

vi.mock('../../services/bem.service', () => ({
  bemService: {
    list: vi.fn(),
    aprovar: vi.fn().mockResolvedValue(undefined),
    reprovar: vi.fn().mockResolvedValue(undefined),
  },
}))

describe('useBensList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve buscar bens ao montar', async () => {
    ;(bemService.list as any).mockResolvedValue({
      results: [],
      count: 0,
    })

    const { result } = renderHook(() =>
      useBensList({ page: 1, pageSize: 10 })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(bemService.list).toHaveBeenCalled()
  })

  it('deve alternar seleção quando status permitido', () => {
    const { result } = renderHook(() =>
      useBensList({ page: 1, pageSize: 10 })
    )

    const bem = {
      id: 1,
      status: 'aguardando_aprovacao',
    } as any

    act(() => {
        result.current.toggleSelect(bem)
    })
    expect(result.current.selectedIds).toContain(1)
  })

  it('não deve selecionar se status inválido', () => {
    const { result } = renderHook(() =>
      useBensList({ page: 1, pageSize: 10 })
    )

    const bem = {
      id: 1,
      status: 'aprovado',
    } as any
    act(() => {
        result.current.toggleSelect(bem)
    })
    expect(result.current.selectedIds).toHaveLength(0)
  })

  it('deve chamar aprovar quando houver selecionados', async () => {
  const { result } = renderHook(() =>
    useBensList({ page: 1, pageSize: 10 })
  )

  await waitFor(() => {
    expect(result.current.loading).toBe(false)
  })

  act(() => {
    result.current.toggleSelect({
      id: 1,
      status: 'aguardando_aprovacao',
    } as any)
  })

  await act(async () => {
    await result.current.atualizarStatusSelecionados('aprovar')
  })

  expect(bemService.aprovar).toHaveBeenCalledTimes(1)
})
})