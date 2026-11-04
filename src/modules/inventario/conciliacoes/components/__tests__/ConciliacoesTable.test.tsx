import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConciliacoesTable } from '../ConciliacoesTable';
import type { Conciliacao } from '../../types/conciliacoes.types';

const baseConciliacao: Conciliacao = {
  id: 5,
  numero_conciliacao: '001.0002/2026/005',
  unidade_administrativa: 7,
  unidade_administrativa_codigo: '00.00.00.002',
  unidade_administrativa_nome: 'COTIC',
  unidade_administrativa_sigla: 'COTIC',
  unidade_orcamentaria_codigo: '00.00.00',
  unidade_orcamentaria_nome: 'SME',
  tipo: 'eventual',
  tipo_display: 'Eventual',
  periodo_final: '2026-02-27',
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
  criado_por_nome: 'Teste',
  criado_por_rf: '1234567',
  fechado_em: null,
  fechado_por: null,
  fechado_por_nome: '',
  fechado_por_rf: '',
  esta_aberto: true,
};

function makeConciliacao(overrides: Partial<Conciliacao> = {}): Conciliacao {
  return { ...baseConciliacao, ...overrides };
}

describe('ConciliacoesTable', () => {
  it('exibe estado de carregamento e vazio', () => {
    const props = {
      conciliacoes: [],
      loading: true,
      page: 1,
      pages: [],
      totalPages: 1,
      onPageChange: vi.fn(),
      onSort: vi.fn(),
      onView: vi.fn(),
    };

    const { rerender } = render(<ConciliacoesTable {...props} />);

    expect(screen.getByText(/Carregando concilia/i)).toBeInTheDocument();

    rerender(<ConciliacoesTable {...props} loading={false} />);

    expect(screen.getByText(/Nenhuma conciliação encontrada/i)).toBeInTheDocument();
  });

  it('renderiza os dados formatados da conciliacao', () => {
    render(
      <ConciliacoesTable
        conciliacoes={[baseConciliacao]}
        loading={false}
        page={1}
        pages={[{ type: 'page', id: '1', value: 1 }]}
        totalPages={1}
        onPageChange={vi.fn()}
        onSort={vi.fn()}
        onView={vi.fn()}
      />,
    );

    expect(screen.getByText('001.0002/2026/005')).toBeInTheDocument();
    expect(screen.getByText('00.00.00.002 - COTIC')).toBeInTheDocument();
    expect(screen.getByText('Até 27/02/2026')).toBeInTheDocument();
    expect(screen.getByTestId('conciliacoes-itens-trigger')).toHaveTextContent('11 itens');
    expect(screen.getByTestId('conciliacao-tipo-eventual')).toBeInTheDocument();
    expect(screen.getByTestId('conciliacao-status-em_aberto')).toBeInTheDocument();
  });

  it('dispara onSort, onView e onPageChange', () => {
    const onSort = vi.fn();
    const onView = vi.fn();
    const onPageChange = vi.fn();

    render(
      <ConciliacoesTable
        conciliacoes={[baseConciliacao]}
        loading={false}
        page={1}
        pages={[
          { type: 'page', id: '1', value: 1 },
          { type: 'page', id: '2', value: 2 },
        ]}
        totalPages={2}
        onPageChange={onPageChange}
        onSort={onSort}
        onView={onView}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Tipo/i }));
    fireEvent.click(screen.getByRole('button', { name: /Status/i }));
    fireEvent.click(
      screen.getByRole('button', {
        name: /Visualizar conciliação 001\.0002\/2026\/005/i,
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: '2' }));

    expect(onSort).toHaveBeenCalledWith('tipo');
    expect(onSort).toHaveBeenCalledWith('status');
    expect(onView).toHaveBeenCalledWith(5);
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('renderiza multiplas conciliacoes com chaves corretas', () => {
    const c1 = makeConciliacao({ id: 10, numero_conciliacao: '001.0002/2026/010' });
    const c2 = makeConciliacao({
      id: 11,
      numero_conciliacao: '001.0002/2026/011',
      tipo: 'anual',
      status: 'fechado',
    });

    render(
      <ConciliacoesTable
        conciliacoes={[c1, c2]}
        loading={false}
        page={1}
        pages={[{ type: 'page', id: '1', value: 1 }]}
        totalPages={1}
        onPageChange={vi.fn()}
        onSort={vi.fn()}
        onView={vi.fn()}
      />,
    );

    expect(screen.getByText('001.0002/2026/010')).toBeInTheDocument();
    expect(screen.getByText('001.0002/2026/011')).toBeInTheDocument();
    expect(screen.getAllByTestId('conciliacoes-itens-trigger')).toHaveLength(2);
    expect(screen.getByTestId('conciliacao-tipo-anual')).toBeInTheDocument();
    expect(screen.getByTestId('conciliacao-status-fechado')).toBeInTheDocument();
  });

  it('usa sigla da UA quando disponivel', () => {
    render(
      <ConciliacoesTable
        conciliacoes={[baseConciliacao]}
        loading={false}
        page={1}
        pages={[{ type: 'page', id: '1', value: 1 }]}
        totalPages={1}
        onPageChange={vi.fn()}
        onSort={vi.fn()}
        onView={vi.fn()}
      />,
    );

    expect(screen.getByText('00.00.00.002 - COTIC')).toBeInTheDocument();
  });

  it('cai para o nome da UA quando sigla nao esta disponivel', () => {
    const conciliacaoSemSigla = makeConciliacao({
      id: 99,
      unidade_administrativa_sigla: '',
    });

    render(
      <ConciliacoesTable
        conciliacoes={[conciliacaoSemSigla]}
        loading={false}
        page={1}
        pages={[{ type: 'page', id: '1', value: 1 }]}
        totalPages={1}
        onPageChange={vi.fn()}
        onSort={vi.fn()}
        onView={vi.fn()}
      />,
    );

    expect(screen.getByText('00.00.00.002 - COTIC')).toBeInTheDocument();
  });

  it('renderiza string vazia quando periodo_final e vazio', () => {
    const c = makeConciliacao({ id: 50, periodo_final: '' });

    render(
      <ConciliacoesTable
        conciliacoes={[c]}
        loading={false}
        page={1}
        pages={[{ type: 'page', id: '1', value: 1 }]}
        totalPages={1}
        onPageChange={vi.fn()}
        onSort={vi.fn()}
        onView={vi.fn()}
      />,
    );

    const cells = document.querySelectorAll('tbody td');
    const periodoCell = cells[3];
    expect(periodoCell?.textContent).toBe('');
  });

  it('renderiza a string original quando periodo_final nao tem o formato esperado', () => {
    const c = makeConciliacao({ id: 51, periodo_final: 'invalido' });

    render(
      <ConciliacoesTable
        conciliacoes={[c]}
        loading={false}
        page={1}
        pages={[{ type: 'page', id: '1', value: 1 }]}
        totalPages={1}
        onPageChange={vi.fn()}
        onSort={vi.fn()}
        onView={vi.fn()}
      />,
    );

    expect(screen.getByText('invalido')).toBeInTheDocument();
  });

  it('mantem apenas um card de itens aberto por vez', async () => {
    const c1 = makeConciliacao({ id: 10, numero_conciliacao: '001.0002/2026/010' });
    const c2 = makeConciliacao({ id: 11, numero_conciliacao: '001.0002/2026/011' });

    render(
      <ConciliacoesTable
        conciliacoes={[c1, c2]}
        loading={false}
        page={1}
        pages={[{ type: 'page', id: '1', value: 1 }]}
        totalPages={1}
        onPageChange={vi.fn()}
        onSort={vi.fn()}
        onView={vi.fn()}
      />,
    );

    const triggers = screen.getAllByTestId('conciliacoes-itens-trigger');

    fireEvent.click(triggers[0]);
    await waitFor(() => {
      expect(screen.getByTestId('conciliacoes-itens-popover-10')).toBeInTheDocument();
    });

    fireEvent.click(triggers[1]);
    await waitFor(() => {
      expect(screen.getByTestId('conciliacoes-itens-popover-11')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('conciliacoes-itens-popover-10')).not.toBeInTheDocument();
  });
});
