import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { UnidadesAdministrativasViewBreadcrumb } from '../UnidadesAdministrativasViewBreadcrumb';

describe('UnidadesAdministrativasViewBreadcrumb', () => {
  it('exibe "Visualizar Unidade Administrativa" quando não está editando', () => {
    render(
      <MemoryRouter>
        <UnidadesAdministrativasViewBreadcrumb isEditing={false} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Início')).toBeInTheDocument();
    expect(screen.getByText('Unidades Administrativas')).toBeInTheDocument();
    expect(screen.getByText('Visualizar Unidade Administrativa')).toBeInTheDocument();
    expect(screen.queryByText('Configurações')).not.toBeInTheDocument();
  });

  it('exibe "Editar Unidade Administrativa" quando está editando', () => {
    render(
      <MemoryRouter>
        <UnidadesAdministrativasViewBreadcrumb isEditing={true} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Editar Unidade Administrativa')).toBeInTheDocument();
  });

  it('deve linkar Unidades Administrativas de volta para a listagem', () => {
    render(
      <MemoryRouter>
        <UnidadesAdministrativasViewBreadcrumb isEditing={false} />
      </MemoryRouter>,
    );

    const link = screen.getByRole('link', { name: 'Unidades Administrativas' });
    expect(link).toHaveAttribute('href', '/unidades-administrativas');
  });
});