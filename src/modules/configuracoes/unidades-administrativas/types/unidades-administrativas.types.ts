export type UAStatus = 'ativa' | 'inativa';
export type UAStatusFilter = 'todos' | UAStatus;
export type UnidadeAdministrativaExportFormat = 'csv' | 'xls' | 'xlsx' | 'pdf';

export interface UnidadeAdministrativa {
  id: number;
  codigo: string;
  sigla: string;
  nome: string;
  status: UAStatus;
  status_display: string;
  unidade_orcamentaria: number;
  unidade_orcamentaria_codigo: string;
  unidade_orcamentaria_nome: string;
  unidade_orcamentaria_sigla: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface UnidadesAdministrativasListParams {
  page?: number;
  pageSize?: number;
  codigo?: string;
  nomeOuSigla?: string;
  status?: UAStatusFilter;
  ordering?: string;
}

export interface CreateUnidadeAdministrativaPayload {
  unidade_orcamentaria: number;
  codigo: string;
  sigla: string;
  nome: string;
  status: UAStatus;
}

export interface UnidadeAdministrativaExportResult {
  blob: Blob;
  fileName: string;
  contentType?: string;
}
