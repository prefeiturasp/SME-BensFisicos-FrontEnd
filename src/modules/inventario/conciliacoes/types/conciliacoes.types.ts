export interface CreateConciliacaoPayload {
  unidade_administrativa: number;
  periodo_final: string;
  tipo?: 'eventual';
}

export type ConciliacaoTipo = 'anual' | 'eventual';

export type ConciliacaoStatus = 'em_aberto' | 'fechado' | 'fechado_admin';

export type ConciliacaoTipoFilter = 'todos' | ConciliacaoTipo;

export type ConciliacaoStatusFilter = 'todos' | ConciliacaoStatus;

export type ConciliacaoSortableField =
  | 'id'
  | 'criado_em'
  | 'periodo_final'
  | 'status'
  | 'tipo'
  | 'unidade_administrativa__codigo'
  | 'unidade_administrativa__sigla'
  | 'unidade_administrativa__nome';

export interface ConciliacaoResumoSituacoes {
  encontrados: number;
  nao_encontrados: number;
  divergentes: number;
  em_processo_baixa: number;
  baixa_fisica: number;
  encontrados_com_divergencia: number;
}

export interface Conciliacao {
  id: number;
  numero_conciliacao: string;
  unidade_administrativa: number;
  unidade_administrativa_codigo: string;
  unidade_administrativa_nome: string;
  unidade_administrativa_sigla: string;
  unidade_orcamentaria_codigo: string;
  unidade_orcamentaria_nome: string;
  tipo: ConciliacaoTipo;
  tipo_display: string;
  periodo_final: string;
  status: ConciliacaoStatus;
  status_display: string;
  total_itens: number;
  resumo_situacoes: ConciliacaoResumoSituacoes;
  ano_vigencia: number;
  criado_em: string;
  criado_por: number;
  criado_por_nome: string;
  criado_por_rf: string;
  fechado_em: string | null;
  fechado_por: number | null;
  fechado_por_nome: string;
  fechado_por_rf: string;
  esta_aberto: boolean;
}

export interface PaginatedConciliacoes {
  count: number;
  next: string | null;
  previous: string | null;
  results: Conciliacao[];
}

export interface ConciliacoesListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  anoVigencia?: string;
  tipo?: ConciliacaoTipoFilter;
  status?: ConciliacaoStatusFilter;
  ordering?: string;
}
