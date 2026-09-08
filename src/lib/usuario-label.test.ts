import { describe, expect, it } from 'vitest';

import {
  INFORMACAO_INDISPONIVEL_LABEL,
  formatUsuarioLabel,
  formatUsuarioObjetoLabel,
  isAutoriaIndisponivel,
} from './usuario-label';

describe('formatUsuarioLabel', () => {
  it('monta "Nome completo (RF)" quando ambos existem', () => {
    expect(formatUsuarioLabel('Maria da Silva', '1234567')).toBe('Maria da Silva (RF 1234567)');
  });

  it('ignora espacos em branco ao redor dos valores', () => {
    expect(formatUsuarioLabel('  Maria da Silva  ', ' 1234567 ')).toBe(
      'Maria da Silva (RF 1234567)',
    );
  });

  it('exibe apenas o nome quando nao ha RF', () => {
    expect(formatUsuarioLabel('Maria da Silva', null)).toBe('Maria da Silva');
    expect(formatUsuarioLabel('Maria da Silva', '   ')).toBe('Maria da Silva');
  });

  it('exibe apenas o RF quando nao ha nome', () => {
    expect(formatUsuarioLabel(null, '1234567')).toBe('RF 1234567');
    expect(formatUsuarioLabel('', '1234567')).toBe('RF 1234567');
  });

  it('retorna a excecao conhecida quando nao ha nenhuma informacao', () => {
    expect(formatUsuarioLabel(null, null)).toBe(INFORMACAO_INDISPONIVEL_LABEL);
    expect(formatUsuarioLabel(undefined, undefined)).toBe(INFORMACAO_INDISPONIVEL_LABEL);
    expect(formatUsuarioLabel('  ', '  ')).toBe(INFORMACAO_INDISPONIVEL_LABEL);
  });

  it('nao usa "-" para mascarar a ausencia da informacao', () => {
    expect(formatUsuarioLabel(null, null)).not.toBe('-');
  });
});

describe('formatUsuarioObjetoLabel', () => {
  it('prioriza nome_completo', () => {
    expect(
      formatUsuarioObjetoLabel({
        nome_completo: 'Joao Souza',
        username: 'jsouza',
        rf: '7654321',
      }),
    ).toBe('Joao Souza (RF 7654321)');
  });

  it('usa nome como alternativa ao nome_completo', () => {
    expect(formatUsuarioObjetoLabel({ nome: 'Joao Souza', rf: '7654321' })).toBe(
      'Joao Souza (RF 7654321)',
    );
  });

  it('cai para username quando nao ha nome, sem promover username a RF', () => {
    expect(formatUsuarioObjetoLabel({ username: 'jsouza' })).toBe('jsouza');
  });

  it('retorna a excecao conhecida quando o usuario e nulo', () => {
    expect(formatUsuarioObjetoLabel(null)).toBe(INFORMACAO_INDISPONIVEL_LABEL);
    expect(formatUsuarioObjetoLabel(undefined)).toBe(INFORMACAO_INDISPONIVEL_LABEL);
    expect(formatUsuarioObjetoLabel({})).toBe(INFORMACAO_INDISPONIVEL_LABEL);
  });
});

describe('isAutoriaIndisponivel', () => {
  it('identifica o rotulo de excecao conhecida', () => {
    expect(isAutoriaIndisponivel(INFORMACAO_INDISPONIVEL_LABEL)).toBe(true);
    expect(isAutoriaIndisponivel('Maria da Silva (RF 1234567)')).toBe(false);
  });
});