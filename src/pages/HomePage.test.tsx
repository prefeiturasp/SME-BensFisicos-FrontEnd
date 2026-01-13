import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import HomePage from './HomePage';

describe('HomePage', () => {
  it('deve renderizar o título da página ou breadcrumb de início', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Início')).toBeInTheDocument();
  });

  it('deve renderizar todos os cards de menu', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    const menuItems = [
      'Bens Patrimoniais',
      'Movimentações de Bem Patrimonial',
      'Baixas Físicas de Bens Patrimoniais',
      'Inventários Cadastrados',
    ];

    menuItems.forEach((item) => {
      expect(screen.getByText(item)).toBeInTheDocument();
    });
  });

  it('deve conter os links corretos para cada card', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Bens Patrimoniais').closest('a')).toHaveAttribute('href', '/bens');
    expect(screen.getByText('Movimentações de Bem Patrimonial').closest('a')).toHaveAttribute(
      'href',
      '/movimentacoes',
    );
    expect(screen.getByText('Baixas Físicas de Bens Patrimoniais').closest('a')).toHaveAttribute(
      'href',
      '/baixas',
    );
    expect(screen.getByText('Inventários Cadastrados').closest('a')).toHaveAttribute(
      'href',
      '/inventario',
    );
  });
});
