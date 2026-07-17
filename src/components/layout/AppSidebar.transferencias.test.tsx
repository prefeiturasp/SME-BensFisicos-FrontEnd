import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuth } from '@/auth/useAuth'
import { SidebarProvider } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppSidebar } from './AppSidebar'

vi.mock('@/auth/useAuth')

beforeEach(() => {
  vi.mocked(useAuth).mockReturnValue({
    isAuthenticated: true,
    isLoading: false,
    mustChangePassword: false,
    user: {
      id: 1,
      username: 'gestor',
      nome: 'Gestor',
      email: 'gestor@example.com',
      rf: '123',
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
  } as never)

  vi.stubGlobal(
    'ResizeObserver',
    class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )

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
  })
})

describe('AppSidebar - Transferências', () => {
  it('exibe o atalho de transferências dentro de Bem Patrimonial', async () => {
    const user = userEvent.setup()

    render(
      <SidebarProvider defaultOpen={true}>
        <TooltipProvider>
          <MemoryRouter initialEntries={['/home']}>
            <AppSidebar />
          </MemoryRouter>
        </TooltipProvider>
      </SidebarProvider>,
    )

    await user.click(screen.getByText('Bem Patrimonial'))

    await waitFor(() => {
      expect(
        screen.getByRole('link', { name: 'Transferência de Bens Patrimoniais' }),
      ).toBeVisible()
    })
  })
})
