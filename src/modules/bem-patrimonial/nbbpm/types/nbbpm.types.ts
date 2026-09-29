import type {
  BemPatrimonialSimple,
  PaginatedResponse,
  UnidadeAdministrativaSimple,
  UsuarioSimple,
} from '../../baixa-fisica/types/baixas-fisicas.types';

/**
 * Item da listagem de NBBPMs — espelha `NBBPMSerializer` do backend
 * (GET /nbbpm/). A listagem é somente leitura: nenhum campo é editável.
 */
export interface NbbpmListItem {
  id: number;
  /** Número gerado pelo sistema, formato `001.0000001/2026`. */
  numero: string;
  /** IDs das Baixas Físicas vinculadas (vínculo NBBPM → Baixa Física). */
  baixas: number[];
  /**
   * UA da primeira Baixa vinculada (regra do backend: todas as Baixas de uma
   * NBBPM pertencem à mesma UO). Nulo apenas se a NBBPM não tiver Baixa.
   */
  unidade_administrativa_origem: UnidadeAdministrativaSimple | null;
  numero_processo_baixa: string;
  /** Data pura (`YYYY-MM-DD`), sem horário. */
  data_autorizacao: string;
  responsavel: string;
  numero_processo_destinacao_final: string;
  criado_por: UsuarioSimple;
  /** Data/hora de geração (ISO 8601). */
  data_criacao: string;
  /**
   * Regra de processo para reemissão, calculada pelo backend. Quando ausente,
   * o front assume que a reemissão é permitida (o backend valida de qualquer forma).
   */
  pode_reemitir?: boolean;
}

/** Dados mínimos de uma NBBPM para obter/reemitir o documento. */
export type NbbpmDocumentoRef = Pick<NbbpmListItem, 'id' | 'numero'>;

export type NbbpmPaginatedResponse = PaginatedResponse<NbbpmListItem>;

export interface NbbpmListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  ordering?: string;
}

/**
 * Item (bem) que compunha uma Baixa Física no momento da geração da NBBPM —
 * espelha a composição registrada, não o estado atual do bem.
 */
export interface NbbpmBaixaItemSnapshot {
  id: number;
  bem: BemPatrimonialSimple;
}

/**
 * Uma das Baixas Físicas vinculadas à NBBPM, com sua própria Unidade
 * Administrativa e os bens que a compunham — uma mesma NBBPM pode reunir
 * Baixas de UAs diferentes, então a UA vem por Baixa, não pela nota inteira.
 */
export interface NbbpmBaixaDetail {
  id: number;
  numero_processo_baixa: string | null;
  unidade_administrativa_origem: UnidadeAdministrativaSimple;
  itens: NbbpmBaixaItemSnapshot[];
}

/**
 * Detalhe completo de uma NBBPM — espelha o retorno de `GET /nbbpm/{id}/`.
 * Somente leitura: nenhum campo é editável a partir do detalhe.
 */
export interface NbbpmDetail {
  id: number;
  numero: string;
  numero_processo_baixa: string;
  data_autorizacao: string;
  responsavel: string;
  numero_processo_destinacao_final: string;
  criado_por: UsuarioSimple;
  data_criacao: string;
  /** Ver `NbbpmListItem.pode_reemitir`. */
  pode_reemitir?: boolean;
  baixas: NbbpmBaixaDetail[];
}
