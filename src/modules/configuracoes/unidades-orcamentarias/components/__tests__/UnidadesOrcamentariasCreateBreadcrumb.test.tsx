import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { UnidadesOrcamentariasCreateBreadcrumb } from '../UnidadesOrcamentariasCreateBreadcrumb';

describe('UnidadesOrcamentariasCreateBreadcrumb', () => {
  it('exibe o caminho "Início > Unidades Orçamentárias > Adicionar Unidade Orçamentária"', () => {
    render(
      <MemoryRouter>
        <UnidadesOrcamentariasCreateBreadcrumb />
      </MemoryRouter>,
    );

    expect(screen.getByText('Início')).toBeInTheDocument();
    expect(screen.getByText('Unidades Orçamentárias')).toBeInTheDocument();
    expect(screen.getByText('Adicionar Unidade Orçamentária')).toBeInTheDocument();
    expect(screen.queryByText('Configurações')).not.toBeInTheDocument();
  });

  it('deve linkar Unidades Orçamentárias de volta para a listagem', () => {
    render(
      <MemoryRouter>
        <UnidadesOrcamentariasCreateBreadcrumb />
      </MemoryRouter>,
    );

    const link = screen.getByRole('link', { name: 'Unidades Orçamentárias' });
    expect(link).toHaveAttribute('href', '/unidades-orcamentarias');
  });
});