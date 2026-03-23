import { AxiosError } from 'axios';
import { api } from '@/api/http';
import type {
  PaginatedResponse,
  UnidadeAdministrativaExportFormat,
  UnidadeAdministrativaExportResult,
  UnidadeAdministrativa,
  UnidadesAdministrativasListParams,
} from '../types/unidades-administrativas.types';

export const unidadesAdministrativasService = {
  async list(
    params: UnidadesAdministrativasListParams = {},
  ): Promise<PaginatedResponse<UnidadeAdministrativa>> {
    try {
      const query = buildQueryParams(params, { includePagination: true });

      const { data } = await api.get<PaginatedResponse<UnidadeAdministrativa>>(
        `/unidades-administrativas/?${query.toString()}`,
      );

      return data;
    } catch (error) {
      handleApiError(error, 'Erro ao listar unidades administrativas');
    }
  },

  async exportar(
    formato: UnidadeAdministrativaExportFormat,
    params: Omit<UnidadesAdministrativasListParams, 'page' | 'pageSize'> = {},
  ): Promise<UnidadeAdministrativaExportResult> {
    try {
      const query = buildQueryParams(params, { includePagination: false });
      query.set('formato', formato);

      const response = await api.get<Blob>(
        `/unidades-administrativas/exportar/?${query.toString()}`,
        {
          responseType: 'blob',
        },
      );

      const contentDisposition = response.headers['content-disposition'];
      const contentType = response.headers['content-type'];

      return {
        blob: response.data,
        fileName:
          parseFileNameFromContentDisposition(contentDisposition) ??
          `unidades-administrativas.${formato}`,
        contentType,
      };
    } catch (error) {
      handleApiError(error, 'Erro ao exportar unidades administrativas');
    }
  },
};

function buildQueryParams(
  params: UnidadesAdministrativasListParams,
  options: { includePagination: boolean },
) {
  const query = new URLSearchParams();
  const { page, pageSize, codigo, nomeOuSigla, status = 'todos', ordering } = params;

  const codigoNormalizado = codigo?.trim();
  const nomeOuSiglaNormalizado = nomeOuSigla?.trim();
  const search = [codigoNormalizado, nomeOuSiglaNormalizado].filter(Boolean).join(' ').trim();

  if (options.includePagination && page) {
    query.append('page', String(page));
  }

  if (options.includePagination && pageSize) {
    query.append('page_size', String(pageSize));
  }

  if (search) {
    query.append('search', search);
  }

  if (status !== 'todos') {
    query.append('status', status);
  }

  if (ordering) {
    query.append('ordering', ordering);
  }

  return query;
}

function parseFileNameFromContentDisposition(contentDisposition?: string): string | null {
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

function handleApiError(error: unknown, defaultMessage: string): never {
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
