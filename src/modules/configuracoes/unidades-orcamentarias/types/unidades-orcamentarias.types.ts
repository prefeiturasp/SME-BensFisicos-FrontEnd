export type UnidadeOrcamentariaStatusFilter = 'todos' | 'true' | 'false';
export type UnidadeOrcamentariaExportFormat = 'csv' | 'xls' | 'xlsx' | 'pdf';

export interface UnidadeOrcamentaria {
  id: number;
  codigo: string;
  sigla: string;
  nome: string;
  ativa: boolean;
  ativa_display: string;
}

export interface CreateUnidadeOrcamentariaPayload {
  codigo: string;
  sigla: string;
  nome: string;
  ativa?: boolean;
}

export interface UpdateUnidadeOrcamentariaPayload {
  codigo?: string;
  sigla?: string;
  nome?: string;
  ativa?: boolean;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface UnidadesOrcamentariasListParams {
  page?: number;
  pageSize?: number;
  codigo?: string;
  nomeOuSigla?: string;
  ativa?: UnidadeOrcamentariaStatusFilter;
  ordering?: string;
}

export interface UnidadeOrcamentariaExportResult {
  blob: Blob;
  fileName: string;
  contentType?: string;
}

export interface HistoricoAcao {
  campo: string;
  valor_antigo: string | null;
  valor_novo: string | null;
}

export interface HistoricoGrupo {
  alterado_em: string;
  alterado_por: number | null;
  alterado_por_nome: string | null;
  acoes: HistoricoAcao[];
}