import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useParametroConciliacaoAnualById,
  useParametroConciliacaoAnualDelete,
  useParametroConciliacaoAnualUpdate,
  useParametrosConciliacaoAnualList,
} from './useParametrosConciliacaoAnual';
import { parametrosConciliacaoAnualService } from '../services/parametros-conciliacao-anual.service';

vi.mock('../services/parametros-conciliacao-anual.service', () => ({
  parametrosConciliacaoAnualService: {
    list: vi.fn(),
    retrieve: vi.fn(),
    update: vi.fn(),
    destroy: vi.fn(),
  },
}));

const mockedService = vi.mocked(parametrosConciliacaoAnualService);

const parametro = {
  id: 1,
  unidade_orcamentaria: 9,
  unidade_orcamentaria_codigo: '01.16.10',
  unidade_orcamentaria_nome: 'SECRETARIA MUNICIPAL DE EDUCACAO',
  unidade_orcamentaria_sigla: 'SME',
  ano_referencia: 2026,
  periodo_inicial: '2026-04-01',
  periodo_final: '2026-04-30',
  ativo: true,
  esta_vigente: true,
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: Readonly<{ children: ReactNode }>) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useParametrosConciliacaoAnual', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    mockedService.list.mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [parametro],
    });
    mockedService.retrieve.mockResolvedValue(parametro);
    mockedService.update.mockResolvedValue({ ...parametro, ativo: false });
    mockedService.destroy.mockResolvedValue(undefined);
  });

  it('lista parametros e reinicia pagina ao alterar filtros', async () => {
    const { result } = renderHook(() => useParametrosConciliacaoAnualList({ pageSize: 10 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.parametros).toEqual([parametro]));

    act(() => {
      result.current.setPage(3);
      result.current.setAnoInput('2026');
      result.current.setStatusFilter('true');
    });

    await waitFor(() => {
      expect(result.current.page).toBe(1);
      expect(mockedService.list).toHaveBeenLastCalledWith({
        page: 1,
        pageSize: 10,
        anoReferencia: '2026',
        ativo: 'true',
        ordering: '-ano_referencia',
      });
    });
  });

  it('busca detalhe somente quando houver id', async () => {
    const { result, rerender } = renderHook(
      ({ id }) => useParametroConciliacaoAnualById(id),
      {
        initialProps: { id: null as number | null },
        wrapper: createWrapper(),
      },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedService.retrieve).not.toHaveBeenCalled();

    rerender({ id: 1 });

    await waitFor(() => expect(result.current.data).toEqual(parametro));
    expect(mockedService.retrieve).toHaveBeenCalledWith(1);
  });

  it('atualiza e exclui parametros pelas mutations', async () => {
    const { result: updateResult } = renderHook(() => useParametroConciliacaoAnualUpdate(), {
      wrapper: createWrapper(),
    });
    const { result: deleteResult } = renderHook(() => useParametroConciliacaoAnualDelete(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await updateResult.current.mutateAsync({ id: 1, payload: { ativo: false } });
      await deleteResult.current.mutateAsync(1);
    });

    expect(mockedService.update).toHaveBeenCalledWith(1, { ativo: false });
    expect(mockedService.destroy).toHaveBeenCalledWith(1);
  });
});
