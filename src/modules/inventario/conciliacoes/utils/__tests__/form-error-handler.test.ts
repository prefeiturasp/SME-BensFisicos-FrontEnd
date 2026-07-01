import { AxiosError, AxiosHeaders } from 'axios';
import type { UseFormReturn } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import { handleConciliacaoBadRequestError } from '../form-error-handler';
import type { ConciliacaoFormData } from '../../validators/conciliacao-form.schema';

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
  } as unknown as UseFormReturn<ConciliacaoFormData>;
}

describe('handleConciliacaoBadRequestError', () => {
  it('reescreve a mensagem de duplicidade vinda do backend em non_field_errors', () => {
    const form = createFormMock();
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
