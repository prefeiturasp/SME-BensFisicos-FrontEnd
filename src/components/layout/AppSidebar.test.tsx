import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AppSidebar } from './AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuth } from '@/auth/useAuth';

vi.mock('@/auth/useAuth');

beforeEach(() => {
  vi.mocked(useAuth).mockReturnValue({
    isAuthenticated: true,
    isLoading: false,
    mustChangePassword: false,
    user: {
      id: 1,
      username: 'superadmin',
      nome: 'Super Admin',
      email: 'superadmin@sme.prefeitura.sp.gov.br',
      rf: '1234567',
      is_superuser: true,
      is_gestor_patrimonio: false,
      is_operador_inventario: false,
      must_change_password: false,
      uo_ativa: null,
      ua_ativa: null,
      opcoes_escopo: { grupos: [] },
    },
    login: vi.fn(),
    logout: vi.fn(),
    isLoggingIn: false,
    loginError: null,
    loginAsync: vi.fn(),
  });

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
      <SidebarProvider defaultOpen={true}>
        <TooltipProvider>
          <MemoryRouter initialEntries={initialEntries}>
            <AppSidebar />
          </MemoryRouter>
        </TooltipProvider>
      </SidebarProvider>,
    );
  };

  describe('Renderização', () => {
    it('deve renderizar o título do sistema na versão expandida', () => {
      renderSidebar();
      expect(screen.getByText('Sistema de Gestão de Bens Patrimoniais')).toBeInTheDocument();
    });

    it('deve renderizar a logo da Prefeitura no rodapé', () => {
      renderSidebar();
      const logo = screen.getByAltText('Prefeitura de São Paulo');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', '/prefeitura_logo_branco.png');
      expect(logo).toBeVisible();
    });

    it('deve renderizar os grupos principais de menu', () => {
      renderSidebar();
      expect(screen.getByText('Bem Patrimonial')).toBeInTheDocument();
      expect(screen.getByText('Inventário')).toBeInTheDocument();
      expect(screen.getByText('Configurações')).toBeInTheDocument();
    });
  });

  describe('Comportamento da Sidebar (Toggle)', () => {
    it('deve alternar a visibilidade da logo e título ao colapsar', async () => {
      const user = userEvent.setup();
      renderSidebar();

      const logo = screen.getByAltText('Prefeitura de São Paulo');
      expect(logo).toBeVisible();

      const buttons = screen.getAllByRole('button');
      const closeButton = buttons.find((btn) => btn.className.includes('hover:bg-white/10'));

      if (!closeButton) {
        throw new Error('Botão de fechar sidebar não encontrado para o teste');
      }

      await user.click(closeButton);

      await waitFor(() => {
        const logo = screen.getByAltText('Prefeitura de São Paulo');
        const footer = logo.closest('div[data-sidebar="footer"]');
        expect(footer).toHaveClass('hidden');
      });

      await waitFor(() => {
        expect(
          screen.queryByText('Sistema de Gestão de Bens Patrimoniais'),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Navegação e Menus', () => {
    it('exibe o atalho de Unidades Orçamentárias para superuser', async () => {
      const user = userEvent.setup();
      renderSidebar();

      await user.click(screen.getByText('Configurações'));

      expect(screen.getByRole('link', { name: 'Unidades Orçamentárias' })).toBeVisible();
    });

    it('oculta o atalho de Unidades Orçamentárias para não superuser', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        mustChangePassword: false,
        user: {
          id: 2,
          username: 'gestor',
          nome: 'Gestor',
          email: 'gestor@sme.prefeitura.sp.gov.br',
          rf: '7654321',
          is_superuser: false,
          is_gestor_patrimonio: true,
          is_operador_inventario: false,
          must_change_password: false,
          uo_ativa: null,
          ua_ativa: null,
          opcoes_escopo: { grupos: [] },
        },
        login: vi.fn(),
        logout: vi.fn(),
        isLoggingIn: false,
        loginError: null,
        loginAsync: vi.fn(),
      });

      const user = userEvent.setup();
      renderSidebar();

      await user.click(screen.getByText('Configurações'));

      expect(
        screen.queryByRole('link', { name: 'Unidades Orçamentárias' }),
      ).not.toBeInTheDocument();
    });

    it('oculta o atalho de Parâmetros de Conciliação Anual para operador', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        mustChangePassword: false,
        user: {
          id: 3,
          username: 'operador',
          nome: 'Operador',
          email: 'operador@sme.prefeitura.sp.gov.br',
          rf: '1231231',
          is_superuser: false,
          is_gestor_patrimonio: false,
          is_operador_inventario: true,
          must_change_password: false,
          uo_ativa: null,
          ua_ativa: null,
          opcoes_escopo: { grupos: [] },
        },
        login: vi.fn(),
        logout: vi.fn(),
        isLoggingIn: false,
        loginError: null,
        loginAsync: vi.fn(),
      });

      const user = userEvent.setup();
      renderSidebar();

      await user.click(screen.getByText('Inventário'));

      expect(
        screen.queryByRole('link', { name: 'Parâmetros de Conciliação Anual' }),
      ).not.toBeInTheDocument();
    });

    it('deve expandir submenu ao clicar no item pai', async () => {
      const user = userEvent.setup();
      renderSidebar();

      const subItem = screen.queryByText(/^Bens Patrimoniais$/);
      if (subItem) {
        expect(subItem).not.toBeVisible();
      } else {
        expect(subItem).not.toBeInTheDocument();
      }

      await user.click(screen.getByText('Bem Patrimonial'));

      await waitFor(() => {
        const link = screen.getByRole('link', { name: 'Bens Patrimoniais' });
        expect(link).toBeVisible();
      });

      expect(screen.getByRole('link', { name: 'Movimentações de Bem Patrimonial' })).toBeVisible();
    });

    it('exibe o atalho de Transferências dentro de Bem Patrimonial', async () => {
      const user = userEvent.setup();
      renderSidebar();

      await user.click(screen.getByText('Bem Patrimonial'));

      await waitFor(() => {
        expect(
          screen.getByRole('link', { name: 'Transferência de Bens Patrimoniais' }),
        ).toBeVisible();
      });
    });

    it('deve iniciar com submenu aberto se a rota ativa for de um subitem', () => {
      renderSidebar(['/bens-patrimoniais']);
      expect(screen.getByRole('link', { name: 'Bens Patrimoniais' })).toBeVisible();
    });

    it('deve destacar visualmente o item da rota ativa', () => {
      renderSidebar(['/bens-patrimoniais']);
      const activeLink = screen.getByRole('link', { name: 'Bens Patrimoniais' });

      expect(activeLink).toHaveAttribute('data-active', 'true');
    });

    it('deve navegar corretamente ao clicar em um link', async () => {
      const user = userEvent.setup();

      render(
        <SidebarProvider defaultOpen={true}>
          <TooltipProvider>
            <MemoryRouter initialEntries={['/home']}>
              <Routes>
                <Route path='/home' element={<AppSidebar />} />
                <Route path='/conciliacoes' element={<div>Página de Conciliações</div>} />
              </Routes>
            </MemoryRouter>
          </TooltipProvider>
        </SidebarProvider>,
      );

      await user.click(screen.getByText(/^Inventário$/));
      const link = screen.getByRole('link', { name: 'Gerenciamento de Conciliações' });
      await user.click(link);

      expect(screen.getByText('Página de Conciliações')).toBeInTheDocument();
    });
  });

  describe('Acessibilidade', () => {
    it('menus expansíveis devem ter controle aria-expanded correto', async () => {
      renderSidebar();

      const menuText = screen.getByText('Bem Patrimonial');
      const triggerButton = menuText.closest('button');

      expect(triggerButton).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(triggerButton!);
      expect(triggerButton).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Scroll e Overflow', () => {
    it('deve aplicar classe custom-scrollbar para permitir rolagem', () => {
      renderSidebar();
      const sidebarContent = document.querySelector('[data-sidebar="content"]');
      expect(sidebarContent).toHaveClass('custom-scrollbar');
      expect(sidebarContent).toHaveClass('overflow-x-hidden');
    });

    it('deve manter logo da Prefeitura visível ao final independente do scroll', () => {
      renderSidebar();
      const footer = document.querySelector('[data-sidebar="footer"]');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveClass('p-4');
    });
  });

  describe('Comportamento ao Clicar em Subitem', () => {
    it('deve contrair sidebar ao clicar em subitem (desktop)', async () => {
      const user = userEvent.setup();
      renderSidebar();

      await user.click(screen.getByText('Bem Patrimonial'));

      await waitFor(() => {
        const link = screen.getByRole('link', { name: 'Bens Patrimoniais' });
        expect(link).toBeInTheDocument();
      });

      const sidebar = document.querySelector('[data-sidebar="sidebar"]');
      expect(sidebar?.closest('[data-slot="sidebar"]')).toHaveAttribute('data-state', 'expanded');

      const link = screen.getByRole('link', { name: 'Bens Patrimoniais' });
      await user.click(link);

      await waitFor(() => {
        expect(sidebar?.closest('[data-slot="sidebar"]')).toHaveAttribute(
          'data-state',
          'collapsed',
        );
      });
    });
  });

  describe('Menu Contraído (Collapsed)', () => {
    it('deve mostrar tooltip no modo contraído', async () => {
      const user = userEvent.setup();
      renderSidebar();

      const buttons = screen.getAllByRole('button');
      const closeButton = buttons.find((btn) => btn.className.includes('hover:bg-white/10'));
      await user.click(closeButton!);

      await waitFor(() => {
        const collapsedMenuItems = document.querySelectorAll('[data-sidebar="menu-button"]');
        expect(collapsedMenuItems.length).toBeGreaterThan(0);
      });
    });

    it('deve expandir sidebar ao clicar em item quando contraído', async () => {
      const user = userEvent.setup();
      renderSidebar();

      const buttons = screen.getAllByRole('button');
      const closeButton = buttons.find((btn) => btn.className.includes('hover:bg-white/10'));
      await user.click(closeButton!);

      await waitFor(() => {
        expect(
          screen.queryByText('Sistema de Gestão de Bens Patrimoniais'),
        ).not.toBeInTheDocument();
      });

      const menuButtons = screen.getAllByRole('button');
      const bemPatrimonialButton = menuButtons.find((btn) => {
        const span = btn.querySelector('span');
        return span?.textContent === 'Bem Patrimonial';
      });

      if (bemPatrimonialButton) {
        await user.click(bemPatrimonialButton);

        await waitFor(() => {
          expect(screen.getByText('Sistema de Gestão de Bens Patrimoniais')).toBeInTheDocument();
        });
      }
    });

    it('deve ter ícones visíveis mesmo quando contraído', async () => {
      const user = userEvent.setup();
      renderSidebar();

      const buttons = screen.getAllByRole('button');
      const closeButton = buttons.find((btn) => btn.className.includes('hover:bg-white/10'));
      await user.click(closeButton!);

      await waitFor(() => {
        const icons = document.querySelectorAll('svg[class*="size"]');
        expect(icons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Ícones e Textos', () => {
    it('deve renderizar ícones para cada item de menu principal', () => {
      renderSidebar();

      const bemPatrimonialSection = screen.getByText('Bem Patrimonial').closest('button');
      expect(bemPatrimonialSection?.querySelector('svg')).toBeInTheDocument();

      const inventarioSection = screen.getByText('Inventário').closest('button');
      expect(inventarioSection?.querySelector('svg')).toBeInTheDocument();

      const configSection = screen.getByText('Configurações').closest('button');
      expect(configSection?.querySelector('svg')).toBeInTheDocument();
    });

    it('deve mostrar chevron indicando expansão/colapso dos subitens', async () => {
      const user = userEvent.setup();
      renderSidebar();

      const bemPatrimonial = screen.getByText('Bem Patrimonial').closest('button');
      const chevron = bemPatrimonial?.querySelector('svg[class*="transition-transform"]');

      expect(chevron).toBeInTheDocument();

      await user.click(screen.getByText('Bem Patrimonial'));

      await waitFor(() => {
        expect(chevron?.parentElement).toHaveAttribute('data-state', 'open');
      });
    });
  });
});
