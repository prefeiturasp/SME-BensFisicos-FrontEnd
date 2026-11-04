import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useConciliacaoById,
  useConciliacaoCreate,
  useConciliacaoFinalizar,
  useConciliacaoItem,
  useConciliacaoItemSituacoesDisponiveis,
  useConciliacaoItens,
  useConciliacaoOcorrenciaRemover,
  useConciliacaoOcorrenciaUpsert,
  useConciliacoesList,
} from '../useConciliacoes';
import { conciliacoesService } from '../../services/conciliacoes.service';

vi.mock('../../services/conciliacoes.service', () => ({
  conciliacoesService: {
    list: vi.fn(),
    create: vi.fn(),
    retrieve: vi.fn(),
    listItens: vi.fn(),
    historico: vi.fn(),
    exportar: vi.fn(),
    finalizar: vi.fn(),
    retrieveItem: vi.fn(),
    listSituacoesDisponiveis: vi.fn(),
    upsertOcorrencia: vi.fn(),
    removerOcorrencia: vi.fn(),
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

describe('useConciliacaoById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedService.retrieve.mockResolvedValue(conciliacao);
  });

  it('busca o detalhe da conciliacao quando o id e valido', async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useConciliacaoById(1), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.data).toEqual(conciliacao));

    expect(mockedService.retrieve).toHaveBeenCalledWith(1);
  });

  it('nao chama o service quando o id e null', () => {
    const { Wrapper } = createWrapper();
    renderHook(() => useConciliacaoById(null), { wrapper: Wrapper });

    expect(mockedService.retrieve).not.toHaveBeenCalled();
  });

  it('expoe erro quando o service falha', async () => {
    mockedService.retrieve.mockReset();
    mockedService.retrieve.mockRejectedValue(new Error('Falha ao recuperar'));

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useConciliacaoById(1), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useConciliacaoItens', () => {
  const item = {
    id: 42,
    conciliacao: 1,
    conciliacao_numero: 'CONC-2025-0001',
    conciliacao_status: 'em_aberto' as const,
    unidade_administrativa: 7,
    unidade_administrativa_sigla: 'DRE-SM',
    bem: {
      id: 123,
      numero_patrimonial: 'PAT-000123',
      nome: 'Notebook Dell',
      descricao: 'Notebook 14',
      marca: 'Dell',
      modelo: 'Latitude',
      valor_unitario: '4500.00',
      status: 'ativo',
      localizacao: 'Sala 12',
      bloqueado_conciliacao: false,
    },
    situacao: 'encontrado_sem_divergencia' as const,
    situacao_display: 'Encontrado sem divergência',
    observacao: '',
    divergencia: '',
    tem_ocorrencia: false,
    permite_registrar_ocorrencia: true,
    atualizado_por: null,
    atualizado_por_nome: '',
    atualizado_em: '2025-01-15T10:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    mockedService.listItens.mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [item],
    });
  });

  it('retorna a lista de itens apos fetching inicial', async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(
      () => useConciliacaoItens({ conciliacaoId: 1, pageSize: 10 }),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(result.current.itens).toEqual([item]));

    expect(result.current.count).toBe(1);
    expect(result.current.loading).toBe(false);
    expect(mockedService.listItens).toHaveBeenCalledWith(1, {
      page: 1,
      pageSize: 10,
      numeroPatrimonial: '',
      nome: '',
      situacao: [],
      ordering: 'bem__numero_patrimonial',
    });
  });

  it('nao chama o service quando o id da conciliacao e zero', () => {
    const { Wrapper } = createWrapper();
    renderHook(
      () => useConciliacaoItens({ conciliacaoId: 0, pageSize: 10 }),
      { wrapper: Wrapper },
    );

    expect(mockedService.listItens).not.toHaveBeenCalled();
  });

  it('envia filtros e reinicia pagina ao alterar', async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(
      () => useConciliacaoItens({ conciliacaoId: 1, pageSize: 10 }),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(result.current.itens).toHaveLength(1));

    act(() => {
      result.current.setNumeroPatrimonialInput('001');
      result.current.setNomeInput('Mesa');
      result.current.setSituacaoFilter(['divergente']);
    });

    await waitFor(() => {
      expect(result.current.page).toBe(1);
      expect(mockedService.listItens).toHaveBeenLastCalledWith(1, {
        page: 1,
        pageSize: 10,
        numeroPatrimonial: '001',
        nome: 'Mesa',
        situacao: ['divergente'],
        ordering: 'bem__numero_patrimonial',
      });
    });
  });

  it('reinicia a pagina e refaz a busca ao alterar multiplas situacoes', async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(
      () => useConciliacaoItens({ conciliacaoId: 1, pageSize: 10 }),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(result.current.itens).toHaveLength(1));

    act(() => {
      result.current.setPage(3);
    });

    await waitFor(() => {
      const lastCall =
        mockedService.listItens.mock.calls[mockedService.listItens.mock.calls.length - 1]?.[1];
      expect(lastCall?.page).toBe(3);
    });

    act(() => {
      result.current.setSituacaoFilter(['divergente', 'nao_encontrado']);
    });

    await waitFor(() => {
      expect(result.current.page).toBe(1);
      expect(mockedService.listItens).toHaveBeenLastCalledWith(1, {
        page: 1,
        pageSize: 10,
        numeroPatrimonial: '',
        nome: '',
        situacao: ['divergente', 'nao_encontrado'],
        ordering: 'bem__numero_patrimonial',
      });
    });
  });

  it('aplica debounce de 500ms nos campos de busca', async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(
      () => useConciliacaoItens({ conciliacaoId: 1, pageSize: 10 }),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(result.current.itens).toHaveLength(1));

    const callsBefore = mockedService.listItens.mock.calls.length;

    act(() => {
      result.current.setNumeroPatrimonialInput('0');
      result.current.setNumeroPatrimonialInput('00');
      result.current.setNumeroPatrimonialInput('001');
      result.current.setNomeInput('M');
      result.current.setNomeInput('Me');
      result.current.setNomeInput('Mes');
    });

    expect(mockedService.listItens.mock.calls.length).toBe(callsBefore);

    await waitFor(
      () => {
        const lastCall =
          mockedService.listItens.mock.calls[mockedService.listItens.mock.calls.length - 1]?.[1];
        expect(lastCall?.numeroPatrimonial).toBe('001');
        expect(lastCall?.nome).toBe('Mes');
      },
      { timeout: 1500 },
    );
  });

  it('atualiza o ordering e mantem a paginacao controlada', async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(
      () => useConciliacaoItens({ conciliacaoId: 1, pageSize: 10 }),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(result.current.itens).toHaveLength(1));

    act(() => {
      result.current.setOrdering('bem__nome');
    });

    await waitFor(() => {
      const lastCall =
        mockedService.listItens.mock.calls[mockedService.listItens.mock.calls.length - 1]?.[1];
      expect(lastCall?.ordering).toBe('bem__nome');
    });
  });

  it('expoe erro quando o service falha', async () => {
    mockedService.listItens.mockReset();
    mockedService.listItens.mockRejectedValue(new Error('Falha ao listar itens'));

    const { Wrapper } = createWrapper();
    const { result } = renderHook(
      () => useConciliacaoItens({ conciliacaoId: 1, pageSize: 10 }),
      { wrapper: Wrapper },
    );

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.itens).toEqual([]);
  });
});

describe('useConciliacaoFinalizar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('envia o id para o service e retorna a conciliacao finalizada', async () => {
    const finalizada = { ...conciliacao, status: 'fechado' as const, esta_aberto: false };
    mockedService.finalizar.mockResolvedValueOnce(finalizada);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useConciliacaoFinalizar(), { wrapper: Wrapper });

    await act(async () => {
      const returned = await result.current.mutateAsync(1);
      expect(returned).toEqual(finalizada);
    });

    expect(mockedService.finalizar).toHaveBeenCalledWith(1);
  });

  it('invalida as queries de conciliacao apos sucesso', async () => {
    const finalizada = { ...conciliacao, status: 'fechado' as const, esta_aberto: false };
    mockedService.finalizar.mockResolvedValue(finalizada);

    const { queryClient, Wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useConciliacaoFinalizar(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync(1);
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['conciliacoes'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['conciliacao', 1] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['conciliacao', 1, 'itens'] });
    });
  });

  it('expoe erro quando o service falha', async () => {
    mockedService.finalizar.mockReset();
    mockedService.finalizar.mockRejectedValue(new Error('Falha ao finalizar'));

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useConciliacaoFinalizar(), { wrapper: Wrapper });

    await act(async () => {
      try {
        await result.current.mutateAsync(1);
      } catch (caught) {
        expect(caught).toBeInstanceOf(Error);
      }
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useConciliacaoItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('nao busca quando os ids nao sao validos', () => {
    const { Wrapper } = createWrapper();
    renderHook(() => useConciliacaoItem(null, null), { wrapper: Wrapper });

    expect(mockedService.retrieveItem).not.toHaveBeenCalled();
  });

  it('busca o detalhe do item quando os ids sao validos', async () => {
    const detail = { id: 42, conciliacao: 1 } as never;
    mockedService.retrieveItem.mockResolvedValueOnce(detail);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useConciliacaoItem(1, 42), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.data).toEqual(detail);
    });

    expect(mockedService.retrieveItem).toHaveBeenCalledWith(1, 42);
  });
});

describe('useConciliacaoItemSituacoesDisponiveis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('nao busca quando os ids sao invalidos', () => {
    const { Wrapper } = createWrapper();
    renderHook(() => useConciliacaoItemSituacoesDisponiveis(null, 1), { wrapper: Wrapper });

    expect(mockedService.listSituacoesDisponiveis).not.toHaveBeenCalled();
  });

  it('busca a lista de situacoes disponiveis para o item', async () => {
    const opcoes = [{ value: 'encontrado', label: 'Encontrado' }];
    mockedService.listSituacoesDisponiveis.mockResolvedValueOnce(opcoes as never);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useConciliacaoItemSituacoesDisponiveis(1, 42), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(opcoes);
    });

    expect(mockedService.listSituacoesDisponiveis).toHaveBeenCalledWith(1, 42);
  });
});

describe('useConciliacaoOcorrenciaUpsert', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('envia o payload para o service e retorna a resposta', async () => {
    const itemDetail = { id: 42, conciliacao: 1 } as never;
    mockedService.upsertOcorrencia.mockResolvedValueOnce(itemDetail);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useConciliacaoOcorrenciaUpsert(), {
      wrapper: Wrapper,
    });

    let returned: unknown;
    await act(async () => {
      returned = await result.current.mutateAsync({
        conciliacaoId: 1,
        itemId: 42,
        payload: { situacao: 'divergente', divergencia: 'detalhes' },
      });
    });

    expect(returned).toEqual(itemDetail);
    expect(mockedService.upsertOcorrencia).toHaveBeenCalledWith(1, 42, {
      situacao: 'divergente',
      divergencia: 'detalhes',
    });
  });

  it('invalida queries de itens, item, ocorrencias e conciliacoes apos sucesso', async () => {
    const itemDetail = { id: 42, conciliacao: 1 } as never;
    mockedService.upsertOcorrencia.mockResolvedValueOnce(itemDetail);

    const { queryClient, Wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useConciliacaoOcorrenciaUpsert(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        conciliacaoId: 1,
        itemId: 42,
        payload: { situacao: 'encontrado' },
      });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['conciliacoes'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['conciliacao', 1] });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['conciliacao', 1, 'item', 42],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['conciliacao', 1, 'itens'],
      });
    });
  });
});

describe('useConciliacaoOcorrenciaRemover', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('chama o service e invalida as queries relacionadas', async () => {
    const itemDetail = { id: 42, conciliacao: 1 } as never;
    mockedService.removerOcorrencia.mockResolvedValueOnce(itemDetail);

    const { queryClient, Wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useConciliacaoOcorrenciaRemover(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({ conciliacaoId: 1, itemId: 42 });
    });

    expect(mockedService.removerOcorrencia).toHaveBeenCalledWith(1, 42);

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['conciliacoes'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['conciliacao', 1] });
    });
  });
});
