import { AxiosError, AxiosHeaders } from 'axios';
import type { UseFormReturn } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import {
  handleConciliacaoBadRequestError,
  handleOcorrenciaBadRequestError,
} from '../form-error-handler';
import type { ConciliacaoFormData } from '../../validators/conciliacao-form.schema';
import type { OcorrenciaFormData } from '../../validators/ocorrencia-form.schema';

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

function createConciliacaoFormMock() {
  return {
    setError: vi.fn(),
  } as unknown as UseFormReturn<ConciliacaoFormData>;
}

function createOcorrenciaFormMock() {
  return {
    setError: vi.fn(),
  } as unknown as UseFormReturn<OcorrenciaFormData>;
}

describe('handleConciliacaoBadRequestError', () => {
  it('reescreve a mensagem de duplicidade vinda do backend em non_field_errors', () => {
    const form = createConciliacaoFormMock();
    const error = buildAxiosError(400, {
      non_field_errors: [
        'Conciliação com este Unidade Administrativa, Tipo e Período Final já existe.',
      ],
    });

    const result = handleConciliacaoBadRequestError(error, form);

    expect(result.toastDescription).toBe(
      'Já existe uma conciliação cadastrada para esta Unidade Administrativa, Tipo e Período Final.',
    );
    expect(form.setError).toHaveBeenCalledWith('root.serverError', {
      type: 'server',
      message:
        'Já existe uma conciliação cadastrada para esta Unidade Administrativa, Tipo e Período Final.',
    });
  });
});

describe('handleOcorrenciaBadRequestError', () => {
  it('mapeia erro do campo "divergencia" para o form', () => {
    const form = createOcorrenciaFormMock();
    const error = buildAxiosError(400, {
      divergencia: ['Detalhe a divergência com mais clareza.'],
    });

    const result = handleOcorrenciaBadRequestError(error, form);

    expect(result.handled).toBe(true);
    expect(result.toastDescription).toBe('Detalhe a divergência com mais clareza.');
    expect(form.setError).toHaveBeenCalledWith('divergencia', {
      type: 'server',
      message: 'Detalhe a divergência com mais clareza.',
    });
  });

  it('mapeia "detail" para o erro raiz do form', () => {
    const form = createOcorrenciaFormMock();
    const error = buildAxiosError(400, {
      detail: 'Item já possui ocorrência registrada.',
    });

    const result = handleOcorrenciaBadRequestError(error, form);

    expect(result.handled).toBe(true);
    expect(result.toastDescription).toBe('Item já possui ocorrência registrada.');
    expect(form.setError).toHaveBeenCalledWith('root.serverError', {
      type: 'server',
      message: 'Item já possui ocorrência registrada.',
    });
  });

  it('prioriza "divergencia" sobre "detail" quando ambos estao presentes', () => {
    const form = createOcorrenciaFormMock();
    const error = buildAxiosError(400, {
      divergencia: ['Detalhe a divergência.'],
      detail: 'Outro erro qualquer.',
    });

    const result = handleOcorrenciaBadRequestError(error, form);

    expect(result.toastDescription).toBe('Detalhe a divergência.');
    expect(form.setError).toHaveBeenCalledWith('divergencia', expect.any(Object));
    expect(form.setError).not.toHaveBeenCalledWith('root.serverError', expect.any(Object));
  });

  it('retorna handled=false para erros fora de 400', () => {
    const form = createOcorrenciaFormMock();
    const error = buildAxiosError(500, { detail: 'Erro interno' });

    const result = handleOcorrenciaBadRequestError(error, form);

    expect(result).toEqual({ handled: false, toastDescription: '' });
    expect(form.setError).not.toHaveBeenCalled();
  });

  it('retorna handled=false para erro 400 sem divergencia nem detail', () => {
    const form = createOcorrenciaFormMock();
    const error = buildAxiosError(400, { outro_campo: 'qualquer' });

    const result = handleOcorrenciaBadRequestError(error, form);

    expect(result).toEqual({ handled: false, toastDescription: '' });
    expect(form.setError).not.toHaveBeenCalled();
  });

  it('retorna handled=false para erros que nao sao AxiosError', () => {
    const form = createOcorrenciaFormMock();

    const result = handleOcorrenciaBadRequestError(new Error('boom'), form);

    expect(result).toEqual({ handled: false, toastDescription: '' });
    expect(form.setError).not.toHaveBeenCalled();
  });
});
