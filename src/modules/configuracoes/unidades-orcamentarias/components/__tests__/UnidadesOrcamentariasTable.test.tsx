import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UnidadesOrcamentariasTable } from '../UnidadesOrcamentariasTable';
import type { UnidadeOrcamentaria } from '../../types/unidades-orcamentarias.types';

const UNIDADE_FIXTURE: UnidadeOrcamentaria = {
  id: 1,
  codigo: '10.10.10',
  sigla: 'UO1',
  nome: 'Unidade Orçamentária 1',
  ativa: true,
  ativa_display: 'Ativa',
};

describe('UnidadesOrcamentariasTable', () => {
  it('renderiza mensagem de loading', () => {
    render(
      <UnidadesOrcamentariasTable
        unidades={[]}
        loading
        page={1}
        pages={[{ type: 'page', value: 1, id: 'page-1' }]}
        totalPages={1}
        onPageChange={vi.fn()}
        onSort={vi.fn()}
        onView={vi.fn()}
      />,
    );

    expect(screen.getByText('Carregando unidades orçamentárias...')).toBeInTheDocument();
  });

  it('renderiza estado vazio quando não há registros', () => {
    render(
      <UnidadesOrcamentariasTable
        unidades={[]}
        loading={false}
        page={1}
        pages={[{ type: 'page', value: 1, id: 'page-1' }]}
        totalPages={1}
        onPageChange={vi.fn()}
        onSort={vi.fn()}
        onView={vi.fn()}
      />,
    );

    expect(screen.getByText('Nenhuma unidade orçamentária encontrada.')).toBeInTheDocument();
  });

  it('renderiza linha da unidade e ação de visualizar', () => {
    const onView = vi.fn();

    render(
      <UnidadesOrcamentariasTable
        unidades={[UNIDADE_FIXTURE]}
        loading={false}
        page={1}
        pages={[{ type: 'page', value: 1, id: 'page-1' }]}
        totalPages={1}
        onPageChange={vi.fn()}
        onSort={vi.fn()}
        onView={onView}
      />,
    );

    expect(screen.getByText('10.10.10')).toBeInTheDocument();
    expect(screen.getByText('Unidade Orçamentária 1')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Visualizar unidade orçamentária Unidade Orçamentária 1'));
    expect(onView).toHaveBeenCalledWith(1);
  });

  it('dispara ordenação e paginação', () => {
    const onSort = vi.fn();
    const onPageChange = vi.fn();

    render(
      <UnidadesOrcamentariasTable
        unidades={[UNIDADE_FIXTURE]}
        loading={false}
        page={2}
        pages={[
          { type: 'page', value: 1, id: 'page-1' },
          { type: 'ellipsis', id: 'ellipsis-1' },
          { type: 'page', value: 2, id: 'page-2' },
          { type: 'page', value: 3, id: 'page-3' },
        ]}
        totalPages={3}
        onPageChange={onPageChange}
        onSort={onSort}
        onView={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Código' }));
    fireEvent.click(screen.getByRole('button', { name: 'Página anterior' }));
    fireEvent.click(screen.getByRole('button', { name: 'Próxima página' }));
    fireEvent.click(screen.getByRole('button', { name: '3' }));

    expect(onSort).toHaveBeenCalledWith('codigo');
    expect(onPageChange).toHaveBeenCalledWith(1);
    expect(onPageChange).toHaveBeenCalledWith(3);
  });
});