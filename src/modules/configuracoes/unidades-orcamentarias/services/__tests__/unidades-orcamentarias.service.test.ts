import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AxiosError, AxiosHeaders } from 'axios';
import { api } from '@/api/http';
import { unidadesOrcamentariasService } from '../unidades-orcamentarias.service';

vi.mock('@/api/http', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockGet = vi.mocked(api.get);
const mockPost = vi.mocked(api.post);

describe('unidadesOrcamentariasService', () => {
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

    await unidadesOrcamentariasService.list({
      page: 2,
      pageSize: 10,
      codigo: '10.10',
      nomeOuSigla: 'uo',
      ativa: 'true',
      ordering: 'nome',
    });

    const [url] = mockGet.mock.calls[0] as [string];

    expect(url).toContain('/unidades-orcamentarias/?');
    expect(url).toContain('page=2');
    expect(url).toContain('page_size=10');
    expect(url).toContain('search=10.10+uo');
    expect(url).toContain('ativa=true');
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

    await unidadesOrcamentariasService.list({ ativa: 'todos' });

    const [url] = mockGet.mock.calls[0] as [string];

    expect(url).not.toContain('ativa=');
  });

  it('propaga mensagem de detail da API', async () => {
    const error = new AxiosError('Forbidden');
    error.response = {
      status: 403,
      statusText: 'Forbidden',
      headers: {},
      data: { detail: 'Você não tem permissão para acessar UOs.' },
      config: { headers: new AxiosHeaders() },
    };

    mockGet.mockRejectedValueOnce(error);

    await expect(unidadesOrcamentariasService.list()).rejects.toThrow(
      'Você não tem permissão para acessar UOs.',
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

    await expect(unidadesOrcamentariasService.list()).rejects.toThrow(
      'Erro ao listar unidades orçamentárias.',
    );
  });

  it('retorna erro de conexão ao listar quando não há resposta', async () => {
    mockGet.mockRejectedValueOnce(new AxiosError('Network Error'));

    await expect(unidadesOrcamentariasService.list()).rejects.toThrow(
      'Erro de conexão com o servidor.',
    );
  });

  it('cria unidade orçamentária com payload correto', async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        id: 2,
        codigo: '60.60.60',
        sigla: 'UO60',
        nome: 'UO 60',
        ativa: true,
        ativa_display: 'Ativa',
      },
    });

    const result = await unidadesOrcamentariasService.create({
      codigo: '60.60.60',
      sigla: 'UO60',
      nome: 'UO 60',
      ativa: true,
    });

    expect(mockPost).toHaveBeenCalledWith('/unidades-orcamentarias/', {
      codigo: '60.60.60',
      sigla: 'UO60',
      nome: 'UO 60',
      ativa: true,
    });
    expect(result.id).toBe(2);
  });

  it('repropaga erro 400 na criação para a UI tratar campos', async () => {
    const error = new AxiosError('Bad Request');
    error.response = {
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      data: { codigo: ['Código já utilizado.'] },
      config: { headers: new AxiosHeaders() },
    };

    mockPost.mockRejectedValueOnce(error);

    await expect(
      unidadesOrcamentariasService.create({
        codigo: '60.60.60',
        sigla: 'UO60',
        nome: 'UO 60',
        ativa: true,
      }),
    ).rejects.toBe(error);
  });

  it('retorna mensagem padrao ao falhar na criação sem detail', async () => {
    const error = new AxiosError('Internal Error');
    error.response = {
      status: 500,
      statusText: 'Internal Server Error',
      headers: {},
      data: {},
      config: { headers: new AxiosHeaders() },
    };

    mockPost.mockRejectedValueOnce(error);

    await expect(
      unidadesOrcamentariasService.create({
        codigo: '60.60.60',
        sigla: 'UO60',
        nome: 'UO 60',
        ativa: true,
      }),
    ).rejects.toThrow('Erro ao criar unidade orçamentária.');
  });

  it('exporta relatório com blob e nome de arquivo vindo do header', async () => {
    const blob = new Blob(['csv-content'], { type: 'text/csv' });

    mockGet.mockResolvedValueOnce({
      data: blob,
      headers: {
        'content-disposition': 'attachment; filename="unidades-orcamentarias.csv"',
        'content-type': 'text/csv',
      },
    });

    const result = await unidadesOrcamentariasService.exportar('csv', {
      codigo: '10.10',
      ativa: 'true',
      ordering: 'codigo',
    });

    const [url, config] = mockGet.mock.calls[0] as [string, { responseType: string }];

    expect(url).toContain('/unidades-orcamentarias/exportar/?');
    expect(url).toContain('formato=csv');
    expect(url).toContain('ativa=true');
    expect(config.responseType).toBe('blob');
    expect(result.fileName).toBe('unidades-orcamentarias.csv');
    expect(result.blob).toBe(blob);
    expect(result.contentType).toBe('text/csv');
  });

  it('gera nome padrão quando header não traz nome de arquivo', async () => {
    mockGet.mockResolvedValueOnce({
      data: new Blob(['binary'], { type: 'application/pdf' }),
      headers: {},
    });

    const result = await unidadesOrcamentariasService.exportar('pdf');

    expect(result.fileName).toBe('unidades-orcamentarias.pdf');
  });

  it('decodifica nome de arquivo utf-8 ao exportar', async () => {
    mockGet.mockResolvedValueOnce({
      data: new Blob(['csv-content'], { type: 'text/csv' }),
      headers: {
        'content-disposition': "attachment; filename*=UTF-8''unidades%20orcamentarias.csv",
        'content-type': 'text/csv',
      },
    });

    const result = await unidadesOrcamentariasService.exportar('csv');

    expect(result.fileName).toBe('unidades orcamentarias.csv');
  });

  it('repropaga erro não Axios ao exportar', async () => {
    mockGet.mockRejectedValueOnce(new Error('Falha inesperada na exportação'));

    await expect(unidadesOrcamentariasService.exportar('csv')).rejects.toThrow(
      'Falha inesperada na exportação',
    );
  });
});