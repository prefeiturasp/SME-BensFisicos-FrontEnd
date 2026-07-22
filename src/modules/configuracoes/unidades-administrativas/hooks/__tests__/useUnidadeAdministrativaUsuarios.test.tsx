import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  UA_USUARIOS_PAGE_SIZE,
  useUnidadeAdministrativaUsuarios,
} from '../useUnidadeAdministrativaUsuarios';

const usuariosMock = vi.fn();

vi.mock('../../services/unidades-administrativas.service', () => ({
  unidadesAdministrativasService: {
    usuarios: (...args: unknown[]) => usuariosMock(...args),
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

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  return { client, wrapper };
}

describe('useUnidadeAdministrativaUsuarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('não busca quando unidadeId é nulo', () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useUnidadeAdministrativaUsuarios({ unidadeId: null, page: 1 }),
      { wrapper },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(usuariosMock).not.toHaveBeenCalled();
  });

  it('busca os usuários da UA no endpoint dedicado, com paginação e ordenação padrão', async () => {
    const response = {
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          id: 1,
          username: 'joao.silva',
          nome: 'João Silva',
          rf: '1234567',
        },
      ],
    };

    usuariosMock.mockResolvedValueOnce(response);

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useUnidadeAdministrativaUsuarios({ unidadeId: 10, page: 2 }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(usuariosMock).toHaveBeenCalledWith(10, {
      page: 2,
      page_size: UA_USUARIOS_PAGE_SIZE,
      ordering: 'nome',
    });
    expect(result.current.data).toEqual(response);
  });

  it('não faz nova consulta quando o id da unidade permanece o mesmo', async () => {
    const response = { count: 0, next: null, previous: null, results: [] };
    usuariosMock.mockResolvedValue(response);

    const { wrapper } = createWrapper();
    const { result, rerender } = renderHook(
      ({ page }: { page: number }) =>
        useUnidadeAdministrativaUsuarios({ unidadeId: 10, page }),
      { wrapper, initialProps: { page: 1 } },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    rerender({ page: 1 });

    expect(usuariosMock).toHaveBeenCalledTimes(1);
  });

  it('propaga erro quando a consulta falha', async () => {
    usuariosMock.mockRejectedValueOnce(new Error('Erro ao listar usuários'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useUnidadeAdministrativaUsuarios({ unidadeId: 10, page: 1 }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(Error);
  });
});