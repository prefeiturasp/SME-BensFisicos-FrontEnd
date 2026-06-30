import { AxiosError } from 'axios';
import type { UseFormReturn } from 'react-hook-form';
import type { ConciliacaoFormData } from '../validators/conciliacao-form.schema';

const FIELD_MAP: Record<string, keyof ConciliacaoFormData> = {
  unidade_administrativa: 'periodoFinal',
  periodo_final: 'periodoFinal',
};

const FIELD_ERROR_MESSAGE = 'Data final do período da conciliação.';

const ERROR_TOAST_TITLE = 'Não foi possível criar a conciliação.';

function extractMessage(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.length > 0) return String(value[0]);
  return null;
}

export interface ConciliacaoBadRequestResult {
  handled: boolean;
  toastDescription: string;
}

export function handleConciliacaoBadRequestError(
  error: unknown,
  form: UseFormReturn<ConciliacaoFormData>,
): ConciliacaoBadRequestResult {
  if (!(error instanceof AxiosError) || error.response?.status !== 400) {
    return { handled: false, toastDescription: '' };
  }

  const data = error.response.data;
  if (typeof data !== 'object' || data === null) {
    return { handled: false, toastDescription: '' };
  }

  const obj = data as Record<string, unknown>;
  let firstFieldMessage: string | null = null;
  let hasFieldError = false;

  for (const [backendField, formField] of Object.entries(FIELD_MAP)) {
    if (!formField) continue;
    const message = extractMessage(obj[backendField]);
    if (message) {
      form.setError(formField, { type: 'server', message: FIELD_ERROR_MESSAGE });
      if (!firstFieldMessage) {
        firstFieldMessage = message;
      }
      hasFieldError = true;
    }
  }

  if (hasFieldError && firstFieldMessage) {
    return { handled: true, toastDescription: firstFieldMessage };
  }

  const nonFieldMessage = extractMessage(obj.non_field_errors) || extractMessage(obj.detail);

  if (nonFieldMessage) {
    form.setError('root.serverError', { type: 'server', message: nonFieldMessage });
    return { handled: true, toastDescription: nonFieldMessage };
  }

  return { handled: false, toastDescription: '' };
}

export const CONCILIACAO_ERROR_TOAST_TITLE = ERROR_TOAST_TITLE;
