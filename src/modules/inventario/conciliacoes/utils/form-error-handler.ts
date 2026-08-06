import { AxiosError } from 'axios';
import type { UseFormReturn } from 'react-hook-form';
import { extractErrorMessage } from '@/lib/backend-form-errors';
import type { ConciliacaoFormData } from '../validators/conciliacao-form.schema';
import type { OcorrenciaFormData } from '../validators/ocorrencia-form.schema';

const FIELD_MAP: Record<string, keyof ConciliacaoFormData> = {
  unidade_administrativa: 'periodoFinal',
  periodo_final: 'periodoFinal',
};

const FIELD_ERROR_MESSAGE = 'Data final do período da conciliação.';

const ERROR_TOAST_TITLE = 'Não foi possível criar a conciliação.';

const DUPLICATE_CONCILIACAO_BACKEND_SIGNATURE =
  'Unidade Administrativa, Tipo e Período Final';

const DUPLICATE_CONCILIACAO_MESSAGE =
  'Já existe uma conciliação cadastrada para esta Unidade Administrativa, Tipo e Período Final.';

function normalizeNonFieldMessage(message: string): string {
  if (message.includes(DUPLICATE_CONCILIACAO_BACKEND_SIGNATURE)) {
    return DUPLICATE_CONCILIACAO_MESSAGE;
  }

  return message;
}

export { extractErrorMessage as extractMessage } from '@/lib/backend-form-errors';

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
    const message = extractErrorMessage(obj[backendField]);
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

  const nonFieldMessage =
    extractErrorMessage(obj.non_field_errors) || extractErrorMessage(obj.detail);

  if (nonFieldMessage) {
    const displayMessage = normalizeNonFieldMessage(nonFieldMessage);
    form.setError('root.serverError', { type: 'server', message: displayMessage });
    return { handled: true, toastDescription: displayMessage };
  }

  return { handled: false, toastDescription: '' };
}

export const CONCILIACAO_ERROR_TOAST_TITLE = ERROR_TOAST_TITLE;

export const OCORRENCIA_ERROR_TOAST_TITLE = 'Não foi possível registrar a ocorrência.';

export interface OcorrenciaBadRequestResult {
  handled: boolean;
  toastDescription: string;
}

export function handleOcorrenciaBadRequestError(
  error: unknown,
  form: UseFormReturn<OcorrenciaFormData>,
): OcorrenciaBadRequestResult {
  if (!(error instanceof AxiosError) || error.response?.status !== 400) {
    return { handled: false, toastDescription: '' };
  }

  const data = error.response.data;
  if (typeof data !== 'object' || data === null) {
    return { handled: false, toastDescription: '' };
  }

  const obj = data as Record<string, unknown>;

  const divergenciaMsg = extractErrorMessage(obj.divergencia);
  if (divergenciaMsg) {
    form.setError('divergencia', { type: 'server', message: divergenciaMsg });
    return { handled: true, toastDescription: divergenciaMsg };
  }

  const detailMsg = extractErrorMessage(obj.detail);
  if (detailMsg) {
    form.setError('root.serverError', { type: 'server', message: detailMsg });
    return { handled: true, toastDescription: detailMsg };
  }

  return { handled: false, toastDescription: '' };
}
