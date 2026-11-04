import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useUnidadeOrcamentariaById,
  useUnidadeOrcamentariaCreate,
  useUnidadeOrcamentariaUpdate,
} from '../useUnidadeOrcamentaria';

const createMock = vi.fn();
const retrieveMock = vi.fn();
const updateMock = vi.fn();

vi.mock('../../services/unidades-orcamentarias.service', () => ({
  unidadesOrcamentariasService: {
    create: (...args: unknown[]) => createMock(...args),
    retrieve: (...args: unknown[]) => retrieveMock(...args),
    update: (...args: unknown[]) => updateMock(...args),
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

  it('carrega unidade orçamentária por id', async () => {
    retrieveMock.mockResolvedValue({
      id: 7,
      codigo: '10.10.10',
      sigla: 'UO1',
      nome: 'UO 1',
      ativa: true,
      ativa_display: 'Ativa',
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUnidadeOrcamentariaById(7), { wrapper });

    await waitFor(() => {
      expect(retrieveMock).toHaveBeenCalledWith(7);
      expect(result.current.data?.id).toBe(7);
    });
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

  it('atualiza unidade orçamentária e sincroniza cache local', async () => {
    updateMock.mockResolvedValueOnce({
      id: 9,
      codigo: '20.20.20',
      sigla: 'UO2',
      nome: 'UO 2',
      ativa: false,
      ativa_display: 'Inativa',
    });

    const { client, wrapper } = createWrapper();
    const invalidateQueriesSpy = vi.spyOn(client, 'invalidateQueries');
    const setQueryDataSpy = vi.spyOn(client, 'setQueryData');
    const { result } = renderHook(() => useUnidadeOrcamentariaUpdate(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        id: 9,
        payload: { nome: 'UO 2', ativa: false },
      });
    });

    expect(updateMock).toHaveBeenCalledWith(9, { nome: 'UO 2', ativa: false });
    expect(setQueryDataSpy).toHaveBeenCalledWith(['unidade-orcamentaria', 9], {
      id: 9,
      codigo: '20.20.20',
      sigla: 'UO2',
      nome: 'UO 2',
      ativa: false,
      ativa_display: 'Inativa',
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['unidades-orcamentarias'] });
  });
});