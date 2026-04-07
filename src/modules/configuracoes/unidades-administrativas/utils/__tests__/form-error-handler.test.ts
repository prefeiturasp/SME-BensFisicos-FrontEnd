import { AxiosError, AxiosHeaders } from 'axios';
import type { UseFormReturn } from 'react-hook-form';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { toast } from 'sonner';
import { handleUnidadeAdministrativaBadRequestError } from '../form-error-handler';
import type { UnidadeAdministrativaFormData } from '../../validators/unidade-administrativa-form.schema';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

function buildAxiosError(status: number, data: unknown) {
  const error = new AxiosError('Request failed');
  error.response = {
    status,
    statusText: String(status),
    headers: {},
    data,
    config: { headers: new AxiosHeaders() },
  };
  return error;
}

function createFormMock() {
  return {
    setError: vi.fn(),
  } as unknown as UseFormReturn<UnidadeAdministrativaFormData>;
}

describe('form-error-handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna false para erro que não é AxiosError 400', () => {
    const form = createFormMock();

    const handled = handleUnidadeAdministrativaBadRequestError(new Error('falha'), form);

    expect(handled).toBe(false);
    expect(form.setError).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('retorna false para AxiosError com status diferente de 400', () => {
    const form = createFormMock();
    const error = buildAxiosError(403, { detail: 'Sem permissão' });

    const handled = handleUnidadeAdministrativaBadRequestError(error, form);

    expect(handled).toBe(false);
    expect(form.setError).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('mapeia erros de campo e mostra toast padrão', () => {
    const form = createFormMock();
    const error = buildAxiosError(400, {
      codigo: ['Código inválido.'],
      sigla: ['Sigla inválida.'],
    });

    const handled = handleUnidadeAdministrativaBadRequestError(error, form);

    expect(handled).toBe(true);
    expect(form.setError).toHaveBeenCalledWith('codigoFinal', {
      type: 'server',
      message: 'Código inválido.',
    });
    expect(form.setError).toHaveBeenCalledWith('sigla', {
      type: 'server',
      message: 'Sigla inválida.',
    });
    expect(toast.error).toHaveBeenCalledWith('Corrija os campos destacados para continuar.');
  });

  it('mapeia detail como erro raiz quando não há erro de campo', () => {
    const form = createFormMock();
    const error = buildAxiosError(400, {
      detail: 'Erro de regra de negócio.',
    });

    const handled = handleUnidadeAdministrativaBadRequestError(error, form);

    expect(handled).toBe(true);
    expect(form.setError).toHaveBeenCalledWith('root.serverError', {
      type: 'server',
      message: 'Erro de regra de negócio.',
    });
    expect(toast.error).toHaveBeenCalledWith('Erro de regra de negócio.');
  });

  it('mapeia erro de unidade_orcamentaria quando opção está ativa', () => {
    const form = createFormMock();
    const error = buildAxiosError(400, {
      unidade_orcamentaria: ['Unidade orçamentária fora do escopo.'],
    });

    const handled = handleUnidadeAdministrativaBadRequestError(error, form, {
      includeUnidadeOrcamentariaError: true,
    });

    expect(handled).toBe(true);
    expect(form.setError).toHaveBeenCalledWith('root.serverError', {
      type: 'server',
      message: 'Unidade orçamentária fora do escopo.',
    });
    expect(toast.error).toHaveBeenCalledWith('Unidade orçamentária fora do escopo.');
  });

  it('retorna false quando payload 400 não tem estrutura tratável', () => {
    const form = createFormMock();
    const error = buildAxiosError(400, null);

    const handled = handleUnidadeAdministrativaBadRequestError(error, form);

    expect(handled).toBe(false);
    expect(form.setError).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });
});
