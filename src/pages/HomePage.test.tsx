import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import HomePage from './HomePage';

describe('HomePage', () => {
  const expectedCards = [
    { title: 'Bens Patrimoniais', href: '/bens' },
    { title: 'Movimentações de Bem Patrimonial', href: '/movimentacoes' },
    { title: 'Baixas Físicas de Bens Patrimoniais', href: '/baixas' },
    { title: 'Inventários Cadastrados', href: '/inventario' },
  ];

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );
  };

  describe('Renderização Estrutural', () => {
    it('deve renderizar o breadcrumb/cabeçalho "Início"', () => {
      renderComponent();
      expect(screen.getByText('Início')).toBeInTheDocument();
      expect(screen.getByText('Início').closest('div')?.querySelector('svg')).toHaveClass(
        'lucide-house',
      );
    });

    it('deve renderizar o grid container com as classes de responsividade corretas', () => {
      const { container } = renderComponent();
      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass(
        'grid-cols-1',
        'md:grid-cols-2',
        'lg:grid-cols-4',
        'gap-6',
        'md:gap-10',
      );
    });
  });

  describe('Cards de Acesso Rápido', () => {
    it('deve renderizar a quantidade correta de cards', () => {
      renderComponent();
      const cards = screen.getAllByRole('link', { name: /Navegar para/i });
      expect(cards).toHaveLength(expectedCards.length);
    });

    it('cada card deve ter o título correto', () => {
      renderComponent();
      expectedCards.forEach((card) => {
        expect(screen.getByText(card.title)).toBeInTheDocument();
      });
    });

    it('cada card deve redirecionar para a rota correta', () => {
      renderComponent();
      expectedCards.forEach((card) => {
        const link = screen.getByRole('link', {
          name: new RegExp(`Navegar para ${card.title}`, 'i'),
        });
        expect(link).toHaveAttribute('href', card.href);
      });
    });
  });

  describe('Acessibilidade e Usabilidade', () => {
    it('todos os links devem estar acessíveis via teclado', () => {
      renderComponent();
      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveClass('focus-visible:outline-none');
      });
    });

    it('deve utilizar ícones semanticos corretos para cada item', () => {
      const { container } = renderComponent();
      const svgs = container.querySelectorAll('.grid a svg');
      expect(svgs).toHaveLength(expectedCards.length);
    });
  });
});
