import { AxiosError } from 'axios';
import type { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';
import type { UnidadeAdministrativaFormData } from '../validators/unidade-administrativa-form.schema';

const FIELD_MAP: Record<string, keyof UnidadeAdministrativaFormData> = {
  codigo: 'codigoFinal',
  sigla: 'sigla',
  nome: 'nome',
  status: 'status',
};

interface HandleBadRequestOptions {
  includeUnidadeOrcamentariaError?: boolean;
}

function extractErrorMessage(value: unknown): string | null {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value) && value.length > 0) {
    return String(value[0]);
  }

  return null;
}

function setBackendFieldErrors(
  data: Record<string, unknown>,
  form: UseFormReturn<UnidadeAdministrativaFormData>,
): boolean {
  let hasFieldErrors = false;

  Object.entries(FIELD_MAP).forEach(([backendField, formField]) => {
    const message = extractErrorMessage(data[backendField]);

    if (message) {
      form.setError(formField, { type: 'server', message });
      hasFieldErrors = true;
    }
  });

  return hasFieldErrors;
}

function handleBadRequestData(
  data: Record<string, unknown>,
  form: UseFormReturn<UnidadeAdministrativaFormData>,
  options: HandleBadRequestOptions,
): boolean {
  const hasFieldErrors = setBackendFieldErrors(data, form);

  if (options.includeUnidadeOrcamentariaError) {
    const unidadeOrcamentariaError = extractErrorMessage(data.unidade_orcamentaria);
    if (unidadeOrcamentariaError) {
      form.setError('root.serverError', {
        type: 'server',
        message: unidadeOrcamentariaError,
      });
      toast.error(unidadeOrcamentariaError);
      return true;
    }
  }

  const detailError = extractErrorMessage(data.detail);
  if (detailError) {
    toast.error(detailError);
    if (!hasFieldErrors) {
      form.setError('root.serverError', { type: 'server', message: detailError });
    }
    return true;
  }

  if (hasFieldErrors) {
    toast.error('Corrija os campos destacados para continuar.');
    return true;
  }

  return false;
}

export function handleUnidadeAdministrativaBadRequestError(
  error: unknown,
  form: UseFormReturn<UnidadeAdministrativaFormData>,
  options: HandleBadRequestOptions = {},
): boolean {
  if (!(error instanceof AxiosError) || error.response?.status !== 400) {
    return false;
  }

  const rawData = error.response.data;
  if (typeof rawData !== 'object' || rawData === null) {
    return false;
  }

  return handleBadRequestData(rawData as Record<string, unknown>, form, options);
}
