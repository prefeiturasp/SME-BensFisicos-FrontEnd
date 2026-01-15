import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import BensListPage from './BensListPage';

describe('BensListPage', () => {
  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <BensListPage />
      </MemoryRouter>,
    );
  };

  it('deve renderizar o título da página', () => {
    renderComponent();
    expect(screen.getByRole('heading', { name: 'Bens Patrimoniais' })).toBeInTheDocument();
  });

  it('deve renderizar o breadcrumb corretamente', () => {
    renderComponent();
    expect(screen.getByText('Início')).toBeInTheDocument();
    expect(screen.getByText('Bem Patrimonial')).toBeInTheDocument();
  });

  it('deve possuir um botão para adicionar novo bem', () => {
    renderComponent();
    const addButton = screen.getByRole('link', { name: /adicionar bem/i });
    expect(addButton).toBeInTheDocument();
    expect(addButton).toHaveAttribute('href', '/bens-patrimoniais/novo');
  });
});
