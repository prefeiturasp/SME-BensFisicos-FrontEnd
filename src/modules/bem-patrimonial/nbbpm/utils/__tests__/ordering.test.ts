import { describe, expect, it } from 'vitest';

import { NBBPM_DEFAULT_SORT, buildNbbpmOrdering, toggleNbbpmSort } from '../ordering';

describe('buildNbbpmOrdering', () => {
  it('ordenação inicial: data de criação e número da NBBPM, mais recentes primeiro', () => {
    expect(buildNbbpmOrdering(NBBPM_DEFAULT_SORT)).toBe('-data_criacao,-numero');
  });

  it('mantém o número da NBBPM como desempate na mesma direção', () => {
    expect(buildNbbpmOrdering({ field: 'data_criacao', direction: 'asc' })).toBe(
      'data_criacao,numero',
    );
    expect(buildNbbpmOrdering({ field: 'data_autorizacao', direction: 'desc' })).toBe(
      '-data_autorizacao,-numero',
    );
  });
});

describe('toggleNbbpmSort', () => {
  it('coluna nova começa ascendente', () => {
    expect(toggleNbbpmSort(NBBPM_DEFAULT_SORT, 'data_autorizacao')).toEqual({
      field: 'data_autorizacao',
      direction: 'asc',
    });
  });

  it('mesma coluna alterna a direção', () => {
    expect(toggleNbbpmSort({ field: 'data_criacao', direction: 'desc' }, 'data_criacao')).toEqual({
      field: 'data_criacao',
      direction: 'asc',
    });
    expect(toggleNbbpmSort({ field: 'data_criacao', direction: 'asc' }, 'data_criacao')).toEqual({
      field: 'data_criacao',
      direction: 'desc',
    });
  });
});
