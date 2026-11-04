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

export type ConciliacaoItemSituacao =
  | 'encontrado_sem_divergencia'
  | 'encontrado'
  | 'nao_encontrado'
  | 'divergente'
  | 'em_processo_de_baixa_fisica'
  | 'baixa_fisica';

export type ConciliacaoItemSituacaoFilter = ('todos' | ConciliacaoItemSituacao)[];

export type ConciliacaoItemSortableField =
  | 'id'
  | 'atualizado_em'
  | 'situacao'
  | 'bem__numero_patrimonial'
  | 'bem__nome';

export interface ConciliacaoItemBem {
  id: number;
  numero_patrimonial: string;
  nome: string;
  descricao: string;
  marca: string;
  modelo: string;
  valor_unitario: string;
  status: string;
  localizacao: string;
  bloqueado_conciliacao: boolean;
}

export interface ConciliacaoOcorrencia {
  id: number;
  situacao: ConciliacaoItemSituacao;
  situacao_display: string;
  observacao: string;
  divergencia: string;
  registrado_por: number;
  registrado_por_nome: string;
  registrado_por_rf: string;
  registrado_em: string;
}

export interface ConciliacaoItem {
  id: number;
  conciliacao: number;
  conciliacao_numero: string;
  conciliacao_status: ConciliacaoStatus;
  unidade_administrativa: number;
  unidade_administrativa_sigla: string;
  bem: ConciliacaoItemBem;
  situacao: ConciliacaoItemSituacao;
  situacao_display: string;
  observacao: string;
  divergencia: string;
  tem_ocorrencia: boolean;
  permite_registrar_ocorrencia: boolean;
  atualizado_por: number | null;
  atualizado_por_nome: string;
  atualizado_em: string;
}

export interface ConciliacaoItemDetail extends ConciliacaoItem {
  pode_marcar_como_encontrado: boolean;
  pode_resolver_situacao: boolean;
  conciliacao_esta_aberto: boolean;
  ocorrencias: ConciliacaoOcorrencia[];
}

export interface ConciliacaoSituacaoDisponivel {
  value: ConciliacaoItemSituacao;
  label: string;
}

export interface ConciliacaoOcorrenciaPayload {
  situacao: ConciliacaoItemSituacao;
  observacao?: string;
  divergencia?: string;
}

export interface PaginatedConciliacaoItens {
  count: number;
  next: string | null;
  previous: string | null;
  results: ConciliacaoItem[];
}

export interface ConciliacaoItensListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  numeroPatrimonial?: string;
  nome?: string;
  situacao?: ConciliacaoItemSituacaoFilter;
  ordering?: string;
}

export interface ConciliacaoHistoricoAcao {
  campo: string;
  valor_antigo: string;
  valor_novo: string;
  justificativa: string;
}

export interface ConciliacaoHistoricoGrupo {
  alterado_em: string;
  alterado_por: number;
  alterado_por_nome: string;
  acoes: ConciliacaoHistoricoAcao[];
}
