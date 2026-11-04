import { describe, expect, it } from 'vitest';
import {
  SITUACAO_VISUAL_CONFIG,
  getSituacaoVisualConfig,
} from '../situacao-config';

describe('situacao-config', () => {
  it('expoe configuracao visual para todas as situacoes conhecidas', () => {
    const situacoes: Array<keyof typeof SITUACAO_VISUAL_CONFIG> = [
      'encontrado_sem_divergencia',
      'encontrado',
      'nao_encontrado',
      'divergente',
      'em_processo_de_baixa_fisica',
      'baixa_fisica',
    ];

    for (const situacao of situacoes) {
      expect(SITUACAO_VISUAL_CONFIG[situacao]).toBeDefined();
      expect(SITUACAO_VISUAL_CONFIG[situacao].label.length).toBeGreaterThan(0);
      expect(SITUACAO_VISUAL_CONFIG[situacao].badgeClassName).toMatch(/border/);
      expect(SITUACAO_VISUAL_CONFIG[situacao].dotClassName).toMatch(/^bg-/);
      expect(SITUACAO_VISUAL_CONFIG[situacao].messageBorderClassName).toMatch(
        /border/,
      );
    }
  });

  it('getSituacaoVisualConfig retorna a mesma referencia do mapa', () => {
    expect(getSituacaoVisualConfig('divergente')).toBe(
      SITUACAO_VISUAL_CONFIG.divergente,
    );
  });
});
