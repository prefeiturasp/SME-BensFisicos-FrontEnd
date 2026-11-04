import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { UnidadesOrcamentariasBreadcrumb } from '../UnidadesOrcamentariasBreadcrumb';

describe('UnidadesOrcamentariasBreadcrumb', () => {
  it('exibe o caminho "Início > Unidades Orçamentárias", sem o nível Configurações', () => {
    render(
      <MemoryRouter>
        <UnidadesOrcamentariasBreadcrumb />
      </MemoryRouter>,
    );

    expect(screen.getByText('Início')).toBeInTheDocument();
    expect(screen.getByText('Unidades Orçamentárias')).toBeInTheDocument();
    expect(screen.queryByText('Configurações')).not.toBeInTheDocument();
  });

  it('exibe Unidades Orçamentárias como item ativo (último do breadcrumb)', () => {
    render(
      <MemoryRouter>
        <UnidadesOrcamentariasBreadcrumb />
      </MemoryRouter>,
    );

    const activeItem = screen.getByText('Unidades Orçamentárias').closest('span');
    expect(activeItem).toHaveAttribute('aria-current', 'page');
  });
});