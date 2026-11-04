import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const mockLogin = vi.fn();

async function setupMock({
  isLoggingIn = false,
  loginError = null,
}: { isLoggingIn?: boolean; loginError?: string | null } = {}) {
  vi.resetModules();
  vi.doMock('@/auth/useAuth', () => ({
    useAuth: () => ({
      login: mockLogin,
      isLoggingIn,
      loginError,
    }),
  }));
  const module = await import('./LoginPage');
  return module.default;
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Renderização', () => {
    it('renderiza textos, labels, inputs, botões e logos', async () => {
      const LoginPage = await setupMock();
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>,
      );

      expect(screen.getByText('Bem-vindo(a) ao')).toBeInTheDocument();
      expect(screen.getByText('Sistema de Gestão de Bens Patrimoniais')).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /Usuário/i })).toBeInTheDocument();

      const senhaInput = screen.getByLabelText(/Senha/i, { selector: 'input' }) as HTMLInputElement;
      expect(senhaInput).toBeInTheDocument();
      expect(senhaInput).toHaveAttribute('type', 'password');

      expect(screen.getByRole('button', { name: /Acessar|Entrando/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Esqueci minha senha/i })).toBeInTheDocument();

      expect(screen.getByAltText(/Logo Bens Físicos/i)).toBeInTheDocument();
      expect(screen.getByAltText(/Prefeitura de São Paulo/i)).toBeInTheDocument();
    });
  });

  describe('Validações', () => {
    it('mostra mensagens de validação ao submeter campos vazios', async () => {
      const LoginPage = await setupMock();
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>,
      );

      const btn = screen.getByRole('button', { name: /Acessar/i });
      await userEvent.click(btn);

      expect(await screen.findByText(/Usuário é obrigatório/i)).toBeInTheDocument();
      expect(await screen.findByText(/Senha é obrigatória/i)).toBeInTheDocument();
      expect(mockLogin).not.toHaveBeenCalled();
    });
  });

  describe('Interações', () => {
    it('toggle de visibilidade da senha funciona', async () => {
      const LoginPage = await setupMock();
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>,
      );

      const senhaInput = screen.getByLabelText(/Senha/i, { selector: 'input' }) as HTMLInputElement;
      expect(senhaInput).toHaveAttribute('type', 'password');

      const toggleBtn = screen.getByRole('button', { name: /mostrar senha|ocultar senha/i });
      expect(toggleBtn).toHaveAccessibleName(/mostrar senha/i);

      await userEvent.click(toggleBtn);
      expect(senhaInput).toHaveAttribute('type', 'text');
      expect(toggleBtn).toHaveAccessibleName(/ocultar senha/i);

      await userEvent.click(toggleBtn);
      expect(senhaInput).toHaveAttribute('type', 'password');
      expect(toggleBtn).toHaveAccessibleName(/mostrar senha/i);
    });

    it('envia credenciais corretas ao submeter o formulário', async () => {
      const LoginPage = await setupMock();
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>,
      );

      const usuario = screen.getByRole('textbox', { name: /Usuário/i });
      const senha = screen.getByLabelText(/Senha/i, { selector: 'input' });
      const btn = screen.getByRole('button', { name: /Acessar/i });

      const USER = 'fulano';
      const PASS = 'senha123';

      await userEvent.type(usuario, USER);
      await userEvent.type(senha, PASS);
      await userEvent.click(btn);

      await waitFor(() =>
        expect(mockLogin).toHaveBeenCalledWith({ username: USER, password: PASS }),
      );
    });

    it('previne múltiplos submits (cliques rápidos)', async () => {
      vi.resetModules();
      const React = await import('react');

      const calls: { count: number } = { count: 0 };

      vi.doMock('@/auth/useAuth', () => ({
        useAuth: () => {
          const [isLoggingIn, setIsLoggingIn] = React.useState(false);
          const login = () => {
            calls.count += 1;
            setIsLoggingIn(true);
            return new Promise(() => {});
          };
          return { login, isLoggingIn, loginError: null };
        },
      }));

      const module = await import('./LoginPage');
      const LoginPage = module.default;

      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>,
      );

      const usuario = screen.getByRole('textbox', { name: /Usuário/i });
      const senha = screen.getByLabelText(/Senha/i, { selector: 'input' });
      const btn = screen.getByRole('button', { name: /Acessar/i });

      await userEvent.type(usuario, 'fulano');
      await userEvent.type(senha, 'senha123');

      await userEvent.click(btn);
      await userEvent.click(btn);

      expect(calls.count).toBe(1);
    });
  });

  describe('Estados (loading / erro)', () => {
    it('botão de submit fica desabilitado e mostra "Entrando" quando isLoggingIn=true', async () => {
      const LoginPage = await setupMock({ isLoggingIn: true });
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>,
      );

      const btn = screen.getByRole('button', { name: /Entrando/i });
      expect(btn).toBeDisabled();
    });

    it('exibe mensagem de erro quando loginError está presente', async () => {
      const LoginPage = await setupMock({ loginError: 'Credenciais inválidas' });
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>,
      );

      expect(
        screen.getByText('Erro ao fazer login. Verifique suas credenciais.'),
      ).toBeInTheDocument();
    });
  });

  describe('Navegação', () => {
    it('navega para /esqueceu-senha ao clicar no link', async () => {
      const LoginPage = await setupMock();
      render(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path='/' element={<LoginPage />} />
            <Route path='/esqueceu-senha' element={<div>Esqueceu Senha</div>} />
          </Routes>
        </MemoryRouter>,
      );

      await userEvent.click(screen.getByRole('link', { name: /Esqueci minha senha/i }));
      expect(screen.getByText('Esqueceu Senha')).toBeInTheDocument();
    });
  });
});
