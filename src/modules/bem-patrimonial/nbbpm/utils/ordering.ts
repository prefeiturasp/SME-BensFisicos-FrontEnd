/**
 * Ordenação da listagem de NBBPMs.
 *
 * Padrão de Bens Físicos: data de criação e, como desempate, número da NBBPM,
 * ambos decrescentes (mais recentes primeiro) => `-data_criacao,-numero`.
 *
 * `numero` é usado apenas como critério de desempate e não é uma coluna
 * ordenável: o sequencial reinicia a cada ano (`001.0000001/2026`), então
 * ordenar só por ele misturaria anos.
 */
export type NbbpmSortField = 'data_criacao' | 'data_autorizacao';
export type NbbpmSortDirection = 'asc' | 'desc';

export interface NbbpmSort {
  field: NbbpmSortField;
  direction: NbbpmSortDirection;
}

export const NBBPM_DEFAULT_SORT: NbbpmSort = { field: 'data_criacao', direction: 'desc' };

export function buildNbbpmOrdering({ field, direction }: Readonly<NbbpmSort>): string {
  const sign = direction === 'desc' ? '-' : '';
  return `${sign}${field},${sign}numero`;
}

/** Mesma regra das listagens irmãs: 1º clique ascendente, cliques seguintes alternam. */
export function toggleNbbpmSort(current: Readonly<NbbpmSort>, field: NbbpmSortField): NbbpmSort {
  if (current.field !== field) return { field, direction: 'asc' };
  return { field, direction: current.direction === 'asc' ? 'desc' : 'asc' };
}
