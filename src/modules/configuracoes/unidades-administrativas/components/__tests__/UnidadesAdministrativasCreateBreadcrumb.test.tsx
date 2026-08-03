import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { UnidadesAdministrativasCreateBreadcrumb } from '../UnidadesAdministrativasCreateBreadcrumb';

describe('UnidadesAdministrativasCreateBreadcrumb', () => {
  it('exibe o caminho "Início > Unidades Administrativas > Adicionar Unidade Administrativa"', () => {
    render(
      <MemoryRouter>
        <UnidadesAdministrativasCreateBreadcrumb />
      </MemoryRouter>,
    );

    expect(screen.getByText('Início')).toBeInTheDocument();
    expect(screen.getByText('Unidades Administrativas')).toBeInTheDocument();
    expect(screen.getByText('Adicionar Unidade Administrativa')).toBeInTheDocument();
    expect(screen.queryByText('Configurações')).not.toBeInTheDocument();
  });

  it('deve linkar Unidades Administrativas de volta para a listagem', () => {
    render(
      <MemoryRouter>
        <UnidadesAdministrativasCreateBreadcrumb />
      </MemoryRouter>,
    );

    const link = screen.getByRole('link', { name: 'Unidades Administrativas' });
    expect(link).toHaveAttribute('href', '/unidades-administrativas');
  });
});