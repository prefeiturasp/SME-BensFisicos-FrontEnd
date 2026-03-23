import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { usePagination } from '../usePagination';

describe('usePagination', () => {
  it('garante no mínimo uma página quando total de itens é zero', () => {
    const { result } = renderHook(() =>
      usePagination({
        page: 1,
        totalItems: 0,
        pageSize: 10,
      }),
    );

    expect(result.current.totalPages).toBe(1);
    expect(result.current.pages).toEqual([{ type: 'page', value: 1, id: 'page-1' }]);
  });

  it('retorna sequência completa quando totalPages <= 7', () => {
    const { result } = renderHook(() =>
      usePagination({
        page: 1,
        totalItems: 50,
        pageSize: 10,
      }),
    );

    expect(result.current.totalPages).toBe(5);
    expect(result.current.pages).toEqual([
      { type: 'page', value: 1, id: 'page-1' },
      { type: 'page', value: 2, id: 'page-2' },
      { type: 'page', value: 3, id: 'page-3' },
      { type: 'page', value: 4, id: 'page-4' },
      { type: 'page', value: 5, id: 'page-5' },
    ]);
  });

  it('retorna reticências no início e fim quando página está no meio', () => {
    const { result } = renderHook(() =>
      usePagination({
        page: 10,
        totalItems: 200,
        pageSize: 10,
      }),
    );

    expect(result.current.totalPages).toBe(20);
    expect(result.current.pages).toEqual([
      { type: 'page', value: 1, id: 'page-1' },
      { type: 'ellipsis', id: 'start' },
      { type: 'page', value: 9, id: 'page-9' },
      { type: 'page', value: 10, id: 'page-10' },
      { type: 'page', value: 11, id: 'page-11' },
      { type: 'ellipsis', id: 'end' },
      { type: 'page', value: 20, id: 'page-20' },
    ]);
  });

  it('não mostra reticências no início quando página está no começo', () => {
    const { result } = renderHook(() =>
      usePagination({
        page: 2,
        totalItems: 200,
        pageSize: 10,
      }),
    );

    expect(result.current.pages).toEqual([
      { type: 'page', value: 1, id: 'page-1' },
      { type: 'page', value: 2, id: 'page-2' },
      { type: 'page', value: 3, id: 'page-3' },
      { type: 'ellipsis', id: 'end' },
      { type: 'page', value: 20, id: 'page-20' },
    ]);
  });

  it('não mostra reticências no fim quando página está no final', () => {
    const { result } = renderHook(() =>
      usePagination({
        page: 19,
        totalItems: 200,
        pageSize: 10,
      }),
    );

    expect(result.current.pages).toEqual([
      { type: 'page', value: 1, id: 'page-1' },
      { type: 'ellipsis', id: 'start' },
      { type: 'page', value: 18, id: 'page-18' },
      { type: 'page', value: 19, id: 'page-19' },
      { type: 'page', value: 20, id: 'page-20' },
    ]);
  });
});