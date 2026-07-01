export interface CreateConciliacaoPayload {
  unidade_administrativa: number;
  periodo_final: string;
  tipo?: 'eventual';
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
  tipo: 'anual' | 'eventual';
  tipo_display: string;
  periodo_final: string;
  status: 'em_aberto' | 'fechado' | 'fechado_admin';
  status_display: string;
  total_itens: number;
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
