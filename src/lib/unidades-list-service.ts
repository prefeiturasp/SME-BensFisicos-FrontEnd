import { AxiosError } from 'axios';
import { api } from '@/api/http';

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

interface PaginatedListResponse<TItem> {
  count: number;
  next: string | null;
  previous: string | null;
  results: TItem[];
}

type UnidadesListParamsShape<TStatusParam extends string, TStatus extends string> = {
  page?: number;
  pageSize?: number;
  codigo?: string;
  nomeOuSigla?: string;
  ordering?: string;
} & Partial<Record<TStatusParam, TStatus>>;

type UnidadesListExportParams<
  TStatusParam extends string,
  TStatus extends string,
  TListParams,
> = Omit<TListParams, 'page' | 'pageSize'> & Partial<Record<TStatusParam, TStatus>>;

interface CreateUnidadesListServiceOptions<TStatusParam extends string> {
  basePath: string;
  fileNamePrefix: string;
  listErrorMessage: string;
  exportErrorMessage: string;
  statusParamName: TStatusParam;
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

export function createUnidadesListService<
  TItem,
  TExportFormat extends string,
  TStatus extends string,
  TStatusParam extends string,
  TListParams extends UnidadesListParamsShape<TStatusParam, TStatus>,
>({
  basePath,
  fileNamePrefix,
  listErrorMessage,
  exportErrorMessage,
  statusParamName,
}: Readonly<
  CreateUnidadesListServiceOptions<TStatusParam>
>) {
  return {
    async list(params: TListParams = {} as TListParams): Promise<PaginatedListResponse<TItem>> {
      try {
        const query = buildListQueryParams(
          {
            page: params.page,
            pageSize: params.pageSize,
            codigo: params.codigo,
            nomeOuSigla: params.nomeOuSigla,
            statusValue: params[statusParamName],
            ordering: params.ordering,
          },
          { includePagination: true, statusParamName },
        );

        const { data } = await api.get<PaginatedListResponse<TItem>>(
          `${basePath}/?${query.toString()}`,
        );

        return data;
      } catch (error) {
        handleApiError(error, listErrorMessage);
      }
    },

    async exportar(
      formato: TExportFormat,
      params: UnidadesListExportParams<TStatusParam, TStatus, TListParams> = {} as UnidadesListExportParams<
        TStatusParam,
        TStatus,
        TListParams
      >,
    ) {
      try {
        const query = buildListQueryParams(
          {
            codigo: params.codigo,
            nomeOuSigla: params.nomeOuSigla,
            statusValue: params[statusParamName],
            ordering: params.ordering,
          },
          { includePagination: false, statusParamName },
        );
        query.set('formato', formato);

        const response = await api.get<Blob>(`${basePath}/exportar/?${query.toString()}`, {
          responseType: 'blob',
        });

        const contentDisposition = response.headers['content-disposition'];
        const contentType = response.headers['content-type'];

        return {
          blob: response.data,
          fileName:
            parseFileNameFromContentDisposition(contentDisposition) ??
            `${fileNamePrefix}.${formato}`,
          contentType,
        };
      } catch (error) {
        handleApiError(error, exportErrorMessage);
      }
    },
  };
}