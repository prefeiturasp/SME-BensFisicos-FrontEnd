import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ParametrosConciliacaoTable } from '../ParametrosConciliacaoTable';
import type { ParametroConciliacaoAnual } from '../../types/parametros-conciliacao-anual.types';

const parametro: ParametroConciliacaoAnual = {
  id: 4,
  unidade_orcamentaria: 9,
  unidade_orcamentaria_codigo: '01.16.10',
  unidade_orcamentaria_nome: 'SECRETARIA MUNICIPAL DE EDUCACAO',
  unidade_orcamentaria_sigla: 'SME',
  ano_referencia: 2026,
  periodo_inicial: '2026-04-01',
  periodo_final: '2026-04-30',
  ativo: false,
  esta_vigente: false,
};

describe('ParametrosConciliacaoTable', () => {
  it('exibe estado de carregamento e vazio', () => {
    const props = {
      parametros: [],
      loading: true,
      page: 1,
      pages: [],
      totalPages: 1,
      onPageChange: vi.fn(),
      onSort: vi.fn(),
      onView: vi.fn(),
    };

    const { rerender } = render(<ParametrosConciliacaoTable {...props} />);

    expect(screen.getByText(/Carregando/)).toBeInTheDocument();

    rerender(<ParametrosConciliacaoTable {...props} loading={false} />);

    expect(screen.getByText(/Nenhum/)).toBeInTheDocument();
  });

  it('dispara ordenacao, visualizacao e paginacao', () => {
    const onSort = vi.fn();
    const onView = vi.fn();
    const onPageChange = vi.fn();

    render(
      <ParametrosConciliacaoTable
        parametros={[parametro]}
        loading={false}
        page={2}
        pages={[
          { type: 'page', id: '1', value: 1 },
          { type: 'ellipsis', id: 'ellipsis-1' },
          { type: 'page', id: '2', value: 2 },
          { type: 'page', id: '3', value: 3 },
        ]}
        totalPages={3}
        onPageChange={onPageChange}
        onSort={onSort}
        onView={onView}
      />,
    );

    expect(screen.getByText('Inativo')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Status/i }));
    fireEvent.click(screen.getByRole('button', { name: /Visualizar/i }));
    fireEvent.click(screen.getByRole('button', { name: '1' }));
    fireEvent.click(screen.getByRole('button', { name: /anterior/i }));
    fireEvent.click(screen.getByRole('button', { name: /pr.xima/i }));

    expect(onSort).toHaveBeenCalledWith('ativo');
    expect(onView).toHaveBeenCalledWith(4);
    expect(onPageChange).toHaveBeenCalledWith(1);
    expect(onPageChange).toHaveBeenCalledWith(3);
    expect(screen.getByText('...')).toBeInTheDocument();
  });
});
