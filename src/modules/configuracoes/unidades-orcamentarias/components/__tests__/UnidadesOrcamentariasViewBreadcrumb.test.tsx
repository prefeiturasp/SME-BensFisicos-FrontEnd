import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { UnidadesOrcamentariasViewBreadcrumb } from '../UnidadesOrcamentariasViewBreadcrumb';

describe('UnidadesOrcamentariasViewBreadcrumb', () => {
  it('exibe "Visualizar Unidade Orçamentária" quando não está editando', () => {
    render(
      <MemoryRouter>
        <UnidadesOrcamentariasViewBreadcrumb isEditing={false} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Início')).toBeInTheDocument();
    expect(screen.getByText('Unidades Orçamentárias')).toBeInTheDocument();
    expect(screen.getByText('Visualizar Unidade Orçamentária')).toBeInTheDocument();
    expect(screen.queryByText('Configurações')).not.toBeInTheDocument();
  });

  it('exibe "Editar Unidade Orçamentária" quando está editando', () => {
    render(
      <MemoryRouter>
        <UnidadesOrcamentariasViewBreadcrumb isEditing={true} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Editar Unidade Orçamentária')).toBeInTheDocument();
  });

  it('deve linkar Unidades Orçamentárias de volta para a listagem', () => {
    render(
      <MemoryRouter>
        <UnidadesOrcamentariasViewBreadcrumb isEditing={false} />
      </MemoryRouter>,
    );

    const link = screen.getByRole('link', { name: 'Unidades Orçamentárias' });
    expect(link).toHaveAttribute('href', '/unidades-orcamentarias');
  });
});