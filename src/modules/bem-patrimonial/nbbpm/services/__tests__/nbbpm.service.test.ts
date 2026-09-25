import { AxiosError } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/api/http';
import { nbbpmService } from '../nbbpm.service';

vi.mock('@/api/http', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

function makeAxiosError(status: number, data: unknown = {}) {
  const error = new AxiosError('error');
  error.response = {
    status,
    data,
    headers: {},
    config: {} as never,
    statusText: '',
  };
  return error;
}

describe('nbbpmService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lista NBBPMs enviando paginação, busca e ordenação', async () => {
    const payload = { count: 0, next: null, previous: null, results: [] };
    vi.mocked(api.get).mockResolvedValue({ data: payload });

    const result = await nbbpmService.list({
      page: 2,
      pageSize: 10,
      search: '  001.0000001  ',
      ordering: '-data_criacao,-numero',
    });

    const [url] = vi.mocked(api.get).mock.calls[0];
    expect(url).toContain('/nbbpm/?');
    expect(url).toContain('page=2');
    expect(url).toContain('page_size=10');
    expect(url).toContain('search=001.0000001');
    expect(url).toContain('ordering=-data_criacao%2C-numero');
    expect(result).toEqual(payload);
  });

  it('omite parâmetros vazios', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { count: 0, next: null, previous: null, results: [] },
    });

    await nbbpmService.list({ search: '   ' });

    expect(vi.mocked(api.get).mock.calls[0][0]).toBe('/nbbpm/?');
  });

  it('é somente leitura: não expõe operações de escrita', () => {
    expect(Object.keys(nbbpmService)).toEqual(['list']);
  });

  it('usa a mensagem `detail` do backend quando existir', async () => {
    vi.mocked(api.get).mockRejectedValue(
      makeAxiosError(403, { detail: 'Você não tem permissão para executar essa ação.' }),
    );

    await expect(nbbpmService.list()).rejects.toThrow(
      'Você não tem permissão para executar essa ação.',
    );
  });

  it('usa a mensagem padrão quando o backend não detalha o erro', async () => {
    vi.mocked(api.get).mockRejectedValue(makeAxiosError(500));

    await expect(nbbpmService.list()).rejects.toThrow('Erro ao listar NBBPMs');
  });

  it('informa erro de conexão quando não há resposta', async () => {
    const error = new AxiosError('Network Error');
    error.response = undefined;
    vi.mocked(api.get).mockRejectedValue(error);

    await expect(nbbpmService.list()).rejects.toThrow('Erro de conexão com o servidor.');
  });

  it('propaga erros não-Axios sem alterar', async () => {
    const boom = new TypeError('boom');
    vi.mocked(api.get).mockRejectedValue(boom);

    await expect(nbbpmService.list()).rejects.toBe(boom);
  });
});
