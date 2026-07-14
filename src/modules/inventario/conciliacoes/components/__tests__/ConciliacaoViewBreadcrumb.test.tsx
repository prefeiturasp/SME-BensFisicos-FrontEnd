import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ConciliacaoViewBreadcrumb } from '../ConciliacaoViewBreadcrumb';

describe('ConciliacaoViewBreadcrumb', () => {
  it('renderiza a trilha com Início, Inventário, Gerenciamento e Visualizar Conciliação', () => {
    render(
      <MemoryRouter>
        <ConciliacaoViewBreadcrumb />
      </MemoryRouter>,
    );

    expect(screen.getByText('Início')).toBeInTheDocument();
    expect(screen.getByText('Inventário')).toBeInTheDocument();
    expect(screen.getByText('Gerenciamento de Conciliações')).toBeInTheDocument();
    expect(screen.getByText('Visualizar Conciliação')).toBeInTheDocument();
  });

  it('marca o item "Visualizar Conciliação" como ativo', () => {
    render(
      <MemoryRouter>
        <ConciliacaoViewBreadcrumb />
      </MemoryRouter>,
    );

    const activeItem = screen.getByText('Visualizar Conciliação');
    expect(activeItem.closest('a, span')).toHaveClass('text-green-800');
  });
});
