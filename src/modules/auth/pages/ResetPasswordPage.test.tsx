import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ResetPasswordPage from './ResetPasswordPage';
import { passwordService } from '../services/password.service';
import { toast } from 'sonner';

vi.mock('../services/password.service', () => ({
  passwordService: {
    confirmReset: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
  },
}));

describe('ResetPasswordPage', () => {
  const defaultParams = { uidb64: 'MQ', token: 'abc123-token-valid' };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  function setupServiceMock({ shouldReject = false, errorMessage = '' } = {}) {
    vi.mocked(passwordService.confirmReset).mockImplementation(async () => {
      if (shouldReject) {
        throw new Error(errorMessage || 'Erro ao redefinir senha. O link pode ter expirado.');
      }
      return Promise.resolve();
    });
  }

  function renderComponent(
    initialEntries = [`/recuperar-senha/${defaultParams.uidb64}/${defaultParams.token}`],
  ) {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path='/recuperar-senha/:uidb64/:token' element={<ResetPasswordPage />} />
          <Route path='/' element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>,
    );
  }

  describe('Renderização', () => {
    it('renderiza título, instruções, campos de senha e botão salvar', () => {
      setupServiceMock();
      const { container } = renderComponent();

      expect(screen.getByText('Recuperar senha')).toBeInTheDocument();
      expect(screen.getByText('Crie uma nova senha:')).toBeInTheDocument();
      expect(
        screen.getByText('Sua senha não deve conter informações pessoais.'),
      ).toBeInTheDocument();

      const passwordInput = container.querySelector('input[name="password"]');
      const confirmInput = container.querySelector('input[name="confirmPassword"]');
      expect(passwordInput).toBeInTheDocument();
      expect(confirmInput).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Salvar/i })).toBeInTheDocument();
    });

    it('primeiro campo de senha tem autofocus', () => {
      setupServiceMock();
      const { container } = renderComponent();
      const passwordInput = container.querySelector('input[name="password"]')!;
      expect(passwordInput).toHaveFocus();
    });
  });

  describe('Validações', () => {
    it('mostra erro quando senha tem menos de 6 caracteres', async () => {
      setupServiceMock();
      const { container } = renderComponent();

      const passwordInput = container.querySelector('input[name="password"]')!;
      const confirmInput = container.querySelector('input[name="confirmPassword"]')!;
      const btn = screen.getByRole('button', { name: /Salvar/i });

      fireEvent.change(passwordInput, { target: { value: 'Ab1!' } });
      fireEvent.change(confirmInput, { target: { value: 'Ab1!' } });
      fireEvent.click(btn);

      expect(
        await screen.findByText(/A senha deve ter no mínimo 6 caracteres/i),
      ).toBeInTheDocument();
      expect(passwordService.confirmReset).not.toHaveBeenCalled();
    });

    it('mostra erro quando senha não contém letras', async () => {
      setupServiceMock();
      const { container } = renderComponent();

      const passwordInput = container.querySelector('input[name="password"]')!;
      const confirmInput = container.querySelector('input[name="confirmPassword"]')!;
      const btn = screen.getByRole('button', { name: /Salvar/i });

      fireEvent.change(passwordInput, { target: { value: '123456!@#' } });
      fireEvent.change(confirmInput, { target: { value: '123456!@#' } });
      fireEvent.click(btn);

      expect(
        await screen.findByText(/A senha deve conter letras/i, { selector: 'p' }),
      ).toBeInTheDocument();
    });

    it('mostra erro quando senha não contém números', async () => {
      setupServiceMock();
      const { container } = renderComponent();

      const passwordInput = container.querySelector('input[name="password"]')!;
      const confirmInput = container.querySelector('input[name="confirmPassword"]')!;
      const btn = screen.getByRole('button', { name: /Salvar/i });

      fireEvent.change(passwordInput, { target: { value: 'AbCdEf!@#' } });
      fireEvent.change(confirmInput, { target: { value: 'AbCdEf!@#' } });
      fireEvent.click(btn);

      expect(await screen.findByText(/A senha deve conter números/i)).toBeInTheDocument();
    });

    it('mostra erro quando senha não contém caracteres especiais', async () => {
      setupServiceMock();
      const { container } = renderComponent();

      const passwordInput = container.querySelector('input[name="password"]')!;
      const confirmInput = container.querySelector('input[name="confirmPassword"]')!;
      const btn = screen.getByRole('button', { name: /Salvar/i });

      fireEvent.change(passwordInput, { target: { value: 'AbCdEf123' } });
      fireEvent.change(confirmInput, { target: { value: 'AbCdEf123' } });
      fireEvent.click(btn);

      expect(
        await screen.findByText(/A senha deve conter caracteres especiais/i),
      ).toBeInTheDocument();
    });

    it('mostra erro quando as senhas não coincidem', async () => {
      setupServiceMock();
      const { container } = renderComponent();

      const passwordInput = container.querySelector('input[name="password"]')!;
      const confirmInput = container.querySelector('input[name="confirmPassword"]')!;
      const btn = screen.getByRole('button', { name: /Salvar/i });

      fireEvent.change(passwordInput, { target: { value: 'SenhaValida123!' } });
      fireEvent.change(confirmInput, { target: { value: 'SenhaDiferente123!' } });
      fireEvent.click(btn);

      expect(await screen.findByText(/As senhas não coincidem/i)).toBeInTheDocument();
    });

    it('aceita senhas válidas sem mostrar erro', async () => {
      setupServiceMock();
      const { container } = renderComponent();

      const passwordInput = container.querySelector('input[name="password"]')!;
      const confirmInput = container.querySelector('input[name="confirmPassword"]')!;
      const btn = screen.getByRole('button', { name: /Salvar/i });

      const validPassword = 'SenhaSegura123!';

      fireEvent.change(passwordInput, { target: { value: validPassword } });
      fireEvent.change(confirmInput, { target: { value: validPassword } });
      fireEvent.click(btn);

      await waitFor(() =>
        expect(passwordService.confirmReset).toHaveBeenCalledWith({
          uidb64: defaultParams.uidb64,
          token: defaultParams.token,
          new_password: validPassword,
          new_password_confirm: validPassword,
        }),
      );
    });
  });

  describe('Interações', () => {
    it('envia dados corretos ao submeter o formulário', async () => {
      setupServiceMock();
      const { container } = renderComponent();

      const passwordInput = container.querySelector('input[name="password"]')!;
      const confirmInput = container.querySelector('input[name="confirmPassword"]')!;
      const btn = screen.getByRole('button', { name: /Salvar/i });

      const PASSWORD = 'NovaSenha123!';

      fireEvent.change(passwordInput, { target: { value: PASSWORD } });
      fireEvent.change(confirmInput, { target: { value: PASSWORD } });
      fireEvent.click(btn);

      await waitFor(() =>
        expect(passwordService.confirmReset).toHaveBeenCalledWith({
          uidb64: defaultParams.uidb64,
          token: defaultParams.token,
          new_password: PASSWORD,
          new_password_confirm: PASSWORD,
        }),
      );
    });

    it('exibe toast de sucesso e navega para login após redefinição', async () => {
      setupServiceMock();
      const { container } = renderComponent();

      const passwordInput = container.querySelector('input[name="password"]')!;
      const confirmInput = container.querySelector('input[name="confirmPassword"]')!;
      const btn = screen.getByRole('button', { name: /Salvar/i });

      const PASSWORD = 'NovaSenha123!';

      fireEvent.change(passwordInput, { target: { value: PASSWORD } });
      fireEvent.change(confirmInput, { target: { value: PASSWORD } });
      fireEvent.click(btn);

      await waitFor(() => expect(passwordService.confirmReset).toHaveBeenCalled());

      expect(toast.success).toHaveBeenCalledWith('Senha redefinida com sucesso!', {
        description: 'Você será redirecionado para a tela de login.',
      });

      await new Promise((resolve) => setTimeout(resolve, 1600));

      await waitFor(() => expect(screen.getByText('Login Page')).toBeInTheDocument());
    });
  });

  describe('Estados (loading / erro)', () => {
    it('botão de submit fica desabilitado e mostra "Salvando..." durante submissão', async () => {
      vi.mocked(passwordService.confirmReset).mockImplementation(() => new Promise(() => {}));

      const { container } = renderComponent();

      const passwordInput = container.querySelector('input[name="password"]')!;
      const confirmInput = container.querySelector('input[name="confirmPassword"]')!;
      const btn = screen.getByRole('button', { name: /Salvar/i });

      fireEvent.change(passwordInput, { target: { value: 'SenhaValida123!' } });
      fireEvent.change(confirmInput, { target: { value: 'SenhaValida123!' } });
      fireEvent.click(btn);

      await waitFor(() => {
        const loadingBtn = screen.getByRole('button', { name: /Salvando/i });
        expect(loadingBtn).toBeDisabled();
      });
    });

    it('exibe mensagem de erro quando confirmReset falha', async () => {
      setupServiceMock({
        shouldReject: true,
        errorMessage: 'O link de recuperação expirou.',
      });

      const { container } = renderComponent();

      const passwordInput = container.querySelector('input[name="password"]')!;
      const confirmInput = container.querySelector('input[name="confirmPassword"]')!;
      const btn = screen.getByRole('button', { name: /Salvar/i });

      fireEvent.change(passwordInput, { target: { value: 'SenhaValida123!' } });
      fireEvent.change(confirmInput, { target: { value: 'SenhaValida123!' } });
      fireEvent.click(btn);

      expect(await screen.findByText('O link de recuperação expirou.')).toBeInTheDocument();
    });

    it('exibe mensagem de erro genérica quando erro não tem mensagem específica', async () => {
      setupServiceMock({
        shouldReject: true,
        errorMessage: '',
      });

      const { container } = renderComponent();

      const passwordInput = container.querySelector('input[name="password"]')!;
      const confirmInput = container.querySelector('input[name="confirmPassword"]')!;
      const btn = screen.getByRole('button', { name: /Salvar/i });

      fireEvent.change(passwordInput, { target: { value: 'SenhaValida123!' } });
      fireEvent.change(confirmInput, { target: { value: 'SenhaValida123!' } });
      fireEvent.click(btn);

      expect(
        await screen.findByText('Erro ao redefinir senha. O link pode ter expirado.'),
      ).toBeInTheDocument();
    });

    it('limpa mensagem de erro ao submeter novamente', async () => {
      setupServiceMock({
        shouldReject: true,
        errorMessage: 'Primeiro erro',
      });

      const { container } = renderComponent();

      const passwordInput = container.querySelector('input[name="password"]')!;
      const confirmInput = container.querySelector('input[name="confirmPassword"]')!;
      const btn = screen.getByRole('button', { name: /Salvar/i });

      fireEvent.change(passwordInput, { target: { value: 'SenhaValida123!' } });
      fireEvent.change(confirmInput, { target: { value: 'SenhaValida123!' } });
      fireEvent.click(btn);

      expect(await screen.findByText('Primeiro erro')).toBeInTheDocument();

      vi.clearAllMocks();
      setupServiceMock();

      fireEvent.click(btn);

      await waitFor(() => {
        expect(screen.queryByText('Primeiro erro')).not.toBeInTheDocument();
      });
    });

    it('mensagem de erro tem role="alert" para acessibilidade', async () => {
      setupServiceMock({
        shouldReject: true,
        errorMessage: 'Erro de teste',
      });

      const { container } = renderComponent();

      const passwordInput = container.querySelector('input[name="password"]')!;
      const confirmInput = container.querySelector('input[name="confirmPassword"]')!;
      const btn = screen.getByRole('button', { name: /Salvar/i });

      fireEvent.change(passwordInput, { target: { value: 'SenhaValida123!' } });
      fireEvent.change(confirmInput, { target: { value: 'SenhaValida123!' } });
      fireEvent.click(btn);

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('Erro de teste');
    });
  });

  describe('Parâmetros da URL', () => {
    it('extrai corretamente uidb64 e token dos parâmetros da URL', async () => {
      setupServiceMock();

      const customParams = { uidb64: 'Mg', token: 'xyz789-custom-token' };
      const { container } = renderComponent([
        `/recuperar-senha/${customParams.uidb64}/${customParams.token}`,
      ]);

      const passwordInput = container.querySelector('input[name="password"]')!;
      const confirmInput = container.querySelector('input[name="confirmPassword"]')!;
      const btn = screen.getByRole('button', { name: /Salvar/i });

      fireEvent.change(passwordInput, { target: { value: 'TesteSenha123!' } });
      fireEvent.change(confirmInput, { target: { value: 'TesteSenha123!' } });
      fireEvent.click(btn);

      await waitFor(() =>
        expect(passwordService.confirmReset).toHaveBeenCalledWith(
          expect.objectContaining({
            uidb64: customParams.uidb64,
            token: customParams.token,
          }),
        ),
      );
    });
  });
});
