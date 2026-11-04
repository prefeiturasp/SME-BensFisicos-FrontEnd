import type { UseFormReturn } from 'react-hook-form';
import { handleMappedBadRequestError } from '@/lib/backend-form-errors';
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

export function handleUnidadeAdministrativaBadRequestError(
  error: unknown,
  form: UseFormReturn<UnidadeAdministrativaFormData>,
  options: HandleBadRequestOptions = {},
): boolean {
  return handleMappedBadRequestError(error, {
    form,
    fieldMap: FIELD_MAP,
    rootErrorFields: options.includeUnidadeOrcamentariaError ? ['unidade_orcamentaria'] : [],
  });
}
