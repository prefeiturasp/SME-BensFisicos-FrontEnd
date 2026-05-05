import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useUnidadeOrcamentariaCreate } from '../useUnidadeOrcamentaria';

const createMock = vi.fn();

vi.mock('../../services/unidades-orcamentarias.service', () => ({
  unidadesOrcamentariasService: {
    create: (...args: unknown[]) => createMock(...args),
  },
}));

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  return { client, wrapper };
}

describe('useUnidadeOrcamentariaCreate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('cria unidade orçamentária e invalida a listagem no sucesso', async () => {
    createMock.mockResolvedValueOnce({
      id: 1,
      codigo: '60.60.60',
      sigla: 'UO60',
      nome: 'UO 60',
      ativa: true,
      ativa_display: 'Ativa',
    });

    const { client, wrapper } = createWrapper();
    const invalidateQueriesSpy = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useUnidadeOrcamentariaCreate(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        codigo: '60.60.60',
        sigla: 'UO60',
        nome: 'UO 60',
        ativa: true,
      });
    });

    expect(createMock).toHaveBeenCalledWith({
      codigo: '60.60.60',
      sigla: 'UO60',
      nome: 'UO 60',
      ativa: true,
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['unidades-orcamentarias'] });
  });
});