import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AxiosError, AxiosHeaders } from 'axios';
import { api } from '@/api/http';
import { unidadesAdministrativasService } from '../unidades-administrativas.service';

vi.mock('@/api/http', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

const mockGet = vi.mocked(api.get);
const mockPost = vi.mocked(api.post);
const mockPatch = vi.mocked(api.patch);

/** Monta um AxiosError com response fake. Sem `response` => erro de rede. */
function makeAxiosError(status?: number, data: unknown = {}) {
  const error = new AxiosError(status ? `HTTP ${status}` : 'Network Error');

  if (status !== undefined) {
    error.response = {
      status,
      statusText: String(status),
      headers: {},
      data,
      config: { headers: new AxiosHeaders() },
    } as never;
  }

  return error;
}

const createPayload = {
  unidade_orcamentaria: 1,
  codigo: '286',
  sigla: 'DIPAT',
  nome: 'Divisão de Patrimônio',
  status: 'ativa' as const,
};

const unidade = {
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

const paginaVazia = { count: 0, next: null, previous: null, results: [] };

/** Lê a URL da n-ésima chamada de api.get. */
function getUrl(call = 0) {
  return (mockGet.mock.calls[call] as [string])[0];
}

describe('unidadesAdministrativasService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===============================
  // LIST
  // ===============================

  describe('list', () => {
    it('monta query com paginação, busca, status e ordenação', async () => {
      mockGet.mockResolvedValueOnce({ data: { ...paginaVazia, count: 1 } });

      await unidadesAdministrativasService.list({
        page: 2,
        pageSize: 10,
        codigo: '001',
        nomeOuSigla: 'gab',
        status: 'ativa',
        ordering: 'nome',
      });

      const url = getUrl();
      expect(url).toContain('/unidades-administrativas/?');
      expect(url).toContain('page=2');
      expect(url).toContain('page_size=10');
      expect(url).toContain('search=001+gab');
      expect(url).toContain('status=ativa');
      expect(url).toContain('ordering=nome');
    });

    it('monta busca apenas com código quando nomeOuSigla não é informado', async () => {
      mockGet.mockResolvedValueOnce({ data: paginaVazia });

      await unidadesAdministrativasService.list({ codigo: '001' });

      expect(getUrl()).toContain('search=001');
    });

    it('monta busca apenas com nomeOuSigla quando código não é informado', async () => {
      mockGet.mockResolvedValueOnce({ data: paginaVazia });

      await unidadesAdministrativasService.list({ nomeOuSigla: 'gab' });

      expect(getUrl()).toContain('search=gab');
    });

    it('não envia search quando nenhum termo de busca é informado', async () => {
      mockGet.mockResolvedValueOnce({ data: paginaVazia });

      await unidadesAdministrativasService.list({ status: 'ativa' });

      expect(getUrl()).not.toContain('search=');
    });

    it('não envia parâmetros opcionais quando chamado sem argumentos', async () => {
      mockGet.mockResolvedValueOnce({ data: paginaVazia });

      await unidadesAdministrativasService.list();

      const url = getUrl();
      expect(url).toContain('/unidades-administrativas/?');
      expect(url).not.toContain('page=');
      expect(url).not.toContain('status=');
      expect(url).not.toContain('ordering=');
    });

    it('não envia status quando filtro estiver em todos', async () => {
      mockGet.mockResolvedValueOnce({ data: paginaVazia });

      await unidadesAdministrativasService.list({ status: 'todos' });

      expect(getUrl()).not.toContain('status=');
    });

    it('retorna a resposta paginada da API', async () => {
      mockGet.mockResolvedValueOnce({
        data: { count: 1, next: null, previous: null, results: [unidade] },
      });

      const result = await unidadesAdministrativasService.list();

      expect(result.count).toBe(1);
      expect(result.results[0].id).toBe(10);
    });

    it('propaga mensagem de detail da API', async () => {
      mockGet.mockRejectedValueOnce(
        makeAxiosError(403, { detail: 'Você não tem permissão para esse filtro.' }),
      );

      await expect(unidadesAdministrativasService.list()).rejects.toThrow(
        'Você não tem permissão para esse filtro.',
      );
    });

    it('retorna mensagem padrão ao listar quando API falha sem detail', async () => {
      mockGet.mockRejectedValueOnce(makeAxiosError(500));

      await expect(unidadesAdministrativasService.list()).rejects.toThrow(
        'Erro ao listar unidades administrativas',
      );
    });

    it('retorna erro de conexão ao listar quando não há resposta', async () => {
      mockGet.mockRejectedValueOnce(makeAxiosError());

      await expect(unidadesAdministrativasService.list()).rejects.toThrow(
        'Erro de conexão com o servidor.',
      );
    });

    it('repropaga erro não Axios ao listar', async () => {
      const boom = new Error('Falha inesperada na listagem');
      mockGet.mockRejectedValueOnce(boom);

      await expect(unidadesAdministrativasService.list()).rejects.toBe(boom);
    });
  });

  // ===============================
  // EXPORTAR
  // ===============================

  describe('exportar', () => {
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

    it('não envia status ao exportar quando filtro estiver em todos', async () => {
      mockGet.mockResolvedValueOnce({
        data: new Blob(['csv'], { type: 'text/csv' }),
        headers: {},
      });

      await unidadesAdministrativasService.exportar('csv', { status: 'todos' });

      expect(getUrl()).not.toContain('status=');
    });

    it('gera nome padrão quando header não traz nome de arquivo', async () => {
      mockGet.mockResolvedValueOnce({
        data: new Blob(['binary'], { type: 'application/pdf' }),
        headers: {},
      });

      const result = await unidadesAdministrativasService.exportar('pdf');

      expect(result.fileName).toBe('unidades-administrativas.pdf');
    });

    it('decodifica nome de arquivo utf-8 ao exportar', async () => {
      mockGet.mockResolvedValueOnce({
        data: new Blob(['csv-content'], { type: 'text/csv' }),
        headers: {
          'content-disposition': "attachment; filename*=UTF-8''unidades%20administrativas.csv",
          'content-type': 'text/csv',
        },
      });

      const result = await unidadesAdministrativasService.exportar('csv');

      expect(result.fileName).toBe('unidades administrativas.csv');
    });

    it('propaga detail da API ao exportar', async () => {
      mockGet.mockRejectedValueOnce(
        makeAxiosError(403, { detail: 'Exportação bloqueada.' }),
      );

      await expect(unidadesAdministrativasService.exportar('csv')).rejects.toThrow(
        'Exportação bloqueada.',
      );
    });

    it('retorna mensagem padrão ao exportar quando não há detail', async () => {
      mockGet.mockRejectedValueOnce(makeAxiosError(500));

      await expect(unidadesAdministrativasService.exportar('csv')).rejects.toThrow(
        'Erro ao exportar unidades administrativas',
      );
    });

    it('retorna erro de conexão ao exportar quando não há resposta', async () => {
      mockGet.mockRejectedValueOnce(makeAxiosError());

      await expect(unidadesAdministrativasService.exportar('csv')).rejects.toThrow(
        'Erro de conexão com o servidor.',
      );
    });

    it('repropaga erro não Axios ao exportar', async () => {
      mockGet.mockRejectedValueOnce(new Error('Falha inesperada na exportação'));

      await expect(unidadesAdministrativasService.exportar('csv')).rejects.toThrow(
        'Falha inesperada na exportação',
      );
    });
  });

  // ===============================
  // CREATE
  // ===============================

  describe('create', () => {
    it('cria unidade administrativa com payload esperado', async () => {
      mockPost.mockResolvedValueOnce({ data: unidade });

      const result = await unidadesAdministrativasService.create(createPayload);

      expect(mockPost).toHaveBeenCalledWith('/unidades-administrativas/', createPayload);
      expect(result).toEqual(unidade);
    });

    it('repropaga erro 400 no create para permitir tratamento por campo', async () => {
      const error = makeAxiosError(400, { codigo: ['Código inválido.'] });
      mockPost.mockRejectedValueOnce(error);

      await expect(unidadesAdministrativasService.create(createPayload)).rejects.toBe(error);
    });

    it('repropaga erro 400 mesmo quando a resposta traz detail', async () => {
      const error = makeAxiosError(400, { detail: 'Código já cadastrado.' });
      mockPost.mockRejectedValueOnce(error);

      // O ramo de 400 vem antes do detail: o erro cru chega à UI.
      await expect(unidadesAdministrativasService.create(createPayload)).rejects.toBe(error);
    });

    it('retorna detail no create quando erro não é 400', async () => {
      mockPost.mockRejectedValueOnce(
        makeAxiosError(403, { detail: 'Sem permissão para criar UA.' }),
      );

      await expect(unidadesAdministrativasService.create(createPayload)).rejects.toThrow(
        'Sem permissão para criar UA.',
      );
    });

    it('ignora detail vazio e usa a mensagem padrão', async () => {
      mockPost.mockRejectedValueOnce(makeAxiosError(500, { detail: '' }));

      await expect(unidadesAdministrativasService.create(createPayload)).rejects.toThrow(
        'Erro ao criar unidade administrativa.',
      );
    });

    it('usa a mensagem padrão quando a resposta não tem corpo', async () => {
      mockPost.mockRejectedValueOnce(makeAxiosError(502, null));

      await expect(unidadesAdministrativasService.create(createPayload)).rejects.toThrow(
        'Erro ao criar unidade administrativa.',
      );
    });

    it('retorna mensagem padrão no create quando erro não traz detail', async () => {
      mockPost.mockRejectedValueOnce(makeAxiosError(500));

      await expect(unidadesAdministrativasService.create(createPayload)).rejects.toThrow(
        'Erro ao criar unidade administrativa.',
      );
    });

    it('retorna erro de conexão no create quando não há resposta', async () => {
      mockPost.mockRejectedValueOnce(makeAxiosError());

      await expect(unidadesAdministrativasService.create(createPayload)).rejects.toThrow(
        'Erro de conexão com o servidor.',
      );
    });

    it('repropaga erro não Axios no create', async () => {
      const boom = new Error('Falha inesperada');
      mockPost.mockRejectedValueOnce(boom);

      await expect(unidadesAdministrativasService.create(createPayload)).rejects.toBe(boom);
    });
  });

  // ===============================
  // RETRIEVE
  // ===============================

  describe('retrieve', () => {
    it('busca detalhe de unidade administrativa por id', async () => {
      mockGet.mockResolvedValueOnce({ data: unidade });

      const result = await unidadesAdministrativasService.retrieve(10);

      expect(mockGet).toHaveBeenCalledWith('/unidades-administrativas/10/');
      expect(result).toEqual(unidade);
    });

    it('propaga detail da API ao carregar detalhe', async () => {
      mockGet.mockRejectedValueOnce(
        makeAxiosError(404, { detail: 'Unidade não encontrada.' }),
      );

      await expect(unidadesAdministrativasService.retrieve(10)).rejects.toThrow(
        'Unidade não encontrada.',
      );
    });

    it('retorna mensagem padrão ao carregar detalhe sem detail', async () => {
      mockGet.mockRejectedValueOnce(makeAxiosError(500));

      await expect(unidadesAdministrativasService.retrieve(10)).rejects.toThrow(
        'Erro ao carregar unidade administrativa',
      );
    });

    it('retorna erro de conexão ao carregar detalhe sem resposta', async () => {
      mockGet.mockRejectedValueOnce(makeAxiosError());

      await expect(unidadesAdministrativasService.retrieve(10)).rejects.toThrow(
        'Erro de conexão com o servidor.',
      );
    });

    it('repropaga erro não Axios ao carregar detalhe', async () => {
      const boom = new Error('Falha inesperada no detalhe');
      mockGet.mockRejectedValueOnce(boom);

      await expect(unidadesAdministrativasService.retrieve(10)).rejects.toBe(boom);
    });
  });

  // ===============================
  // USUÁRIOS
  // ===============================

  describe('usuarios', () => {
    const usuario = {
      id: 3,
      nome: 'Maria Souza',
      email: 'maria@example.com',
    };

    it('busca usuários da unidade sem parâmetros', async () => {
      mockGet.mockResolvedValueOnce({ data: paginaVazia });

      const result = await unidadesAdministrativasService.usuarios(10);

      expect(mockGet).toHaveBeenCalledWith('/unidades-administrativas/10/usuarios/?');
      expect(result.results).toEqual([]);
    });

    it('monta query com search, ordering e paginação', async () => {
      mockGet.mockResolvedValueOnce({ data: paginaVazia });

      await unidadesAdministrativasService.usuarios(10, {
        search: 'maria',
        ordering: 'nome',
        page: 3,
        page_size: 20,
      });

      const url = getUrl();
      expect(url).toContain('/unidades-administrativas/10/usuarios/?');
      expect(url).toContain('search=maria');
      expect(url).toContain('ordering=nome');
      expect(url).toContain('page=3');
      expect(url).toContain('page_size=20');
    });

    it('remove espaços em volta do termo de busca', async () => {
      mockGet.mockResolvedValueOnce({ data: paginaVazia });

      await unidadesAdministrativasService.usuarios(10, { search: '  maria  ' });

      expect(getUrl()).toContain('search=maria');
      expect(getUrl()).not.toContain('search=+');
    });

    it('não envia search quando o termo tiver apenas espaços', async () => {
      mockGet.mockResolvedValueOnce({ data: paginaVazia });

      await unidadesAdministrativasService.usuarios(10, { search: '    ' });

      expect(getUrl()).not.toContain('search=');
    });

    it('não envia page nem page_size quando forem 0', async () => {
      mockGet.mockResolvedValueOnce({ data: paginaVazia });

      await unidadesAdministrativasService.usuarios(10, { page: 0, page_size: 0 });

      const url = getUrl();
      expect(url).not.toContain('page=');
      expect(url).not.toContain('page_size=');
    });

    it('retorna a lista paginada de usuários', async () => {
      mockGet.mockResolvedValueOnce({
        data: { count: 1, next: null, previous: null, results: [usuario] },
      });

      const result = await unidadesAdministrativasService.usuarios(10);

      expect(result.count).toBe(1);
      expect(result.results[0].id).toBe(3);
    });

    it('propaga detail da API ao listar usuários', async () => {
      mockGet.mockRejectedValueOnce(
        makeAxiosError(403, { detail: 'Sem permissão para ver usuários.' }),
      );

      await expect(unidadesAdministrativasService.usuarios(10)).rejects.toThrow(
        'Sem permissão para ver usuários.',
      );
    });

    it('retorna mensagem padrão ao listar usuários sem detail', async () => {
      mockGet.mockRejectedValueOnce(makeAxiosError(500));

      await expect(unidadesAdministrativasService.usuarios(10)).rejects.toThrow(
        'Erro ao listar usuários associados à unidade administrativa',
      );
    });

    it('retorna erro de conexão ao listar usuários sem resposta', async () => {
      mockGet.mockRejectedValueOnce(makeAxiosError());

      await expect(unidadesAdministrativasService.usuarios(10)).rejects.toThrow(
        'Erro de conexão com o servidor.',
      );
    });

    it('repropaga erro não Axios ao listar usuários', async () => {
      const boom = new Error('Falha inesperada nos usuários');
      mockGet.mockRejectedValueOnce(boom);

      await expect(unidadesAdministrativasService.usuarios(10)).rejects.toBe(boom);
    });
  });

  // ===============================
  // UPDATE
  // ===============================

  describe('update', () => {
    const updatePayload = {
      codigo: '01.16.10.286',
      sigla: 'DIPAT',
      nome: 'Divisão de Patrimônio',
      status: 'ativa' as const,
    };

    it('atualiza unidade administrativa com payload esperado', async () => {
      mockPatch.mockResolvedValueOnce({ data: unidade });

      const result = await unidadesAdministrativasService.update(10, updatePayload);

      expect(mockPatch).toHaveBeenCalledWith('/unidades-administrativas/10/', updatePayload);
      expect(result).toEqual(unidade);
    });

    it('aceita payload parcial no update (sem semântica de PUT)', async () => {
      const payload = { status: 'inativa' as const };
      mockPatch.mockResolvedValueOnce({
        data: { ...unidade, status: 'inativa', status_display: 'Inativa' },
      });

      await unidadesAdministrativasService.update(10, payload);

      expect(mockPatch).toHaveBeenCalledWith('/unidades-administrativas/10/', payload);
    });

    it('envia patch mesmo com payload vazio', async () => {
      mockPatch.mockResolvedValueOnce({ data: unidade });

      await unidadesAdministrativasService.update(10, {});

      expect(mockPatch).toHaveBeenCalledWith('/unidades-administrativas/10/', {});
    });

    it('repropaga erro 400 no update para permitir tratamento por campo', async () => {
      const error = makeAxiosError(400, { codigo: ['Código inválido.'] });
      mockPatch.mockRejectedValueOnce(error);

      await expect(unidadesAdministrativasService.update(10, updatePayload)).rejects.toBe(error);
    });

    it('repropaga erro 400 mesmo quando a resposta traz detail', async () => {
      const error = makeAxiosError(400, { detail: 'Não é possível inativar.' });
      mockPatch.mockRejectedValueOnce(error);

      await expect(unidadesAdministrativasService.update(10, updatePayload)).rejects.toBe(error);
    });

    it('usa a mensagem padrão quando a resposta não tem corpo', async () => {
      mockPatch.mockRejectedValueOnce(makeAxiosError(502, null));

      await expect(
        unidadesAdministrativasService.update(10, { status: 'inativa' }),
      ).rejects.toThrow('Erro ao atualizar unidade administrativa.');
    });

    it.each([
      ['detail', makeAxiosError(403, { detail: 'Sem permissão para atualizar UA.' }), 'Sem permissão para atualizar UA.'],
      ['mensagem padrão', makeAxiosError(500), 'Erro ao atualizar unidade administrativa.'],
      ['conexão', makeAxiosError(), 'Erro de conexão com o servidor.'],
      ['erro inesperado', new Error('Falha inesperada no update'), 'Falha inesperada no update'],
    ])('trata erro de update com %s', async (_scenario, error, message) => {
      mockPatch.mockRejectedValueOnce(error);

      await expect(
        unidadesAdministrativasService.update(10, { status: 'inativa' }),
      ).rejects.toThrow(message);
    });
  });
});