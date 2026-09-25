import type {
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
}

export type NbbpmPaginatedResponse = PaginatedResponse<NbbpmListItem>;

export interface NbbpmListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  ordering?: string;
}
