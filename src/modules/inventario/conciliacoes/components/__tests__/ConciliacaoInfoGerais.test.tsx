import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ConciliacaoInfoGerais } from '../ConciliacaoInfoGerais';
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
  criado_em: '2026-01-15T10:00:00Z',
  criado_por: 1,
  criado_por_nome: 'Maria José',
  criado_por_rf: '1234567',
  fechado_em: null,
  fechado_por: null,
  fechado_por_nome: '',
  fechado_por_rf: '',
  esta_aberto: true,
};

describe('ConciliacaoInfoGerais', () => {
  it('renderiza a secao com titulo "Informações gerais"', () => {
    render(<ConciliacaoInfoGerais conciliacao={baseConciliacao} />);

    expect(screen.getByText('Informações gerais')).toBeInTheDocument();
    expect(screen.getByTestId('conciliacao-info-gerais')).toBeInTheDocument();
  });

  it('exibe o numero, unidade administrativa, tipo, data final formatada e status', () => {
    render(<ConciliacaoInfoGerais conciliacao={baseConciliacao} />);

    expect(screen.getByLabelText('Número da Conciliação')).toHaveValue('001.0002/2026/005');
    expect(screen.getByLabelText('Unidade Administrativa')).toHaveValue('00.00.00.002 - COTIC');
    expect(screen.getByLabelText('Tipo')).toHaveValue('Eventual');
    expect(screen.getByLabelText('Data Final do Período')).toHaveValue('15/03/2026');
    expect(screen.getByTestId('conciliacao-status-em_aberto')).toBeInTheDocument();
  });

  it('exibe descricao padrao abaixo do numero da conciliacao', () => {
    render(<ConciliacaoInfoGerais conciliacao={baseConciliacao} />);

    expect(
      screen.getByText('Formato: 001.XXXX/AAAA/VVV (eventual)'),
    ).toBeInTheDocument();
  });

  it('aceita descricao customizada do numero da conciliacao', () => {
    render(
      <ConciliacaoInfoGerais
        conciliacao={baseConciliacao}
        numeroConciliacaoDescricao='Descricao customizada'
      />,
    );

    expect(screen.getByText('Descricao customizada')).toBeInTheDocument();
  });

  it('usa o nome da UA quando a sigla nao esta disponivel', () => {
    const conciliacaoSemSigla: Conciliacao = {
      ...baseConciliacao,
      unidade_administrativa_sigla: '',
    };

    render(<ConciliacaoInfoGerais conciliacao={conciliacaoSemSigla} />);

    expect(screen.getByLabelText('Unidade Administrativa')).toHaveValue('00.00.00.002 - COTIC');
  });

  it('cai para o codigo da UA quando codigo, sigla e nome nao estao disponiveis', () => {
    const conciliacaoSemSiglaENome: Conciliacao = {
      ...baseConciliacao,
      unidade_administrativa_sigla: '',
      unidade_administrativa_nome: '',
    };

    render(<ConciliacaoInfoGerais conciliacao={conciliacaoSemSiglaENome} />);

    expect(screen.getByLabelText('Unidade Administrativa')).toHaveValue('00.00.00.002');
  });

  it('renderiza o periodo final original quando nao tem o formato esperado', () => {
    const conciliacao: Conciliacao = { ...baseConciliacao, periodo_final: 'invalido' };

    render(<ConciliacaoInfoGerais conciliacao={conciliacao} />);

    expect(screen.getByLabelText('Data Final do Período')).toHaveValue('invalido');
  });

  it('renderiza string vazia quando periodo_final e vazio', () => {
    const conciliacao: Conciliacao = { ...baseConciliacao, periodo_final: '' };

    render(<ConciliacaoInfoGerais conciliacao={conciliacao} />);

    expect(screen.getByLabelText('Data Final do Período')).toHaveValue('');
  });

  it('renderiza o status fechado com o badge correto', () => {
    const conciliacao: Conciliacao = { ...baseConciliacao, status: 'fechado' };

    render(<ConciliacaoInfoGerais conciliacao={conciliacao} />);

    expect(screen.getByTestId('conciliacao-status-fechado')).toHaveTextContent('Fechada');
  });
});
