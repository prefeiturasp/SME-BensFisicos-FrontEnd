import { AxiosError } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/api/http';
import { parametrosConciliacaoAnualService } from '../parametros-conciliacao-anual.service';

vi.mock('@/api/http', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/lib/unidades-list-service', () => ({
  handleApiError: (error: unknown, fallbackMessage: string) => {
    throw error instanceof Error ? error : new Error(fallbackMessage);
  },
}));

const mockedApi = vi.mocked(api);

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

describe('parametrosConciliacaoAnualService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lista parametros com filtros convertidos para os nomes da API', async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: { count: 1, next: null, previous: null, results: [parametro] },
    });

    const result = await parametrosConciliacaoAnualService.list({
      page: 2,
      pageSize: 10,
      unidadeOrcamentaria: ' SME ',
      anoReferencia: '2026',
      ativo: 'true',
      ordering: '-ano_referencia',
    });

    expect(result.results).toEqual([parametro]);
    expect(mockedApi.get).toHaveBeenCalledWith('/inventario/parametros-conciliacao-anual/', {
      params: {
        page: 2,
        page_size: 10,
        search: 'SME',
        ano_referencia: '2026',
        ativo: 'true',
        ordering: '-ano_referencia',
      },
    });
  });

  it('nao envia filtro de status quando a opcao for todos', async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: { count: 0, next: null, previous: null, results: [] },
    });

    await parametrosConciliacaoAnualService.list({ ativo: 'todos' });

    expect(mockedApi.get).toHaveBeenCalledWith('/inventario/parametros-conciliacao-anual/', {
      params: {},
    });
  });

  it('carrega um parametro pelo id', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: parametro });

    await expect(parametrosConciliacaoAnualService.retrieve(1)).resolves.toEqual(parametro);

    expect(mockedApi.get).toHaveBeenCalledWith('/inventario/parametros-conciliacao-anual/1/');
  });

  it('cria, atualiza e exclui parametros nos endpoints esperados', async () => {
    const payload = {
      unidade_orcamentaria: 9,
      ano_referencia: 2026,
      periodo_inicial: '2026-04-01',
      periodo_final: '2026-04-30',
      ativo: true,
    };

    mockedApi.post.mockResolvedValueOnce({ data: parametro });
    mockedApi.patch.mockResolvedValueOnce({ data: parametro });
    mockedApi.delete.mockResolvedValueOnce({ data: undefined });

    await expect(parametrosConciliacaoAnualService.create(payload)).resolves.toEqual(parametro);
    await expect(parametrosConciliacaoAnualService.update(1, { ativo: false })).resolves.toEqual(
      parametro,
    );
    await expect(parametrosConciliacaoAnualService.destroy(1)).resolves.toBeUndefined();

    expect(mockedApi.post).toHaveBeenCalledWith(
      '/inventario/parametros-conciliacao-anual/',
      payload,
    );
    expect(mockedApi.patch).toHaveBeenCalledWith('/inventario/parametros-conciliacao-anual/1/', {
      ativo: false,
    });
    expect(mockedApi.delete).toHaveBeenCalledWith('/inventario/parametros-conciliacao-anual/1/');
  });

  it('repassa erros 400 para a tela tratar campos de formulario', async () => {
    const error = new AxiosError('Bad request', '400', undefined, undefined, {
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: {} as never,
      data: { ano_referencia: ['Ano invalido.'] },
    });

    mockedApi.post.mockRejectedValueOnce(error);

    await expect(
      parametrosConciliacaoAnualService.create({
        unidade_orcamentaria: 9,
        ano_referencia: 2026,
        periodo_inicial: '2026-04-01',
        periodo_final: '2026-04-30',
        ativo: true,
      }),
    ).rejects.toBe(error);
  });

  it('converte erro de conexao em mensagem amigavel', async () => {
    mockedApi.delete.mockRejectedValueOnce(new AxiosError('Network Error'));

    await expect(parametrosConciliacaoAnualService.destroy(1)).rejects.toThrow(/servidor/);
  });

  it('usa detalhe retornado pela API para erros de escrita', async () => {
    const error = new AxiosError('Forbidden', '403', undefined, undefined, {
      status: 403,
      statusText: 'Forbidden',
      headers: {},
      config: {} as never,
      data: { detail: 'Sem permissao.' },
    });

    mockedApi.patch.mockRejectedValueOnce(error);

    await expect(parametrosConciliacaoAnualService.update(1, { ativo: false })).rejects.toThrow(
      'Sem permissao.',
    );
  });

  it('usa mensagem padrao quando erro de escrita nao vem da API', async () => {
    mockedApi.post.mockRejectedValueOnce(new Error('erro inesperado'));

    await expect(
      parametrosConciliacaoAnualService.create({
        unidade_orcamentaria: 9,
        ano_referencia: 2026,
        periodo_inicial: '2026-04-01',
        periodo_final: '2026-04-30',
        ativo: true,
      }),
    ).rejects.toThrow(/cadastrar/);
  });
});
