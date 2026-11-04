import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { Home } from 'lucide-react';
import { ShortcutCard } from './ShortcutCard';

describe('ShortcutCard', () => {
  const defaultProps = {
    title: 'Teste Card',
    icon: Home,
    href: '/teste',
  };

  const renderComponent = (props = {}) => {
    return render(
      <MemoryRouter>
        <ShortcutCard {...defaultProps} {...props} />
      </MemoryRouter>,
    );
  };

  describe('Renderização e Conteúdo', () => {
    it('renderiza o título corretamente', () => {
      renderComponent();
      expect(screen.getByText('Teste Card')).toBeInTheDocument();
    });

    it('possui o link correto', () => {
      renderComponent();
      const link = screen.getByRole('link', { name: /navegar para teste card/i });
      expect(link).toHaveAttribute('href', '/teste');
    });
  });

  describe('Estilização e Especificações Visuais', () => {
    it('aplica classes de fundo branco (Box branco)', () => {
      renderComponent();
      const card = screen.getByText('Teste Card').closest('.bg-white');
      expect(card).toBeInTheDocument();
    });

    it('possui a barra inferior na cor verde (cor do sistema)', () => {
      const { container } = renderComponent();
      const bottomBar = container.querySelector('.bg-green-700.absolute.bottom-0');
      expect(bottomBar).toBeInTheDocument();
      expect(bottomBar).toHaveClass('h-1.5', 'w-full');
    });

    it('aplica classes adicionais passadas via props', () => {
      renderComponent({ className: 'custom-class' });
      const link = screen.getByRole('link');
      expect(link).toHaveClass('custom-class');
    });

    it('aplica classes de ícone passadas via props', () => {
      const { container } = renderComponent({ iconClassName: 'custom-icon-class' });
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('custom-icon-class');
    });
  });

  describe('Acessibilidade', () => {
    it('possui aria-label descritivo no link', () => {
      renderComponent({ title: 'Acesso Rápido' });
      const link = screen.getByRole('link');
      expect(link).toHaveAccessibleName('Navegar para Acesso Rápido');
    });

    it('ícone deve ser decorativo ou ter suporte visual', () => {
      const { container } = renderComponent();
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('suporta navegação por teclado (focus visible)', () => {
      renderComponent();
      const link = screen.getByRole('link');
      expect(link).toHaveClass('focus-visible:ring-2', 'focus-visible:ring-green-600');
    });
  });
});
