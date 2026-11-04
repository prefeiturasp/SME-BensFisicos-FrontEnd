import { renderHook } from "@testing-library/react"
import { describe, it, expect } from "vitest"

import { usePagination } from "../usePagination"

describe("usePagination", () => {

  it("calcula totalPages corretamente", () => {
    const { result } = renderHook(() =>
      usePagination({
        page: 1,
        totalItems: 25,
        pageSize: 10,
      })
    )

    expect(result.current.totalPages).toBe(3)
  })

  it("garante pelo menos 1 página", () => {
    const { result } = renderHook(() =>
      usePagination({
        page: 1,
        totalItems: 0,
        pageSize: 10,
      })
    )

    expect(result.current.totalPages).toBe(1)
  })

  it("retorna todas as páginas quando totalPages <= 7", () => {
    const { result } = renderHook(() =>
      usePagination({
        page: 3,
        totalItems: 60,
        pageSize: 10,
      })
    )

    expect(result.current.pages).toEqual([
      { type: "page", value: 1 },
      { type: "page", value: 2 },
      { type: "page", value: 3 },
      { type: "page", value: 4 },
      { type: "page", value: 5 },
      { type: "page", value: 6 },
    ])
  })

  it("mostra ellipsis no início quando página é maior que 4", () => {
    const { result } = renderHook(() =>
      usePagination({
        page: 5,
        totalItems: 200,
        pageSize: 10,
      })
    )

    expect(result.current.pages).toContainEqual({
      type: "ellipsis",
      id: "start",
    })
  })

  it("mostra ellipsis no final quando página está longe do fim", () => {
    const { result } = renderHook(() =>
      usePagination({
        page: 3,
        totalItems: 200,
        pageSize: 10,
      })
    )

    expect(result.current.pages).toContainEqual({
      type: "ellipsis",
      id: "end",
    })
  })

  it("sempre inclui primeira e última página", () => {
    const { result } = renderHook(() =>
      usePagination({
        page: 10,
        totalItems: 200,
        pageSize: 10,
      })
    )

    const pages = result.current.pages

    expect(pages[0]).toEqual({ type: "page", value: 1 })
    expect(pages[pages.length - 1]).toEqual({
      type: "page",
      value: result.current.totalPages,
    })
  })

  it("mostra páginas ao redor da página atual", () => {
    const { result } = renderHook(() =>
      usePagination({
        page: 10,
        totalItems: 200,
        pageSize: 10,
      })
    )

    expect(result.current.pages).toContainEqual({ type: "page", value: 9 })
    expect(result.current.pages).toContainEqual({ type: "page", value: 10 })
    expect(result.current.pages).toContainEqual({ type: "page", value: 11 })
  })

})