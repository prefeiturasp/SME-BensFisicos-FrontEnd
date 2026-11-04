import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UnidadesAdministrativasTable } from '../UnidadesAdministrativasTable';
import type { UnidadeAdministrativa } from '../../types/unidades-administrativas.types';

const UNIDADE_FIXTURE: UnidadeAdministrativa = {
  id: 1,
  codigo: '01.16.10.286',
  sigla: 'GAB',
  nome: 'Gabinete do Secretário',
  status: 'ativa',
  status_display: 'Ativa',
  unidade_orcamentaria: 1,
  unidade_orcamentaria_codigo: '01.16.10',
  unidade_orcamentaria_nome: 'SME',
  unidade_orcamentaria_sigla: 'SME',
  created_at: '2026-03-18T10:00:00-03:00',
  updated_at: '2026-03-18T10:00:00-03:00',
};

describe('UnidadesAdministrativasTable', () => {
  it('renderiza mensagem de loading', () => {
    render(
      <UnidadesAdministrativasTable
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

    expect(screen.getByText('Carregando unidades administrativas...')).toBeInTheDocument();
  });

  it('renderiza linha da unidade e ação de visualizar para operador', () => {
    const onView = vi.fn();

    render(
      <UnidadesAdministrativasTable
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

    expect(screen.getByText('01.16.10.286')).toBeInTheDocument();
    expect(screen.getByText('Gabinete do Secretário')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Visualizar unidade Gabinete do Secretário'));
    expect(onView).toHaveBeenCalledWith(1);
  });

  it('dispara ordenação e paginação', () => {
    const onSort = vi.fn();
    const onPageChange = vi.fn();

    render(
      <UnidadesAdministrativasTable
        unidades={[UNIDADE_FIXTURE]}
        loading={false}
        page={2}
        pages={[
          { type: 'page', value: 1, id: 'page-1' },
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
