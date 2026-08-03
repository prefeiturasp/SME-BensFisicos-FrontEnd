import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { UnidadesAdministrativasBreadcrumb } from '../UnidadesAdministrativasBreadcrumb';

describe('UnidadesAdministrativasBreadcrumb', () => {
  it('exibe o caminho "Início > Unidades Administrativas", sem o nível Configurações', () => {
    render(
      <MemoryRouter>
        <UnidadesAdministrativasBreadcrumb />
      </MemoryRouter>,
    );

    expect(screen.getByText('Início')).toBeInTheDocument();
    expect(screen.getByText('Unidades Administrativas')).toBeInTheDocument();
    expect(screen.queryByText('Configurações')).not.toBeInTheDocument();
  });

  it('exibe Unidades Administrativas como item ativo (último do breadcrumb)', () => {
    render(
      <MemoryRouter>
        <UnidadesAdministrativasBreadcrumb />
      </MemoryRouter>,
    );

    const activeItem = screen.getByText('Unidades Administrativas').closest('span');
    expect(activeItem).toHaveAttribute('aria-current', 'page');
  });
});