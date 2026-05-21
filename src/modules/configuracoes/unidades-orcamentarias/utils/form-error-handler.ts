import type { UseFormReturn } from 'react-hook-form';
import { handleMappedBadRequestError } from '@/lib/backend-form-errors';
import type { UnidadeOrcamentariaFormData } from '../validators/unidade-orcamentaria-form.schema';

const FIELD_MAP: Record<string, keyof UnidadeOrcamentariaFormData> = {
  codigo: 'codigo',
  sigla: 'sigla',
  nome: 'nome',
  sigla_orgao: 'sigla_orgao',
  orgao: 'orgao',
  codigo_orgao: 'codigo_orgao',
  ativa: 'status',
};

export function handleUnidadeOrcamentariaBadRequestError(
  error: unknown,
  form: UseFormReturn<UnidadeOrcamentariaFormData>,
): boolean {
  return handleMappedBadRequestError(error, {
    form,
    fieldMap: FIELD_MAP,
  });
}