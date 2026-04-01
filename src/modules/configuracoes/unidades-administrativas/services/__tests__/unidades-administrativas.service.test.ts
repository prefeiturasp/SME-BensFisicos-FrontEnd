import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AxiosError, AxiosHeaders } from 'axios';
import { api } from '@/api/http';
import { unidadesAdministrativasService } from '../unidades-administrativas.service';

vi.mock('@/api/http', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockGet = vi.mocked(api.get);
const mockPost = vi.mocked(api.post);

describe('unidadesAdministrativasService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('monta query com paginação, busca, status e ordenação', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        count: 1,
        next: null,
        previous: null,
        results: [],
      },
    });

    await unidadesAdministrativasService.list({
      page: 2,
      pageSize: 10,
      codigo: '001',
      nomeOuSigla: 'gab',
      status: 'ativa',
      ordering: 'nome',
    });

    const [url] = mockGet.mock.calls[0] as [string];

    expect(url).toContain('/unidades-administrativas/?');
    expect(url).toContain('page=2');
    expect(url).toContain('page_size=10');
    expect(url).toContain('search=001+gab');
    expect(url).toContain('status=ativa');
    expect(url).toContain('ordering=nome');
  });

  it('não envia status quando filtro estiver em todos', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        count: 1,
        next: null,
        previous: null,
        results: [],
      },
    });

    await unidadesAdministrativasService.list({ status: 'todos' });

    const [url] = mockGet.mock.calls[0] as [string];

    expect(url).not.toContain('status=');
  });

  it('propaga mensagem de detail da API', async () => {
    const error = new AxiosError('Forbidden');
    error.response = {
      status: 403,
      statusText: 'Forbidden',
      headers: {},
      data: { detail: 'Você não tem permissão para esse filtro.' },
      config: { headers: new AxiosHeaders() },
    };

    mockGet.mockRejectedValueOnce(error);

    await expect(unidadesAdministrativasService.list()).rejects.toThrow(
      'Você não tem permissão para esse filtro.',
    );
  });

  it('retorna mensagem padrão ao listar quando API falha sem detail', async () => {
    const error = new AxiosError('Internal Error');
    error.response = {
      status: 500,
      statusText: 'Internal Server Error',
      headers: {},
      data: {},
      config: { headers: new AxiosHeaders() },
    };

    mockGet.mockRejectedValueOnce(error);

    await expect(unidadesAdministrativasService.list()).rejects.toThrow(
      'Erro ao listar unidades administrativas',
    );
  });

  it('retorna erro de conexão ao listar quando não há resposta', async () => {
    const error = new AxiosError('Network Error');
    mockGet.mockRejectedValueOnce(error);

    await expect(unidadesAdministrativasService.list()).rejects.toThrow(
      'Erro de conexão com o servidor.',
    );
  });

  it('exporta relatório com blob e nome de arquivo vindo do header', async () => {
    const blob = new Blob(['csv-content'], { type: 'text/csv' });

    mockGet.mockResolvedValueOnce({
      data: blob,
      headers: {
        'content-disposition': 'attachment; filename="unidades.csv"',
        'content-type': 'text/csv',
      },
    });

    const result = await unidadesAdministrativasService.exportar('csv', {
      codigo: '01',
      status: 'ativa',
      ordering: 'codigo',
    });

    const [url, config] = mockGet.mock.calls[0] as [string, { responseType: string }];

    expect(url).toContain('/unidades-administrativas/exportar/?');
    expect(url).toContain('formato=csv');
    expect(url).toContain('status=ativa');
    expect(config.responseType).toBe('blob');

    expect(result.fileName).toBe('unidades.csv');
    expect(result.blob).toBe(blob);
    expect(result.contentType).toBe('text/csv');
  });

  it('gera nome padrão quando header não traz nome de arquivo', async () => {
    mockGet.mockResolvedValueOnce({
      data: new Blob(['binary'], { type: 'application/pdf' }),
      headers: {},
    });

    const result = await unidadesAdministrativasService.exportar('pdf');

    expect(result.fileName).toBe('unidades-administrativas.pdf');
  });

  it('cria unidade administrativa com payload esperado', async () => {
    const payload = {
      unidade_orcamentaria: 1,
      codigo: '286',
      sigla: 'DIPAT',
      nome: 'Divisão de Patrimônio',
      status: 'ativa' as const,
    };

    const resposta = {
      id: 10,
      codigo: '01.16.10.286',
      sigla: 'DIPAT',
      nome: 'Divisão de Patrimônio',
      status: 'ativa' as const,
      status_display: 'Ativa',
      unidade_orcamentaria: 1,
      unidade_orcamentaria_codigo: '01.16.10',
      unidade_orcamentaria_nome: 'SECRETARIA MUNICIPAL DE EDUCAÇÃO',
      unidade_orcamentaria_sigla: 'SME',
      created_at: '2026-03-18T10:00:00-03:00',
      updated_at: '2026-03-18T10:00:00-03:00',
    };

    mockPost.mockResolvedValueOnce({ data: resposta });

    const result = await unidadesAdministrativasService.create(payload);

    expect(mockPost).toHaveBeenCalledWith('/unidades-administrativas/', payload);
    expect(result).toEqual(resposta);
  });

  it('repropaga erro 400 no create para permitir tratamento por campo', async () => {
    const payload = {
      unidade_orcamentaria: 1,
      codigo: '286',
      sigla: 'DIPAT',
      nome: 'Divisão de Patrimônio',
      status: 'ativa' as const,
    };

    const error = new AxiosError('Bad Request');
    error.response = {
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      data: { codigo: ['Código inválido.'] },
      config: { headers: new AxiosHeaders() },
    };

    mockPost.mockRejectedValueOnce(error);

    await expect(unidadesAdministrativasService.create(payload)).rejects.toBe(error);
  });

  it('retorna detail no create quando erro não é 400', async () => {
    const payload = {
      unidade_orcamentaria: 1,
      codigo: '286',
      sigla: 'DIPAT',
      nome: 'Divisão de Patrimônio',
      status: 'ativa' as const,
    };

    const error = new AxiosError('Forbidden');
    error.response = {
      status: 403,
      statusText: 'Forbidden',
      headers: {},
      data: { detail: 'Sem permissão para criar UA.' },
      config: { headers: new AxiosHeaders() },
    };

    mockPost.mockRejectedValueOnce(error);

    await expect(unidadesAdministrativasService.create(payload)).rejects.toThrow(
      'Sem permissão para criar UA.',
    );
  });

  it('retorna mensagem padrão no create quando erro não traz detail', async () => {
    const payload = {
      unidade_orcamentaria: 1,
      codigo: '286',
      sigla: 'DIPAT',
      nome: 'Divisão de Patrimônio',
      status: 'ativa' as const,
    };

    const error = new AxiosError('Server Error');
    error.response = {
      status: 500,
      statusText: 'Server Error',
      headers: {},
      data: {},
      config: { headers: new AxiosHeaders() },
    };

    mockPost.mockRejectedValueOnce(error);

    await expect(unidadesAdministrativasService.create(payload)).rejects.toThrow(
      'Erro ao criar unidade administrativa.',
    );
  });

  it('retorna erro de conexão no create quando não há resposta', async () => {
    const payload = {
      unidade_orcamentaria: 1,
      codigo: '286',
      sigla: 'DIPAT',
      nome: 'Divisão de Patrimônio',
      status: 'ativa' as const,
    };

    const error = new AxiosError('Network Error');
    mockPost.mockRejectedValueOnce(error);

    await expect(unidadesAdministrativasService.create(payload)).rejects.toThrow(
      'Erro de conexão com o servidor.',
    );
  });

  it('repropaga erro não Axios no create', async () => {
    const payload = {
      unidade_orcamentaria: 1,
      codigo: '286',
      sigla: 'DIPAT',
      nome: 'Divisão de Patrimônio',
      status: 'ativa' as const,
    };

    mockPost.mockRejectedValueOnce(new Error('Falha inesperada'));

    await expect(unidadesAdministrativasService.create(payload)).rejects.toThrow(
      'Falha inesperada',
    );
  });
});
