import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import InventarioListPage from './InventarioListPage';

describe('InventarioListPage', () => {
  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <InventarioListPage />
      </MemoryRouter>,
    );
  };

  it('deve renderizar o título da página', () => {
    renderComponent();
    expect(screen.getByRole('heading', { name: 'Inventários' })).toBeInTheDocument();
  });

  it('deve renderizar o breadcrumb', () => {
    renderComponent();
    expect(screen.getByText('Início')).toBeInTheDocument();
    expect(screen.getByText('Inventário')).toBeInTheDocument();
    expect(screen.getByText('Inventários', { selector: 'span' })).toBeInTheDocument();
  });
});
