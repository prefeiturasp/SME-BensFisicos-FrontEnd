import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePagination } from '../usePagination'

describe('usePagination', () => {
  it('retorna páginas simples quando <= 7', () => {
    const { result } = renderHook(() =>
      usePagination({
        page: 1,
        totalItems: 50,
        pageSize: 10,
      })
    )

    expect(result.current.pages).toEqual([1, 2, 3, 4, 5])
  })

  it('retorna páginas com ... quando > 7', () => {
    const { result } = renderHook(() =>
      usePagination({
        page: 5,
        totalItems: 200,
        pageSize: 10,
      })
    )

    expect(result.current.pages).toContain('...')
  })

  it('nunca retorna menos que 1 página', () => {
    const { result } = renderHook(() =>
      usePagination({
        page: 1,
        totalItems: 0,
        pageSize: 10,
      })
    )

    expect(result.current.totalPages).toBe(1)
  })
})