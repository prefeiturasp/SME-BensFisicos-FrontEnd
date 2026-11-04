import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import MainLayout from './MainLayout';

vi.mock('@/components/ui/sidebar', () => ({
  SidebarProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='sidebar-provider'>{children}</div>
  ),
  SidebarInset: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='sidebar-inset'>{children}</div>
  ),
  SidebarTrigger: () => <button>Trigger</button>,
}));

vi.mock('./AppSidebar', () => ({
  AppSidebar: () => <div data-testid='app-sidebar'>AppSidebar Mock</div>,
}));

vi.mock('./Header', () => ({
  Header: () => <div data-testid='header'>Header Mock</div>,
}));

describe('MainLayout', () => {
  it('deve renderizar a estrutura básica do layout', () => {
    render(
      <MemoryRouter>
        <MainLayout />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('sidebar-provider')).toBeInTheDocument();
    expect(screen.getByTestId('app-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-inset')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('deve renderizar o conteúdo das rotas filhas (Outlet)', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path='/' element={<MainLayout />}>
            <Route index element={<div data-testid='content'>Conteúdo da Página</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('content')).toBeInTheDocument();
    expect(screen.getByText('Conteúdo da Página')).toBeInTheDocument();
  });
});
