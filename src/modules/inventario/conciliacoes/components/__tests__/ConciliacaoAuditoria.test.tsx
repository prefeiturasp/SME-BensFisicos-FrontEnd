import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ConciliacaoAuditoria } from '../ConciliacaoAuditoria';
import type { Conciliacao } from '../../types/conciliacoes.types';

const baseConciliacao: Conciliacao = {
  id: 1,
  numero_conciliacao: '001.0002/2026/005',
  unidade_administrativa: 7,
  unidade_administrativa_codigo: '00.00.00.002',
  unidade_administrativa_nome: 'COTIC',
  unidade_administrativa_sigla: 'COTIC',
  unidade_orcamentaria_codigo: '00.00.00',
  unidade_orcamentaria_nome: 'SME',
  tipo: 'eventual',
  tipo_display: 'Eventual',
  periodo_final: '2026-03-15',
  status: 'em_aberto',
  status_display: 'Aberta',
  total_itens: 11,
  resumo_situacoes: {
    encontrados: 1,
    nao_encontrados: 3,
    divergentes: 3,
    em_processo_baixa: 3,
    baixa_fisica: 1,
    encontrados_com_divergencia: 0,
  },
  ano_vigencia: 2026,
  criado_em: '2026-03-10T15:24:00Z',
  criado_por: 1,
  criado_por_nome: 'Maria José',
  criado_por_rf: '1234567',
  fechado_em: null,
  fechado_por: null,
  fechado_por_nome: '',
  fechado_por_rf: '',
  esta_aberto: true,
};

describe('ConciliacaoAuditoria', () => {
  it('renderiza a secao com titulo "Auditoria"', () => {
    render(<ConciliacaoAuditoria conciliacao={baseConciliacao} />);

    expect(screen.getByText('Auditoria')).toBeInTheDocument();
    expect(screen.getByTestId('conciliacao-auditoria')).toBeInTheDocument();
  });

  it('exibe "Criado por" com nome e RF', () => {
    render(<ConciliacaoAuditoria conciliacao={baseConciliacao} />);

    expect(screen.getByTestId('conciliacao-auditoria-criado-por')).toHaveTextContent(
      'Maria José (RF 1234567)',
    );
  });

  it('exibe "Criado em" formatado em portugues', () => {
    const criadoEmFormatter = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    const horaFormatter = new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const data = new Date(baseConciliacao.criado_em);
    const dataEsperada = criadoEmFormatter.format(data);
    const horaEsperada = horaFormatter.format(data);

    render(<ConciliacaoAuditoria conciliacao={baseConciliacao} />);

    const criadoEm = screen.getByTestId('conciliacao-auditoria-criado-em');
    expect(criadoEm.textContent).toContain(dataEsperada);
    expect(criadoEm.textContent).toContain(horaEsperada);
  });

  it('exibe "Fechado por" e "Fechado em" como "-" quando a conciliacao esta em aberto', () => {
    render(<ConciliacaoAuditoria conciliacao={baseConciliacao} />);

    expect(screen.getByTestId('conciliacao-auditoria-fechado-por')).toHaveTextContent('-');
    expect(screen.getByTestId('conciliacao-auditoria-fechado-em')).toHaveTextContent('-');
  });

  it('exibe "Fechado por" e "Fechado em" quando a conciliacao esta fechada', () => {
    const fechadoEmValor = '2026-04-01T10:30:00Z';
    const data = new Date(fechadoEmValor);
    const dataEsperada = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(data);
    const horaEsperada = new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(data);

    const conciliacaoFechada: Conciliacao = {
      ...baseConciliacao,
      fechado_em: fechadoEmValor,
      fechado_por: 2,
      fechado_por_nome: 'João da Silva',
      fechado_por_rf: '7654321',
      esta_aberto: false,
      status: 'fechado',
      status_display: 'Fechada',
    };

    render(<ConciliacaoAuditoria conciliacao={conciliacaoFechada} />);

    expect(screen.getByTestId('conciliacao-auditoria-fechado-por')).toHaveTextContent(
      'João da Silva (RF 7654321)',
    );

    const fechadoEm = screen.getByTestId('conciliacao-auditoria-fechado-em');
    expect(fechadoEm.textContent).toContain(dataEsperada);
    expect(fechadoEm.textContent).toContain(horaEsperada);
  });

  it('mostra apenas o nome quando o RF nao esta disponivel', () => {
    const conciliacao: Conciliacao = {
      ...baseConciliacao,
      criado_por_nome: 'Maria José',
      criado_por_rf: '',
    };

    render(<ConciliacaoAuditoria conciliacao={conciliacao} />);

    expect(screen.getByTestId('conciliacao-auditoria-criado-por')).toHaveTextContent(
      'Maria José',
    );
  });

  it('mostra apenas o RF quando o nome nao esta disponivel', () => {
    const conciliacao: Conciliacao = {
      ...baseConciliacao,
      criado_por_nome: '',
      criado_por_rf: '1234567',
    };

    render(<ConciliacaoAuditoria conciliacao={conciliacao} />);

    expect(screen.getByTestId('conciliacao-auditoria-criado-por')).toHaveTextContent(
      'RF 1234567',
    );
  });

  it('exibe "-" quando nao ha informacoes do criador', () => {
    const conciliacao: Conciliacao = {
      ...baseConciliacao,
      criado_por_nome: '',
      criado_por_rf: '',
    };

    render(<ConciliacaoAuditoria conciliacao={conciliacao} />);

    expect(screen.getByTestId('conciliacao-auditoria-criado-por')).toHaveTextContent('-');
  });

  it('exibe "-" quando data de criacao e invalida', () => {
    const conciliacao: Conciliacao = {
      ...baseConciliacao,
      criado_em: 'data-invalida',
    };

    render(<ConciliacaoAuditoria conciliacao={conciliacao} />);

    expect(screen.getByTestId('conciliacao-auditoria-criado-em')).toHaveTextContent('-');
  });
});
