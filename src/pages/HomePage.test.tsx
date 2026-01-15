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

  describe('Renderização Estrutural e Breadcrumb', () => {
    it('deve renderizar o breadcrumb com o item "Início"', () => {
      const { container } = renderComponent();
      const homeBreadcrumb = screen.getByText('Início');
      expect(homeBreadcrumb).toBeInTheDocument();

      const homeIcon = container.querySelector('.lucide-house');
      expect(homeIcon).toBeInTheDocument();
    });

    it('o breadcrumb da home deve ser o item ativo (não clicável neste caso)', () => {
      renderComponent();
      const homeText = screen.getByText('Início');
      expect(homeText.closest('a')).toBeNull();
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
    it('todos os links navegáveis devem estar acessíveis via teclado', () => {
      renderComponent();
      const links = screen
        .getAllByRole('link')
        .filter((link) => !link.getAttribute('aria-current'));

      links.forEach((link) => {
        expect(link).toHaveClass('focus-visible:outline-none');
      });
    });

    it('os cards de atalho devem conter ícones', () => {
      const { container } = renderComponent();
      const cardIcons = container.querySelectorAll('.grid .lucide');
      expect(cardIcons).toHaveLength(expectedCards.length);
    });

    it('o breadcrumb deve conter ícones (pelo menos o ícone Home)', () => {
      const { container } = renderComponent();
      const breadcrumbIcons = container.querySelectorAll('nav[aria-label="breadcrumb"] .lucide');
      expect(breadcrumbIcons.length).toBeGreaterThanOrEqual(1);
    });
  });
});
