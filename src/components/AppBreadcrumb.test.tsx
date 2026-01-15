import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { AppBreadcrumb } from './AppBreadcrumb';
import { Boxes } from 'lucide-react';
import userEvent from '@testing-library/user-event';

describe('AppBreadcrumb', () => {
  const renderComponent = (props = {}) => {
    return render(
      <MemoryRouter>
        <AppBreadcrumb {...props} />
      </MemoryRouter>,
    );
  };

  describe('Renderização e Comportamento', () => {
    it('renderiza item "Início" como link quando há outros itens', () => {
      const { container } = renderComponent({ items: [{ label: 'Outro', to: '/outro' }] });

      const homeLink = screen.getByRole('link', { name: /início/i });
      expect(homeLink).toHaveAttribute('href', '/home');

      const homeIcon = container.querySelector('.lucide-house');
      expect(homeIcon).toBeInTheDocument();
    });

    it('renderiza item "Início" como texto (ativo) quando é o único', () => {
      renderComponent();
      const homeItem = screen.getByText('Início');
      expect(homeItem.closest('a')).toBeNull();
    });

    it('renderiza os itens passados via props', () => {
      const items = [
        { label: 'Módulo', to: '/modulo' },
        { label: 'Página Atual', isActive: true },
      ];
      renderComponent({ items });

      const moduleLink = screen.getByRole('link', { name: /módulo/i });
      expect(moduleLink).toHaveAttribute('href', '/modulo');

      const currentPage = screen.getByText('Página Atual');
      expect(currentPage).toBeInTheDocument();
    });

    it('renderiza ícones para os itens quando fornecidos', () => {
      const items = [
        { label: 'Com Ícone', icon: Boxes, to: '/icone' },
        { label: 'Ativo', isActive: true },
      ];
      const { container } = renderComponent({ items });

      const icon = container.querySelector('.lucide-boxes');
      expect(icon).toBeInTheDocument();
    });

    it('o último item (ou ativo) não deve ser um link e ter cor diferenciada', () => {
      const items = [
        { label: 'Anterior', to: '/anterior' },
        { label: 'Atual', isActive: true },
      ];
      renderComponent({ items });

      const activeItem = screen.getByText('Atual');

      expect(activeItem.closest('a')).toBeNull();

      expect(activeItem).toHaveClass('text-green-800');
    });

    it('exibe o caminho completo da navegação de forma incremental', () => {
      const items = [
        { label: 'Módulo Acessado', to: '/modulo' },
        { label: 'Página Acessada', to: '/modulo/pagina' },
        { label: 'Subpágina Acessada', isActive: true },
      ];

      renderComponent({ items });

      expect(screen.getByText('Início')).toBeInTheDocument();
      expect(screen.getByText('Módulo Acessado')).toBeInTheDocument();
      expect(screen.getByText('Página Acessada')).toBeInTheDocument();
      expect(screen.getByText('Subpágina Acessada')).toBeInTheDocument();
    });
  });

  describe('Navegação', () => {
    it('navega para a rota correta ao clicar em um item', async () => {
      const user = userEvent.setup();

      const items = [
        { label: 'Destino', to: '/destino' },
        { label: 'Final', isActive: true },
      ];

      render(
        <MemoryRouter initialEntries={['/start']}>
          <Routes>
            <Route path='/start' element={<AppBreadcrumb items={items} />} />
            <Route path='/destino' element={<div>Chegou no Destino</div>} />
          </Routes>
        </MemoryRouter>,
      );

      const link = screen.getByRole('link', { name: /destino/i });
      await user.click(link);

      expect(screen.getByText('Chegou no Destino')).toBeInTheDocument();
    });
  });
});
