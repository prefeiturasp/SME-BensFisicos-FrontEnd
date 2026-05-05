export type ParametroConciliacaoStatusFilter = 'todos' | 'true' | 'false';

export interface ParametroConciliacaoAnual {
  id: number;
  unidade_orcamentaria: number;
  unidade_orcamentaria_codigo: string;
  unidade_orcamentaria_nome: string;
  unidade_orcamentaria_sigla: string;
  ano_referencia: number;
  periodo_inicial: string;
  periodo_final: string;
  ativo: boolean;
  esta_vigente: boolean;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ParametrosConciliacaoListParams {
  page?: number;
  pageSize?: number;
  anoReferencia?: string;
  ativo?: ParametroConciliacaoStatusFilter;
  ordering?: string;
}

export interface ParametroConciliacaoPayload {
  unidade_orcamentaria: number;
  ano_referencia: number;
  periodo_inicial: string;
  periodo_final: string;
  ativo: boolean;
}

export type ParametroConciliacaoUpdatePayload = Partial<ParametroConciliacaoPayload>;
