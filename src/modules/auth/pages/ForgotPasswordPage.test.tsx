import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ForgotPasswordPage from './ForgotPasswordPage';
import { passwordService } from '../services/password.service';

vi.mock('../services/password.service', () => ({
  passwordService: {
    requestReset: vi.fn(),
  },
}));

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function setupServiceMock({ shouldReject = false, errorMessage = '' } = {}) {
    vi.mocked(passwordService.requestReset).mockImplementation(async () => {
      if (shouldReject) {
        throw new Error(errorMessage || 'Erro ao solicitar recuperação de senha.');
      }
      return Promise.resolve();
    });
  }

  describe('Renderização', () => {
    it('renderiza título, subtítulo, descrição, input de e-mail, botão e link de voltar', () => {
      setupServiceMock();
      render(
        <MemoryRouter>
          <ForgotPasswordPage />
        </MemoryRouter>,
      );

      expect(screen.getByText('Esqueceu sua senha?')).toBeInTheDocument();
      expect(screen.getByText('Informe seu e-mail para recuperar o acesso')).toBeInTheDocument();
      expect(screen.getByText(/Digite o e-mail cadastrado no sistema/i)).toBeInTheDocument();

      const emailInput = screen.getByRole('textbox', { name: /E-mail/i });
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('autocomplete', 'email');

      expect(
        screen.getByRole('button', { name: /Enviar link de recuperação|Enviando/i }),
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Voltar ao Login/i })).toBeInTheDocument();
    });

    it('input de e-mail tem autofocus', () => {
      setupServiceMock();
      render(
        <MemoryRouter>
          <ForgotPasswordPage />
        </MemoryRouter>,
      );

      const emailInput = screen.getByRole('textbox', { name: /E-mail/i });
      expect(emailInput).toHaveFocus();
    });
  });

  describe('Validações', () => {
    it('mostra mensagem de validação ao submeter campo vazio', async () => {
      const { container } = render(
        <MemoryRouter>
          <ForgotPasswordPage />
        </MemoryRouter>,
      );

      const form = container.querySelector('form');
      if (form) fireEvent.submit(form);

      expect(await screen.findByText(/E-mail é obrigatório/i)).toBeInTheDocument();
      expect(passwordService.requestReset).not.toHaveBeenCalled();
    });

    it('mostra mensagem de validação para e-mail inválido', async () => {
      const user = userEvent.setup();
      setupServiceMock();
      const { container } = render(
        <MemoryRouter>
          <ForgotPasswordPage />
        </MemoryRouter>,
      );

      const emailInput = screen.getByRole('textbox', { name: /E-mail/i });

      await user.type(emailInput, 'email-invalido');
      await user.tab();

      const form = container.querySelector('form');
      if (form) fireEvent.submit(form);

      expect(await screen.findByText(/E-mail inválido|Invalid email/i)).toBeInTheDocument();
      expect(passwordService.requestReset).not.toHaveBeenCalled();
    });

    it('aceita e-mails válidos sem mostrar erro', async () => {
      const user = userEvent.setup();
      setupServiceMock();
      render(
        <MemoryRouter>
          <ForgotPasswordPage />
        </MemoryRouter>,
      );

      const emailInput = screen.getByRole('textbox', { name: /E-mail/i });
      const btn = screen.getByRole('button', { name: /Enviar link de recuperação/i });

      const validEmails = [
        'usuario@example.com',
        'teste.teste@dominio.com.br',
        'user+tag@email.co',
      ];

      for (const email of validEmails) {
        await user.clear(emailInput);
        await user.type(emailInput, email);
        await user.click(btn);

        await waitFor(() => expect(passwordService.requestReset).toHaveBeenCalledWith({ email }));

        expect(screen.queryByText(/E-mail inválido/i)).not.toBeInTheDocument();
        vi.clearAllMocks();
      }
    });
  });

  describe('Interações', () => {
    it('envia e-mail correto ao submeter o formulário', async () => {
      setupServiceMock();
      render(
        <MemoryRouter>
          <Routes>
            <Route path='/' element={<ForgotPasswordPage />} />
            <Route path='/verifique-email' element={<div>Verifique Email</div>} />
          </Routes>
        </MemoryRouter>,
      );

      const emailInput = screen.getByRole('textbox', { name: /E-mail/i });
      const btn = screen.getByRole('button', { name: /Enviar link de recuperação/i });

      const EMAIL = 'usuario@example.com';

      await userEvent.type(emailInput, EMAIL);
      await userEvent.click(btn);

      await waitFor(() =>
        expect(passwordService.requestReset).toHaveBeenCalledWith({ email: EMAIL }),
      );
    });

    it('navega para /verifique-email com state ao enviar com sucesso', async () => {
      setupServiceMock();
      render(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path='/' element={<ForgotPasswordPage />} />
            <Route path='/verifique-email' element={<div>Verifique Email</div>} />
          </Routes>
        </MemoryRouter>,
      );

      const emailInput = screen.getByRole('textbox', { name: /E-mail/i });
      const btn = screen.getByRole('button', { name: /Enviar link de recuperação/i });

      const EMAIL = 'usuario@example.com';

      await userEvent.type(emailInput, EMAIL);
      await userEvent.click(btn);

      await waitFor(() => expect(screen.getByText('Verifique Email')).toBeInTheDocument());
    });

    it('previne múltiplos submits (cliques rápidos)', async () => {
      let calls = 0;
      vi.mocked(passwordService.requestReset).mockImplementation(() => {
        calls += 1;
        return new Promise(() => {});
      });

      render(
        <MemoryRouter>
          <ForgotPasswordPage />
        </MemoryRouter>,
      );

      const emailInput = screen.getByRole('textbox', { name: /E-mail/i });
      const btn = screen.getByRole('button', { name: /Enviar link de recuperação/i });

      await userEvent.type(emailInput, 'usuario@example.com');

      await userEvent.click(btn);
      await userEvent.click(btn);
      await userEvent.click(btn);

      await waitFor(() => expect(calls).toBe(1));
    });
  });

  describe('Estados (loading / erro)', () => {
    it('botão de submit fica desabilitado e mostra "Enviando..." durante submissão', async () => {
      vi.mocked(passwordService.requestReset).mockImplementation(() => new Promise(() => {}));

      render(
        <MemoryRouter>
          <ForgotPasswordPage />
        </MemoryRouter>,
      );

      const emailInput = screen.getByRole('textbox', { name: /E-mail/i });
      const btn = screen.getByRole('button', { name: /Enviar link de recuperação/i });

      await userEvent.type(emailInput, 'usuario@example.com');
      await userEvent.click(btn);

      await waitFor(() => {
        const loadingBtn = screen.getByRole('button', { name: /Enviando/i });
        expect(loadingBtn).toBeDisabled();
      });
    });

    it('exibe mensagem de erro quando requestReset falha', async () => {
      setupServiceMock({
        shouldReject: true,
        errorMessage: 'E-mail não encontrado no sistema.',
      });

      render(
        <MemoryRouter>
          <ForgotPasswordPage />
        </MemoryRouter>,
      );

      const emailInput = screen.getByRole('textbox', { name: /E-mail/i });
      const btn = screen.getByRole('button', { name: /Enviar link de recuperação/i });

      await userEvent.type(emailInput, 'inexistente@example.com');
      await userEvent.click(btn);

      expect(await screen.findByText('E-mail não encontrado no sistema.')).toBeInTheDocument();
    });

    it('exibe mensagem de erro genérica quando erro não tem mensagem específica', async () => {
      setupServiceMock({
        shouldReject: true,
        errorMessage: '',
      });

      render(
        <MemoryRouter>
          <ForgotPasswordPage />
        </MemoryRouter>,
      );

      const emailInput = screen.getByRole('textbox', { name: /E-mail/i });
      const btn = screen.getByRole('button', { name: /Enviar link de recuperação/i });

      await userEvent.type(emailInput, 'usuario@example.com');
      await userEvent.click(btn);

      expect(
        await screen.findByText('Erro ao solicitar recuperação de senha.'),
      ).toBeInTheDocument();
    });

    it('limpa mensagem de erro ao submeter novamente', async () => {
      setupServiceMock({
        shouldReject: true,
        errorMessage: 'Primeiro erro',
      });

      render(
        <MemoryRouter>
          <ForgotPasswordPage />
        </MemoryRouter>,
      );

      const emailInput = screen.getByRole('textbox', { name: /E-mail/i });
      const btn = screen.getByRole('button', { name: /Enviar link de recuperação/i });

      await userEvent.type(emailInput, 'usuario@example.com');
      await userEvent.click(btn);

      expect(await screen.findByText('Primeiro erro')).toBeInTheDocument();

      vi.clearAllMocks();
      setupServiceMock();

      await userEvent.click(btn);

      await waitFor(() => {
        expect(screen.queryByText('Primeiro erro')).not.toBeInTheDocument();
      });
    });
  });

  describe('Navegação', () => {
    it('navega para / ao clicar em "Voltar ao Login"', async () => {
      setupServiceMock();
      render(
        <MemoryRouter initialEntries={['/esqueceu-senha']}>
          <Routes>
            <Route path='/esqueceu-senha' element={<ForgotPasswordPage />} />
            <Route path='/' element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>,
      );

      await userEvent.click(screen.getByRole('link', { name: /Voltar ao Login/i }));
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });

  describe('Acessibilidade', () => {
    it('labels estão corretamente associados aos inputs', () => {
      setupServiceMock();
      render(
        <MemoryRouter>
          <ForgotPasswordPage />
        </MemoryRouter>,
      );

      const emailInput = screen.getByRole('textbox', { name: /E-mail/i });
      expect(emailInput).toHaveAccessibleName();
    });

    it('botão tem texto descritivo', () => {
      setupServiceMock();
      render(
        <MemoryRouter>
          <ForgotPasswordPage />
        </MemoryRouter>,
      );

      const btn = screen.getByRole('button', { name: /Enviar link de recuperação/i });
      expect(btn).toHaveAccessibleName('Enviar link de recuperação');
    });

    it('link de voltar tem texto descritivo', () => {
      setupServiceMock();
      render(
        <MemoryRouter>
          <ForgotPasswordPage />
        </MemoryRouter>,
      );

      const link = screen.getByRole('link', { name: /Voltar ao Login/i });
      expect(link).toHaveAccessibleName();
    });
  });
});
