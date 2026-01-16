import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import BemCreatePage from './BemCreatePage';

describe('BemCreatePage', () => {
  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <BemCreatePage />
      </MemoryRouter>,
    );
  };

  it('deve renderizar o título da página', () => {
    renderComponent();
    expect(screen.getByRole('heading', { name: /adicionar bem patrimonial/i })).toBeInTheDocument();
  });

  it('deve renderizar o breadcrumb com caminho completo', () => {
    renderComponent();
    expect(screen.getByText('Início')).toBeInTheDocument();
    expect(screen.getByText('Bem Patrimonial')).toBeInTheDocument();

    const listLink = screen.getByRole('link', { name: /Bens Patrimoniais/i });
    expect(listLink).toBeInTheDocument();
    expect(listLink).toHaveAttribute('href', '/bens-patrimoniais');

    expect(screen.getByRole('heading', { name: 'Adicionar Bem Patrimonial' })).toBeInTheDocument();
  });
});
