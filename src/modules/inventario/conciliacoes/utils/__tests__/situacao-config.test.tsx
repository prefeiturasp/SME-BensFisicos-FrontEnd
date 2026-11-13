import { describe, expect, it } from 'vitest';
import {
  deveExibirSeloLaudado,
  isBemLaudadoParaBaixa,
  LAUDADO_PARA_BAIXA_LABEL,
  LAUDADO_PARA_BAIXA_VISUAL_CONFIG,
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
      expect(SITUACAO_VISUAL_CONFIG[situacao].messageBorderClassName).toMatch(/border/);
    }
  });

  it('getSituacaoVisualConfig retorna a mesma referencia do mapa', () => {
    expect(getSituacaoVisualConfig('divergente')).toBe(SITUACAO_VISUAL_CONFIG.divergente);
  });

  it('expoe configuracao visual do laudado distinta do processo comum', () => {
    expect(LAUDADO_PARA_BAIXA_LABEL).toBe('Laudado para Baixa');
    expect(LAUDADO_PARA_BAIXA_VISUAL_CONFIG.label).toBe('Laudado para Baixa');
    expect(LAUDADO_PARA_BAIXA_VISUAL_CONFIG.badgeClassName).toMatch(/border/);
    expect(LAUDADO_PARA_BAIXA_VISUAL_CONFIG.badgeClassName).not.toBe(
      SITUACAO_VISUAL_CONFIG.em_processo_de_baixa_fisica.badgeClassName,
    );
    expect(isBemLaudadoParaBaixa('laudado_para_baixa')).toBe(true);
    expect(isBemLaudadoParaBaixa('aprovado')).toBe(false);
    expect(isBemLaudadoParaBaixa(null)).toBe(false);
  });

  it('so exibe selo laudado em processo de baixa, nunca com encontrado', () => {
    expect(deveExibirSeloLaudado('em_processo_de_baixa_fisica', 'laudado_para_baixa', true)).toBe(
      true,
    );
    expect(deveExibirSeloLaudado('encontrado_sem_divergencia', 'laudado_para_baixa', true)).toBe(
      false,
    );
    expect(deveExibirSeloLaudado('em_processo_de_baixa_fisica', 'aprovado', true)).toBe(false);
    expect(deveExibirSeloLaudado(null, 'laudado_para_baixa', true)).toBe(false);
  });

  it('esconde selo laudado em fechada', () => {
    expect(deveExibirSeloLaudado('em_processo_de_baixa_fisica', 'laudado_para_baixa', true)).toBe(
      true,
    );
    expect(deveExibirSeloLaudado('em_processo_de_baixa_fisica', 'laudado_para_baixa', false)).toBe(
      false,
    );
    expect(deveExibirSeloLaudado('em_processo_de_baixa_fisica', 'laudado_para_baixa')).toBe(false);
    expect(
      deveExibirSeloLaudado('em_processo_de_baixa_fisica', 'laudado_para_baixa', undefined),
    ).toBe(false);
  });
});
