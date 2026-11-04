import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useUnidadeAdministrativaById, useUnidadeAdministrativaUpdate } from '../useUnidadeAdministrativa';

const retrieveMock = vi.fn();
const updateMock = vi.fn();

vi.mock('../../services/unidades-administrativas.service', () => ({
  unidadesAdministrativasService: {
    retrieve: (...args: unknown[]) => retrieveMock(...args),
    update: (...args: unknown[]) => updateMock(...args),
  },
}));

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  return { client, wrapper };
}

describe('useUnidadeAdministrativa', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('useUnidadeAdministrativaById não busca quando id é nulo', async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useUnidadeAdministrativaById(null), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(retrieveMock).not.toHaveBeenCalled();
  });

  it('useUnidadeAdministrativaById busca detalhe quando id é válido', async () => {
    const unidade = {
      id: 10,
      codigo: '01.16.10.286',
      sigla: 'DIPAT',
      nome: 'Divisão de Patrimônio',
      status: 'ativa' as const,
      status_display: 'Ativa',
      unidade_orcamentaria: 1,
      unidade_orcamentaria_codigo: '01.16.10',
      unidade_orcamentaria_nome: 'SME',
      unidade_orcamentaria_sigla: 'SME',
      created_at: '2026-03-18T10:00:00-03:00',
      updated_at: '2026-03-18T10:00:00-03:00',
    };

    retrieveMock.mockResolvedValueOnce(unidade);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUnidadeAdministrativaById(10), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(retrieveMock).toHaveBeenCalledWith(10);
    expect(result.current.data).toEqual(unidade);
  });

  it('useUnidadeAdministrativaUpdate atualiza cache do detalhe e invalida lista', async () => {
    const updatedUnidade = {
      id: 10,
      codigo: '01.16.10.286',
      sigla: 'DIPAT',
      nome: 'Divisão de Patrimônio Atualizada',
      status: 'ativa' as const,
      status_display: 'Ativa',
      unidade_orcamentaria: 1,
      unidade_orcamentaria_codigo: '01.16.10',
      unidade_orcamentaria_nome: 'SME',
      unidade_orcamentaria_sigla: 'SME',
      created_at: '2026-03-18T10:00:00-03:00',
      updated_at: '2026-03-19T10:00:00-03:00',
    };

    updateMock.mockResolvedValueOnce(updatedUnidade);

    const { client, wrapper } = createWrapper();
    const invalidateQueriesSpy = vi.spyOn(client, 'invalidateQueries');

    const { result } = renderHook(() => useUnidadeAdministrativaUpdate(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        id: 10,
        payload: {
          codigo: '01.16.10.286',
          sigla: 'DIPAT',
          nome: 'Divisão de Patrimônio Atualizada',
          status: 'ativa',
        },
      });
    });

    expect(updateMock).toHaveBeenCalledWith(10, {
      codigo: '01.16.10.286',
      sigla: 'DIPAT',
      nome: 'Divisão de Patrimônio Atualizada',
      status: 'ativa',
    });

    expect(client.getQueryData(['unidade-administrativa', 10])).toEqual(updatedUnidade);
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['unidades-administrativas'] });
  });
});
