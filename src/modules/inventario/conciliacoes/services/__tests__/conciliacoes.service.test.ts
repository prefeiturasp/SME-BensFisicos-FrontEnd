import { AxiosError } from 'axios';
import type { MockInstance } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/api/http';
import { conciliacoesService } from '../conciliacoes.service';

vi.mock('@/api/http', () => ({
  api: {
    post: vi.fn(),
  },
}));

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

describe('conciliacoesService', () => {
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
