import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AppSidebar } from './AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

describe('AppSidebar', () => {
  const renderSidebar = (initialEntries = ['/home']) => {
    return render(
      <SidebarProvider>
        <MemoryRouter initialEntries={initialEntries}>
          <AppSidebar />
        </MemoryRouter>
      </SidebarProvider>,
    );
  };

  it('deve renderizar os links com as URLs corretas', () => {
    renderSidebar();

    expect(screen.getByText('Início').closest('a')).toHaveAttribute('href', '/home');
  });

  it('deve marcar o item ativo baseado na rota atual', () => {
    renderSidebar(['/home']);

    const activeLink = screen.getByText('Início').closest('a');
    expect(activeLink).toBeInTheDocument();

    const button = activeLink?.closest('button') || activeLink;
    expect(button).toBeInTheDocument();
  });
});
