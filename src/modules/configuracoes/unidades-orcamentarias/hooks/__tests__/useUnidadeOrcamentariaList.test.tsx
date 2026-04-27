import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { useUnidadeOrcamentariaList } from '../useUnidadeOrcamentariaList';

const mockList = vi.fn();

vi.mock('../../services/unidades-orcamentarias.service', () => ({
  unidadesOrcamentariasService: {
    list: (...args: unknown[]) => mockList(...args),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('useUnidadeOrcamentariaList', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('carrega com ordenação padrão por código e status todos', async () => {
    mockList.mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [],
    });

    const { result } = renderHook(() => useUnidadeOrcamentariaList({ pageSize: 10 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockList).toHaveBeenCalledWith(
      expect.objectContaining({
        ordering: 'codigo',
        ativa: 'todos',
      }),
    );
  });

  it('atualiza filtro de status e refaz a consulta', async () => {
    mockList.mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [],
    });

    const { result } = renderHook(() => useUnidadeOrcamentariaList({ pageSize: 10 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setStatusFilter('false');
    });

    await waitFor(() => {
      expect(mockList).toHaveBeenCalledWith(
        expect.objectContaining({
          ativa: 'false',
        }),
      );
    });
  });

  it('aplica debounce no filtro de código', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    mockList.mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [],
    });

    const { result } = renderHook(() => useUnidadeOrcamentariaList({ pageSize: 10 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const callsBefore = mockList.mock.calls.length;

    act(() => {
      result.current.setCodigoInput('10.10.10');
    });

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(mockList.mock.calls.length).toBe(callsBefore);

    act(() => {
      vi.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(mockList).toHaveBeenCalledWith(
        expect.objectContaining({
          codigo: '10.10.10',
        }),
      );
    });
  });

  it('não aplica busca com menos de 2 caracteres', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    mockList.mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [],
    });

    const { result } = renderHook(() => useUnidadeOrcamentariaList({ pageSize: 10 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setNomeOuSiglaInput('a');
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(mockList).toHaveBeenLastCalledWith(
        expect.objectContaining({
          nomeOuSigla: '',
        }),
      );
    });
  });

  it('exibe toast quando a consulta retorna erro', async () => {
    mockList.mockRejectedValueOnce(new Error('Erro ao buscar UOs'));

    renderHook(() => useUnidadeOrcamentariaList({ pageSize: 10 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Erro ao buscar UOs');
    });
  });
});