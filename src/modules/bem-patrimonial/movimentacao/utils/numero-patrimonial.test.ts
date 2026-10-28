import { describe, expect, it } from 'vitest';
import { formatarNP } from './numero-patrimonial';

describe('formatarNP', () => {
  it.each([
    ['', ''],
    ['abc', ''],
    ['001', '001'],
    ['0019', '001.9'],
    ['001900001001', '001.900001001'],
    ['0019000010011', '001.900001001-1'],
    ['001.900001001-1', '001.900001001-1'],
    ['0019000010011999', '001.900001001-1'],
  ])('formata %s como %s', (entrada, esperado) => {
    expect(formatarNP(entrada)).toBe(esperado);
  });
});
