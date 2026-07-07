import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useConciliacaoCreate, useConciliacoesList } from '../useConciliacoes';
import { conciliacoesService } from '../../services/conciliacoes.service';

vi.mock('../../services/conciliacoes.service', () => ({
  conciliacoesService: {
    list: vi.fn(),
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
  resumo_situacoes: {
    encontrados: 9,
    nao_encontrados: 1,
    divergentes: 1,
    em_processo_baixa: 0,
    baixa_fisica: 2,
    encontrados_com_divergencia: 0,
  },
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

  return {
    queryClient,
    Wrapper: function Wrapper({ children }: Readonly<{ children: ReactNode }>) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    },
  };
}

describe('useConciliacaoCreate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedService.create.mockResolvedValue(conciliacao);
  });

  it('envia payload para o service e retorna a conciliacao criada', async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useConciliacaoCreate(), { wrapper: Wrapper });

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
    const { queryClient, Wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

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

describe('useConciliacoesList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    mockedService.list.mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [conciliacao],
    });
  });

  it('retorna lista apos fetching inicial', async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useConciliacoesList({ pageSize: 10 }), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.conciliacoes).toEqual([conciliacao]));

    expect(result.current.count).toBe(1);
    expect(result.current.loading).toBe(false);
    expect(mockedService.list).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10,
      search: '',
      anoVigencia: '',
      tipo: 'todos',
      status: 'todos',
      ordering: '-criado_em',
    });
  });

  it('envia filtros para o service e reinicia pagina ao alterar', async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useConciliacoesList({ pageSize: 10 }), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.conciliacoes).toHaveLength(1));

    act(() => {
      result.current.setPage(3);
      result.current.setSearchInput('CONC');
      result.current.setAnoVigenciaInput('2025');
      result.current.setTipoFilter('eventual');
      result.current.setStatusFilter('em_aberto');
    });

    await waitFor(() => {
      expect(result.current.page).toBe(1);
      expect(mockedService.list).toHaveBeenLastCalledWith({
        page: 1,
        pageSize: 10,
        search: 'CONC',
        anoVigencia: '2025',
        tipo: 'eventual',
        status: 'em_aberto',
        ordering: '-criado_em',
      });
    });
  });

  it('aplica debounce de 500ms no campo de busca', async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useConciliacoesList({ pageSize: 10 }), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.conciliacoes).toHaveLength(1));

    const callsBefore = mockedService.list.mock.calls.length;

    act(() => {
      result.current.setSearchInput('C');
      result.current.setSearchInput('CO');
      result.current.setSearchInput('CON');
    });

    expect(mockedService.list.mock.calls.length).toBe(callsBefore);

    await waitFor(
      () => {
        const lastCall =
          mockedService.list.mock.calls[mockedService.list.mock.calls.length - 1]?.[0];
        expect(lastCall?.search).toBe('CON');
      },
      { timeout: 1500 },
    );
  });

  it('aplica debounce de 500ms no campo de ano de vigencia', async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useConciliacoesList({ pageSize: 10 }), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.conciliacoes).toHaveLength(1));

    act(() => {
      result.current.setAnoVigenciaInput('2');
      result.current.setAnoVigenciaInput('20');
      result.current.setAnoVigenciaInput('2025');
    });

    await waitFor(
      () => {
        const lastCall =
          mockedService.list.mock.calls[mockedService.list.mock.calls.length - 1]?.[0];
        expect(lastCall?.anoVigencia).toBe('2025');
      },
      { timeout: 1500 },
    );
  });

  it('suporta paginacao e ordering', async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useConciliacoesList({ pageSize: 10 }), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.conciliacoes).toHaveLength(1));

    act(() => {
      result.current.setPage(4);
    });

    await waitFor(() => {
      const lastCall =
        mockedService.list.mock.calls[mockedService.list.mock.calls.length - 1]?.[0];
      expect(lastCall?.page).toBe(4);
    });

    act(() => {
      result.current.setOrdering('-criado_em');
    });

    await waitFor(() => {
      const lastCall =
        mockedService.list.mock.calls[mockedService.list.mock.calls.length - 1]?.[0];
      expect(lastCall?.ordering).toBe('-criado_em');
    });
  });

  it('expoe erro quando o service falha', async () => {
    const error = new Error('Falha ao listar');
    mockedService.list.mockReset();
    mockedService.list.mockRejectedValue(error);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useConciliacoesList({ pageSize: 10 }), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.conciliacoes).toEqual([]);
  });
});
