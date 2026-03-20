import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AxiosError, AxiosHeaders } from 'axios';
import { api } from '@/api/http';
import { unidadesAdministrativasService } from '../unidades-administrativas.service';

vi.mock('@/api/http', () => ({
  api: {
    get: vi.fn(),
  },
}));

const mockGet = vi.mocked(api.get);

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
});
