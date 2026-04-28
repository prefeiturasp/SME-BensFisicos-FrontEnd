import { AxiosError } from 'axios';

interface BuildListQueryParamsParams<TStatus extends string = string> {
  page?: number;
  pageSize?: number;
  codigo?: string;
  nomeOuSigla?: string;
  statusValue?: TStatus;
  ordering?: string;
}

interface BuildListQueryParamsOptions {
  includePagination: boolean;
  statusParamName: string;
  ignoredStatusValue?: string;
}

export function buildListQueryParams<TStatus extends string>(
  params: BuildListQueryParamsParams<TStatus>,
  options: Readonly<BuildListQueryParamsOptions>,
) {
  const query = new URLSearchParams();
  const { page, pageSize, codigo, nomeOuSigla, statusValue, ordering } = params;
  const { includePagination, statusParamName, ignoredStatusValue = 'todos' } = options;

  const codigoNormalizado = codigo?.trim();
  const nomeOuSiglaNormalizado = nomeOuSigla?.trim();
  const search = [codigoNormalizado, nomeOuSiglaNormalizado].filter(Boolean).join(' ').trim();

  if (includePagination && page) {
    query.append('page', String(page));
  }

  if (includePagination && pageSize) {
    query.append('page_size', String(pageSize));
  }

  if (search) {
    query.append('search', search);
  }

  if (statusValue && statusValue !== ignoredStatusValue) {
    query.append(statusParamName, statusValue);
  }

  if (ordering) {
    query.append('ordering', ordering);
  }

  return query;
}

export function parseFileNameFromContentDisposition(contentDisposition?: string): string | null {
  if (!contentDisposition) {
    return null;
  }

  const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const simpleMatch = /filename="?([^";]+)"?/i.exec(contentDisposition);
  if (simpleMatch?.[1]) {
    return simpleMatch[1];
  }

  return null;
}

export function handleApiError(error: unknown, defaultMessage: string): never {
  if (error instanceof AxiosError) {
    if (!error.response) {
      throw new Error('Erro de conexão com o servidor.');
    }

    const { data } = error.response;

    if (data?.detail) {
      throw new Error(data.detail);
    }

    throw new Error(defaultMessage);
  }

  throw error;
}