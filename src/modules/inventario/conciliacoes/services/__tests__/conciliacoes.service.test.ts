import { AxiosError } from 'axios';
import type { MockInstance } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/api/http';
import { conciliacoesService } from '../conciliacoes.service';

vi.mock('@/api/http', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedGet = api.get as unknown as MockInstance;
const mockedPost = api.post as unknown as MockInstance;

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

describe('conciliacoesService.create', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('cria conciliacao eventual via POST /inventario/conciliacoes/', async () => {
    mockedPost.mockResolvedValueOnce({ data: conciliacao });

    const payload = {
      unidade_administrativa: 7,
      periodo_final: '2025-12-31',
    };

    await expect(conciliacoesService.create(payload)).resolves.toEqual(conciliacao);

    expect(mockedPost).toHaveBeenCalledWith('/inventario/conciliacoes/', payload);
  });

  it('repassa erros 400 para a pagina tratar no formulario', async () => {
    const error = new AxiosError('Bad request', '400', undefined, undefined, {
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: {} as never,
      data: {
        unidade_administrativa: [
          'Ja existe uma conciliacao em aberto para esta Unidade Administrativa. Feche...',
        ],
      },
    });

    mockedPost.mockRejectedValueOnce(error);

    await expect(
      conciliacoesService.create({
        unidade_administrativa: 7,
        periodo_final: '2025-12-31',
      }),
    ).rejects.toBe(error);
  });

  it('usa detalhe retornado pela API para erros genericos', async () => {
    const error = new AxiosError('Forbidden', '403', undefined, undefined, {
      status: 403,
      statusText: 'Forbidden',
      headers: {},
      config: {} as never,
      data: { detail: 'Sem permissao para criar conciliacao.' },
    });

    mockedPost.mockRejectedValueOnce(error);

    await expect(
      conciliacoesService.create({
        unidade_administrativa: 7,
        periodo_final: '2025-12-31',
      }),
    ).rejects.toThrow('Sem permissao para criar conciliacao.');
  });

  it('converte erro de conexao em mensagem amigavel', async () => {
    mockedPost.mockRejectedValueOnce(new AxiosError('Network Error'));

    await expect(
      conciliacoesService.create({
        unidade_administrativa: 7,
        periodo_final: '2025-12-31',
      }),
    ).rejects.toThrow(/servidor/);
  });

  it('usa mensagem padrao para erros nao mapeados', async () => {
    mockedPost.mockRejectedValueOnce(new Error('erro inesperado'));

    await expect(
      conciliacoesService.create({
        unidade_administrativa: 7,
        periodo_final: '2025-12-31',
      }),
    ).rejects.toThrow(/cadastrar concilia/i);
  });
});

describe('conciliacoesService.list', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('envia filtros convertidos para os nomes esperados pela API', async () => {
    mockedGet.mockResolvedValueOnce({
      data: { count: 1, next: null, previous: null, results: [conciliacao] },
    });

    await expect(
      conciliacoesService.list({
        page: 2,
        pageSize: 10,
        search: 'CONC-2025',
        anoVigencia: '2025',
        tipo: 'eventual',
        status: 'em_aberto',
        ordering: '-criado_em',
      }),
    ).resolves.toEqual({
      count: 1,
      next: null,
      previous: null,
      results: [conciliacao],
    });

    expect(mockedGet).toHaveBeenCalledWith('/inventario/conciliacoes/', {
      params: {
        page: 2,
        page_size: 10,
        search: 'CONC-2025',
        ano_vigencia: '2025',
        tipo: 'eventual',
        status: 'em_aberto',
        ordering: '-criado_em',
      },
    });
  });

  it('omite filtros quando o valor e vazio ou "todos"', async () => {
    mockedGet.mockResolvedValueOnce({
      data: { count: 0, next: null, previous: null, results: [] },
    });

    await expect(
      conciliacoesService.list({
        search: '   ',
        anoVigencia: '',
        tipo: 'todos',
        status: 'todos',
      }),
    ).resolves.toEqual({ count: 0, next: null, previous: null, results: [] });

    expect(mockedGet).toHaveBeenCalledWith('/inventario/conciliacoes/', {
      params: {},
    });
  });

  it('faz requisicao sem parametros quando nenhum filtro e informado', async () => {
    mockedGet.mockResolvedValueOnce({
      data: { count: 0, next: null, previous: null, results: [] },
    });

    await conciliacoesService.list();

    expect(mockedGet).toHaveBeenCalledWith('/inventario/conciliacoes/', {
      params: {},
    });
  });

  it('repassa detalhe de erro retornado pela API', async () => {
    const error = new AxiosError('Forbidden', '403', undefined, undefined, {
      status: 403,
      statusText: 'Forbidden',
      headers: {},
      config: {} as never,
      data: { detail: 'Sem permissao para listar conciliacoes.' },
    });
    mockedGet.mockRejectedValueOnce(error);

    await expect(conciliacoesService.list()).rejects.toThrow(
      'Sem permissao para listar conciliacoes.',
    );
  });

  it('converte erro de conexao em mensagem amigavel', async () => {
    mockedGet.mockRejectedValueOnce(new AxiosError('Network Error'));

    await expect(conciliacoesService.list()).rejects.toThrow(/servidor/);
  });

  it('usa mensagem padrao para erros 500 sem detalhe', async () => {
    const error = new AxiosError('Server Error', '500', undefined, undefined, {
      status: 500,
      statusText: 'Server Error',
      headers: {},
      config: {} as never,
      data: {},
    });
    mockedGet.mockRejectedValueOnce(error);

    await expect(conciliacoesService.list()).rejects.toThrow(/listar concilia/i);
  });
});

describe('conciliacoesService.retrieve', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('busca o detalhe da conciliacao via GET /inventario/conciliacoes/{id}/', async () => {
    mockedGet.mockResolvedValueOnce({ data: conciliacao });

    await expect(conciliacoesService.retrieve(1)).resolves.toEqual(conciliacao);

    expect(mockedGet).toHaveBeenCalledWith('/inventario/conciliacoes/1/');
  });

  it('repassa detalhe do backend em erros com detail', async () => {
    const error = new AxiosError('Not Found', '404', undefined, undefined, {
      status: 404,
      statusText: 'Not Found',
      headers: {},
      config: {} as never,
      data: { detail: 'Conciliacao nao encontrada.' },
    });
    mockedGet.mockRejectedValueOnce(error);

    await expect(conciliacoesService.retrieve(1)).rejects.toThrow('Conciliacao nao encontrada.');
  });

  it('converte erro de conexao em mensagem amigavel', async () => {
    mockedGet.mockRejectedValueOnce(new AxiosError('Network Error'));

    await expect(conciliacoesService.retrieve(1)).rejects.toThrow(/servidor/);
  });

  it('usa mensagem padrao quando o backend nao envia detalhe', async () => {
    const error = new AxiosError('Server Error', '500', undefined, undefined, {
      status: 500,
      statusText: 'Server Error',
      headers: {},
      config: {} as never,
      data: {},
    });
    mockedGet.mockRejectedValueOnce(error);

    await expect(conciliacoesService.retrieve(1)).rejects.toThrow(/carregar concilia/i);
  });
});

describe('conciliacoesService.listItens', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  it('envia os filtros convertidos para os nomes esperados pela API', async () => {
    mockedGet.mockResolvedValueOnce({
      data: { count: 1, next: null, previous: null, results: [item] },
    });

    await expect(
      conciliacoesService.listItens(1, {
        page: 2,
        pageSize: 10,
        numeroPatrimonial: '001.052',
        nome: 'POLTRONA',
        situacao: ['divergente'],
        ordering: '-atualizado_em',
      }),
    ).resolves.toEqual({
      count: 1,
      next: null,
      previous: null,
      results: [item],
    });

    expect(mockedGet).toHaveBeenCalledWith('/inventario/conciliacoes/1/itens/', {
      params: {
        page: 2,
        page_size: 10,
        search: '001.052 POLTRONA',
        situacao: 'divergente',
        ordering: '-atualizado_em',
      },
    });
  });

  it('envia multiplas situacoes separadas por virgula', async () => {
    mockedGet.mockResolvedValueOnce({
      data: { count: 0, next: null, previous: null, results: [] },
    });

    await expect(
      conciliacoesService.listItens(1, {
        situacao: ['divergente', 'nao_encontrado'],
      }),
    ).resolves.toEqual({ count: 0, next: null, previous: null, results: [] });

    expect(mockedGet).toHaveBeenCalledWith('/inventario/conciliacoes/1/itens/', {
      params: {
        situacao: 'divergente,nao_encontrado',
      },
    });
  });

  it('omite a situacao quando a selecao contem "todos"', async () => {
    mockedGet.mockResolvedValueOnce({
      data: { count: 0, next: null, previous: null, results: [] },
    });

    await expect(
      conciliacoesService.listItens(1, {
        situacao: ['todos', 'divergente'],
      }),
    ).resolves.toEqual({ count: 0, next: null, previous: null, results: [] });

    expect(mockedGet).toHaveBeenCalledWith('/inventario/conciliacoes/1/itens/', {
      params: {
        situacao: 'divergente',
      },
    });
  });

  it('envia apenas o termo de busca preenchido como search', async () => {
    mockedGet.mockResolvedValueOnce({
      data: { count: 0, next: null, previous: null, results: [] },
    });

    await conciliacoesService.listItens(1, {
      numeroPatrimonial: '001.052',
      nome: '',
      situacao: [],
    });

    expect(mockedGet).toHaveBeenCalledWith('/inventario/conciliacoes/1/itens/', {
      params: {
        search: '001.052',
      },
    });
  });

  it('omite filtros vazios ou "todos"', async () => {
    mockedGet.mockResolvedValueOnce({
      data: { count: 0, next: null, previous: null, results: [] },
    });

    await expect(
      conciliacoesService.listItens(1, {
        numeroPatrimonial: '   ',
        nome: '',
        situacao: ['todos'],
      }),
    ).resolves.toEqual({ count: 0, next: null, previous: null, results: [] });

    expect(mockedGet).toHaveBeenCalledWith('/inventario/conciliacoes/1/itens/', {
      params: {},
    });
  });

  it('faz requisicao sem parametros quando nenhum filtro e informado', async () => {
    mockedGet.mockResolvedValueOnce({
      data: { count: 0, next: null, previous: null, results: [] },
    });

    await conciliacoesService.listItens(1);

    expect(mockedGet).toHaveBeenCalledWith('/inventario/conciliacoes/1/itens/', {
      params: {},
    });
  });

  it('repassa detalhe do backend em erros com detail', async () => {
    const error = new AxiosError('Not Found', '404', undefined, undefined, {
      status: 404,
      statusText: 'Not Found',
      headers: {},
      config: {} as never,
      data: { detail: 'Itens nao encontrados.' },
    });
    mockedGet.mockRejectedValueOnce(error);

    await expect(conciliacoesService.listItens(1)).rejects.toThrow('Itens nao encontrados.');
  });

  it('converte erro de conexao em mensagem amigavel', async () => {
    mockedGet.mockRejectedValueOnce(new AxiosError('Network Error'));

    await expect(conciliacoesService.listItens(1)).rejects.toThrow(/servidor/);
  });

  it('usa mensagem padrao quando o backend nao envia detalhe', async () => {
    const error = new AxiosError('Server Error', '500', undefined, undefined, {
      status: 500,
      statusText: 'Server Error',
      headers: {},
      config: {} as never,
      data: {},
    });
    mockedGet.mockRejectedValueOnce(error);

    await expect(conciliacoesService.listItens(1)).rejects.toThrow(/itens da concilia/i);
  });
});

describe('conciliacoesService.historico', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('busca o historico via GET /inventario/conciliacoes/{id}/historico/', async () => {
    const grupos = [
      {
        alterado_em: '2026-03-10T15:24:00Z',
        alterado_por: 1,
        alterado_por_nome: 'Maria',
        acoes: [
          {
            campo: 'acao',
            valor_antigo: '',
            valor_novo: 'criado',
            justificativa: 'Conciliação criada via API',
          },
        ],
      },
    ];

    mockedGet.mockResolvedValueOnce({ data: grupos });

    await expect(conciliacoesService.historico(7)).resolves.toEqual(grupos);
    expect(mockedGet).toHaveBeenCalledWith('/inventario/conciliacoes/7/historico/');
  });

  it('repassa detalhe do backend em erros com detail', async () => {
    const error = new AxiosError('Forbidden', '403', undefined, undefined, {
      status: 403,
      statusText: 'Forbidden',
      headers: {},
      config: {} as never,
      data: { detail: 'Sem permissao para historico.' },
    });
    mockedGet.mockRejectedValueOnce(error);

    await expect(conciliacoesService.historico(1)).rejects.toThrow(
      'Sem permissao para historico.',
    );
  });

  it('converte erro de conexao em mensagem amigavel', async () => {
    mockedGet.mockRejectedValueOnce(new AxiosError('Network Error'));

    await expect(conciliacoesService.historico(1)).rejects.toThrow(/servidor/);
  });

  it('usa mensagem padrao quando o backend nao envia detalhe', async () => {
    const error = new AxiosError('Server Error', '500', undefined, undefined, {
      status: 500,
      statusText: 'Server Error',
      headers: {},
      config: {} as never,
      data: {},
    });
    mockedGet.mockRejectedValueOnce(error);

    await expect(conciliacoesService.historico(1)).rejects.toThrow(/histórico/i);
  });
});

describe('conciliacoesService.exportar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('busca o PDF via GET /inventario/conciliacoes/{id}/exportar/ usando blob', async () => {
    const blob = new Blob(['pdf'], { type: 'application/pdf' });
    mockedGet.mockResolvedValueOnce({ data: blob });

    await expect(conciliacoesService.exportar(7)).resolves.toBe(blob);

    expect(mockedGet).toHaveBeenCalledWith('/inventario/conciliacoes/7/exportar/', {
      responseType: 'blob',
    });
  });

  it('repassa detalhe do backend em erros com detail', async () => {
    const error = new AxiosError('Forbidden', '403', undefined, undefined, {
      status: 403,
      statusText: 'Forbidden',
      headers: {},
      config: {} as never,
      data: { detail: 'Sem permissao para exportar.' },
    });
    mockedGet.mockRejectedValueOnce(error);

    await expect(conciliacoesService.exportar(1)).rejects.toThrow(
      'Sem permissao para exportar.',
    );
  });

  it('converte erro de conexao em mensagem amigavel', async () => {
    mockedGet.mockRejectedValueOnce(new AxiosError('Network Error'));

    await expect(conciliacoesService.exportar(1)).rejects.toThrow(/servidor/);
  });

  it('usa mensagem padrao quando o backend nao envia detalhe', async () => {
    const error = new AxiosError('Server Error', '500', undefined, undefined, {
      status: 500,
      statusText: 'Server Error',
      headers: {},
      config: {} as never,
      data: {},
    });
    mockedGet.mockRejectedValueOnce(error);

    await expect(conciliacoesService.exportar(1)).rejects.toThrow(/exportar/i);
  });
});

describe('conciliacoesService.finalizar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('finaliza a conciliacao via POST /inventario/conciliacoes/{id}/finalizar/', async () => {
    const finalizada = { ...conciliacao, status: 'fechado' as const, esta_aberto: false };
    mockedPost.mockResolvedValueOnce({ data: finalizada });

    await expect(conciliacoesService.finalizar(7)).resolves.toEqual(finalizada);

    expect(mockedPost).toHaveBeenCalledWith('/inventario/conciliacoes/7/finalizar/');
  });

  it('repassa detalhe do backend em erros com detail', async () => {
    const error = new AxiosError('Bad Request', '400', undefined, undefined, {
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: {} as never,
      data: { detail: 'Conciliacao ja finalizada.' },
    });
    mockedPost.mockRejectedValueOnce(error);

    await expect(conciliacoesService.finalizar(1)).rejects.toThrow(
      'Conciliacao ja finalizada.',
    );
  });

  it('converte erro de conexao em mensagem amigavel', async () => {
    mockedPost.mockRejectedValueOnce(new AxiosError('Network Error'));

    await expect(conciliacoesService.finalizar(1)).rejects.toThrow(/servidor/);
  });

  it('usa mensagem padrao quando o backend nao envia detalhe', async () => {
    const error = new AxiosError('Server Error', '500', undefined, undefined, {
      status: 500,
      statusText: 'Server Error',
      headers: {},
      config: {} as never,
      data: {},
    });
    mockedPost.mockRejectedValueOnce(error);

    await expect(conciliacoesService.finalizar(1)).rejects.toThrow(/finalizar/i);
  });
});

describe('conciliacoesService.retrieveItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const itemDetail = {
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
    situacao: 'divergente' as const,
    situacao_display: 'Divergente',
    observacao: '',
    divergencia: 'Local divergente',
    tem_ocorrencia: true,
    permite_registrar_ocorrencia: true,
    atualizado_por: null,
    atualizado_por_nome: '',
    atualizado_em: '2025-01-15T10:00:00Z',
    pode_marcar_como_encontrado: false,
    pode_resolver_situacao: false,
    conciliacao_esta_aberto: true,
    ocorrencias: [
      {
        id: 99,
        situacao: 'divergente' as const,
        situacao_display: 'Divergente',
        observacao: 'obs',
        divergencia: 'Local divergente',
        registrado_por: 7,
        registrado_por_nome: 'Maria Souza',
        registrado_por_rf: '7654321',
        registrado_em: '2025-06-10T14:25:00Z',
      },
    ],
  };

  it('busca o detalhe do item via GET /inventario/conciliacoes/{id}/itens/{itemId}/', async () => {
    mockedGet.mockResolvedValueOnce({ data: itemDetail });

    await expect(conciliacoesService.retrieveItem(1, 42)).resolves.toEqual(itemDetail);

    expect(mockedGet).toHaveBeenCalledWith(
      '/inventario/conciliacoes/1/itens/42/',
    );
  });

  it('repassa detalhe do backend em erros com detail', async () => {
    const error = new AxiosError('Not Found', '404', undefined, undefined, {
      status: 404,
      statusText: 'Not Found',
      headers: {},
      config: {} as never,
      data: { detail: 'Item nao encontrado.' },
    });
    mockedGet.mockRejectedValueOnce(error);

    await expect(conciliacoesService.retrieveItem(1, 42)).rejects.toThrow(
      'Item nao encontrado.',
    );
  });

  it('converte erro de conexao em mensagem amigavel', async () => {
    mockedGet.mockRejectedValueOnce(new AxiosError('Network Error'));

    await expect(conciliacoesService.retrieveItem(1, 42)).rejects.toThrow(/servidor/);
  });

  it('usa mensagem padrao quando o backend nao envia detalhe', async () => {
    const error = new AxiosError('Server Error', '500', undefined, undefined, {
      status: 500,
      statusText: 'Server Error',
      headers: {},
      config: {} as never,
      data: {},
    });
    mockedGet.mockRejectedValueOnce(error);

    await expect(conciliacoesService.retrieveItem(1, 42)).rejects.toThrow(
      /item da concilia/i,
    );
  });
});

describe('conciliacoesService.listSituacoesDisponiveis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('busca situacoes via GET /inventario/conciliacoes/{id}/itens/{itemId}/situacoes-disponiveis/', async () => {
    const opcoes = [
      { value: 'encontrado_sem_divergencia', label: 'Encontrado sem divergência' },
      { value: 'encontrado', label: 'Encontrado' },
    ];
    mockedGet.mockResolvedValueOnce({ data: opcoes });

    await expect(conciliacoesService.listSituacoesDisponiveis(1, 42)).resolves.toEqual(opcoes);

    expect(mockedGet).toHaveBeenCalledWith(
      '/inventario/conciliacoes/1/itens/42/situacoes-disponiveis/',
    );
  });

  it('repassa detalhe do backend em erros com detail', async () => {
    const error = new AxiosError('Bad Request', '400', undefined, undefined, {
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: {} as never,
      data: { detail: 'Inventario fechado nao permite edicoes.' },
    });
    mockedGet.mockRejectedValueOnce(error);

    await expect(conciliacoesService.listSituacoesDisponiveis(1, 42)).rejects.toThrow(
      'Inventario fechado nao permite edicoes.',
    );
  });

  it('converte erro de conexao em mensagem amigavel', async () => {
    mockedGet.mockRejectedValueOnce(new AxiosError('Network Error'));

    await expect(conciliacoesService.listSituacoesDisponiveis(1, 42)).rejects.toThrow(
      /servidor/,
    );
  });
});

describe('conciliacoesService.upsertOcorrencia', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('envia payload para POST /inventario/conciliacoes/{id}/itens/{itemId}/ocorrencias/', async () => {
    const itemDetail = { id: 42 };
    mockedPost.mockResolvedValueOnce({ data: itemDetail });

    await expect(
      conciliacoesService.upsertOcorrencia(1, 42, {
        situacao: 'divergente',
        divergencia: 'detalhes',
      }),
    ).resolves.toEqual(itemDetail);

    expect(mockedPost).toHaveBeenCalledWith(
      '/inventario/conciliacoes/1/itens/42/ocorrencias/',
      {
        situacao: 'divergente',
        divergencia: 'detalhes',
      },
    );
  });

  it('repassa erros 400 sem tratamento adicional para o formulario', async () => {
    const error = new AxiosError('Bad Request', '400', undefined, undefined, {
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: {} as never,
      data: { divergencia: ['Campo obrigatorio.'] },
    });
    mockedPost.mockRejectedValueOnce(error);

    await expect(
      conciliacoesService.upsertOcorrencia(1, 42, {
        situacao: 'divergente',
        divergencia: '',
      }),
    ).rejects.toBe(error);
  });

  it('repassa detalhe do backend em erros nao-400 com detail', async () => {
    const error = new AxiosError('Bad Request', '403', undefined, undefined, {
      status: 403,
      statusText: 'Forbidden',
      headers: {},
      config: {} as never,
      data: { detail: 'Inventario fechado nao permite edicoes.' },
    });
    mockedPost.mockRejectedValueOnce(error);

    await expect(
      conciliacoesService.upsertOcorrencia(1, 42, { situacao: 'encontrado' }),
    ).rejects.toThrow('Inventario fechado nao permite edicoes.');
  });

  it('converte erro de conexao em mensagem amigavel', async () => {
    mockedPost.mockRejectedValueOnce(new AxiosError('Network Error'));

    await expect(
      conciliacoesService.upsertOcorrencia(1, 42, { situacao: 'encontrado' }),
    ).rejects.toThrow(/servidor/);
  });

  it('usa mensagem padrao para erros nao mapeados', async () => {
    mockedPost.mockRejectedValueOnce(new Error('erro inesperado'));

    await expect(
      conciliacoesService.upsertOcorrencia(1, 42, { situacao: 'encontrado' }),
    ).rejects.toThrow(/registrar/i);
  });
});

describe('conciliacoesService.removerOcorrencia', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('chama POST /inventario/conciliacoes/{id}/itens/{itemId}/ocorrencias/remover/', async () => {
    const itemDetail = { id: 42 };
    mockedPost.mockResolvedValueOnce({ data: itemDetail });

    await expect(conciliacoesService.removerOcorrencia(1, 42)).resolves.toEqual(itemDetail);

    expect(mockedPost).toHaveBeenCalledWith(
      '/inventario/conciliacoes/1/itens/42/ocorrencias/remover/',
    );
  });

  it('repassa detalhe do backend em erros nao-400 com detail', async () => {
    const error = new AxiosError('Bad Request', '403', undefined, undefined, {
      status: 403,
      statusText: 'Forbidden',
      headers: {},
      config: {} as never,
      data: { detail: 'Item sem ocorrencia.' },
    });
    mockedPost.mockRejectedValueOnce(error);

    await expect(conciliacoesService.removerOcorrencia(1, 42)).rejects.toThrow(
      'Item sem ocorrencia.',
    );
  });

  it('converte erro de conexao em mensagem amigavel', async () => {
    mockedPost.mockRejectedValueOnce(new AxiosError('Network Error'));

    await expect(conciliacoesService.removerOcorrencia(1, 42)).rejects.toThrow(/servidor/);
  });

  it('usa mensagem padrao para erros nao mapeados', async () => {
    mockedPost.mockRejectedValueOnce(new Error('erro inesperado'));

    await expect(conciliacoesService.removerOcorrencia(1, 42)).rejects.toThrow(/excluir/i);
  });
});
