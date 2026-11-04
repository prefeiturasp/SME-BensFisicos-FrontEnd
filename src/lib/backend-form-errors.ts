import { AxiosError } from 'axios';
import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

type BackendFieldMap<TFieldValues extends FieldValues> = Partial<Record<string, Path<TFieldValues>>>;

interface HandleMappedBadRequestErrorOptions<TFieldValues extends FieldValues> {
  form: UseFormReturn<TFieldValues>;
  fieldMap: BackendFieldMap<TFieldValues>;
  rootErrorFields?: string[];
}

export function extractErrorMessage(value: unknown): string | null {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value) && value.length > 0) {
    const messages = value
      .map(item => extractErrorMessage(item))
      .filter((message): message is string => Boolean(message));

    return messages.length > 0 ? messages.join(' ') : null;
  }

  if (typeof value === 'object' && value !== null) {
    const messages = Object.values(value)
      .map(item => extractErrorMessage(item))
      .filter((message): message is string => Boolean(message));

    return messages.length > 0 ? [...new Set(messages)].join(' ') : null;
  }

  return null;
}

function setMappedFieldErrors<TFieldValues extends FieldValues>(
  data: Record<string, unknown>,
  form: UseFormReturn<TFieldValues>,
  fieldMap: BackendFieldMap<TFieldValues>,
): boolean {
  let hasFieldErrors = false;

  Object.entries(fieldMap).forEach(([backendField, formField]) => {
    if (!formField) {
      return;
    }

    const message = extractErrorMessage(data[backendField]);

    if (!message) {
      return;
    }

    form.setError(formField, { type: 'server', message });
    hasFieldErrors = true;
  });

  return hasFieldErrors;
}

export function handleMappedBadRequestError<TFieldValues extends FieldValues>(
  error: unknown,
  { form, fieldMap, rootErrorFields = [] }: HandleMappedBadRequestErrorOptions<TFieldValues>,
): boolean {
  if (!(error instanceof AxiosError) || error.response?.status !== 400) {
    return false;
  }

  const rawData = error.response.data;
  if (typeof rawData !== 'object' || rawData === null) {
    return false;
  }

  const data = rawData as Record<string, unknown>;
  const hasFieldErrors = setMappedFieldErrors(data, form, fieldMap);

  const rootMessages = rootErrorFields
    .map(fieldName => extractErrorMessage(data[fieldName]))
    .filter((message): message is string => Boolean(message));
  const detailError = extractErrorMessage(data.detail);
  if (detailError) rootMessages.push(detailError);

  if (rootMessages.length > 0) {
    const message = [...new Set(rootMessages)].join(' ');
    form.setError('root.serverError' as Path<TFieldValues>, {
      type: 'server',
      message,
    });
    toast.error(message);
    return true;
  }

  if (hasFieldErrors) {
    toast.error('Corrija os campos destacados para continuar.');
    return true;
  }

  return false;
}
