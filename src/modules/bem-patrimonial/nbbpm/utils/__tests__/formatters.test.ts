import { describe, expect, it } from 'vitest';

import { formatDataBR, formatDataHoraBR } from '../formatters';

describe('formatDataBR', () => {
  it('formata data pura sem deslocar o dia por fuso horário', () => {
    expect(formatDataBR('2026-07-17')).toBe('17/07/2026');
    expect(formatDataBR('2026-01-01')).toBe('01/01/2026');
  });

  it('retorna placeholder para vazio, nulo ou formato inválido', () => {
    expect(formatDataBR(null)).toBe('-');
    expect(formatDataBR(undefined)).toBe('-');
    expect(formatDataBR('')).toBe('-');
    expect(formatDataBR('17/07/2026')).toBe('-');
    expect(formatDataBR('2026-07-17T10:00:00Z')).toBe('-');
  });
});

describe('formatDataHoraBR', () => {
  it('formata data/hora no padrão dd/MM/yyyy - HH:mm (horário local)', () => {
    const local = new Date(2026, 6, 17, 9, 5);

    expect(formatDataHoraBR(local.toISOString())).toBe('17/07/2026 - 09:05');
  });

  it('retorna placeholder para vazio, nulo ou data inválida', () => {
    expect(formatDataHoraBR(null)).toBe('-');
    expect(formatDataHoraBR(undefined)).toBe('-');
    expect(formatDataHoraBR('')).toBe('-');
    expect(formatDataHoraBR('não é data')).toBe('-');
  });
});
