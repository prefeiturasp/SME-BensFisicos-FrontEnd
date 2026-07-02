import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useConciliacaoCreate } from '../useConciliacoes';
import { conciliacoesService } from '../../services/conciliacoes.service';

vi.mock('../../services/conciliacoes.service', () => ({
  conciliacoesService: {
    create: vi.fn(),
  },
}));

const mockedService = vi.mocked(conciliacoesService);

const conciliacao = {
  id: 1,
  numero_conciliacao: 'CONC-2025-0001',
  unidade_administrativa: 7,
  unidade_administrativa_codigo: '10.10.10.001',
  unidade_administrativa_nome: 'DRE São Mateus',
  unidade_administrativa_sigla: 'DRE-SM',
  unidade_orcamentaria_codigo: '10.10.10',
  unidade_orcamentaria_nome: 'UO Educação',
  tipo: 'eventual' as const,
  tipo_display: 'Eventual',
  periodo_final: '2025-12-31',
  status: 'em_aberto' as const,
  status_display: 'Aberta',
  total_itens: 13,
  ano_vigencia: 2025,
  criado_em: '2025-01-15T10:00:00Z',
  criado_por: 5,
  criado_por_nome: 'João da Silva',
  criado_por_rf: '1234567',
  fechado_em: null,
  fechado_por: null,
  fechado_por_nome: '',
  fechado_por_rf: '',
  esta_aberto: true,
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

describe('useConciliacaoCreate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedService.create.mockResolvedValue(conciliacao);
  });

  it('envia payload para o service e retorna a conciliacao criada', async () => {
    const { result } = renderHook(() => useConciliacaoCreate(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      const conciliacaoCriada = await result.current.mutateAsync({
        unidade_administrativa: 7,
        periodo_final: '2025-12-31',
      });
      expect(conciliacaoCriada).toEqual(conciliacao);
    });

    expect(mockedService.create).toHaveBeenCalledWith({
      unidade_administrativa: 7,
      periodo_final: '2025-12-31',
    });
  });

  it('invalida queries de conciliacoes apos sucesso', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    function Wrapper({ children }: Readonly<{ children: ReactNode }>) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    }

    const { result } = renderHook(() => useConciliacaoCreate(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        unidade_administrativa: 7,
        periodo_final: '2025-12-31',
      });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['conciliacoes'] });
    });
  });
});
