import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import MovimentacoesListPage from './MovimentacoesListPage';

describe('MovimentacoesListPage', () => {
  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <MovimentacoesListPage />
      </MemoryRouter>,
    );
  };

  it('deve renderizar o título da página', () => {
    renderComponent();
    expect(
      screen.getByRole('heading', { name: /movimentações de bem patrimonial/i }),
    ).toBeInTheDocument();
  });

  it('deve renderizar o breadcrumb', () => {
    renderComponent();
    expect(screen.getByText('Início')).toBeInTheDocument();
    expect(screen.getByText('Bem Patrimonial')).toBeInTheDocument();
    expect(screen.getByText('Movimentações')).toBeInTheDocument();
  });
});
