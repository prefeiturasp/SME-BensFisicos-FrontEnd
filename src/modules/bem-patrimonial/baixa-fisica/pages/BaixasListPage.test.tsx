import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import BaixasListPage from './BaixasListPage';

describe('BaixasListPage', () => {
  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <BaixasListPage />
      </MemoryRouter>,
    );
  };

  it('deve renderizar o título da página', () => {
    renderComponent();
    expect(screen.getByRole('heading', { name: /baixas físicas/i })).toBeInTheDocument();
  });

  it('deve renderizar o breadcrumb', () => {
    renderComponent();
    expect(screen.getByText('Início')).toBeInTheDocument();
    expect(screen.getByText('Bem Patrimonial')).toBeInTheDocument();
    expect(screen.getByText('Baixas Físicas', { selector: 'span' })).toBeInTheDocument();
  });
});
