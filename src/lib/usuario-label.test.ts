import { describe, expect, it } from 'vitest';

import {
  AUTORIA_INDISPONIVEL_LABEL,
  formatUsuarioLabel,
  formatUsuarioObjetoLabel,
  isAutoriaIndisponivel,
  AUTORIA_AUTOMATICA_LABEL,
  formatAutoriaConciliacao,
  isAutoriaAutomatica,
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
    expect(formatUsuarioLabel(null, null)).toBe(AUTORIA_INDISPONIVEL_LABEL);
    expect(formatUsuarioLabel(undefined, undefined)).toBe(AUTORIA_INDISPONIVEL_LABEL);
    expect(formatUsuarioLabel('  ', '  ')).toBe(AUTORIA_INDISPONIVEL_LABEL);
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
    expect(formatUsuarioObjetoLabel(null)).toBe(AUTORIA_INDISPONIVEL_LABEL);
    expect(formatUsuarioObjetoLabel(undefined)).toBe(AUTORIA_INDISPONIVEL_LABEL);
    expect(formatUsuarioObjetoLabel({})).toBe(AUTORIA_INDISPONIVEL_LABEL);
  });
});

describe('isAutoriaIndisponivel', () => {
  it('identifica o rotulo de excecao conhecida', () => {
    expect(isAutoriaIndisponivel(AUTORIA_INDISPONIVEL_LABEL)).toBe(true);
    expect(isAutoriaIndisponivel('Maria da Silva (RF 1234567)')).toBe(false);
  });
});

describe('texto neutro de indisponibilidade', () => {
  it('nao atribui a ausencia a migracao', () => {
    // A causa do vazio varia por modulo; afirmar migracao mascararia uma
    // eventual falha atual de gravacao.
    expect(AUTORIA_INDISPONIVEL_LABEL).toBe('Informação não disponível');
    expect(AUTORIA_INDISPONIVEL_LABEL).not.toMatch(/migra/i);
  });

  it('nao usa texto de migracao para Baixa e Transferencia', () => {
    // Nesses modulos criado_por e null=False: vazio e inconsistencia, nunca
    // dado historico.
    expect(formatUsuarioObjetoLabel(null)).not.toMatch(/migra/i);
    expect(formatUsuarioObjetoLabel({})).toBe(AUTORIA_INDISPONIVEL_LABEL);
  });
});

describe('formatAutoriaConciliacao', () => {
  it('nomeia a origem automatica quando nao ha autor', () => {
    expect(formatAutoriaConciliacao(null, null, true)).toBe(AUTORIA_AUTOMATICA_LABEL);
    expect(AUTORIA_AUTOMATICA_LABEL).not.toMatch(/migra/i);
  });

  it('usa texto neutro quando a origem automatica nao se aplica', () => {
    expect(formatAutoriaConciliacao(null, null, false)).toBe(AUTORIA_INDISPONIVEL_LABEL);
  });

  it('preserva a autoria real mesmo em conciliacao anual', () => {
    expect(formatAutoriaConciliacao('Maria da Silva', '1234567', true)).toBe(
      'Maria da Silva (RF 1234567)',
    );
  });
});

describe('isAutoriaAutomatica', () => {
  it('distingue origem automatica de indisponibilidade generica', () => {
    expect(isAutoriaAutomatica(AUTORIA_AUTOMATICA_LABEL)).toBe(true);
    expect(isAutoriaAutomatica(AUTORIA_INDISPONIVEL_LABEL)).toBe(false);
    // Ambas contam como ausencia de autoria para fins de estilo.
    expect(isAutoriaIndisponivel(AUTORIA_AUTOMATICA_LABEL)).toBe(true);
  });
});
