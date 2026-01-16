import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ChangePasswordPage from './ChangePasswordPage';
import { passwordService } from '../services/password.service';
import { toast } from 'sonner';

vi.mock('../services/password.service', () => ({
  passwordService: {
    changePassword: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('ChangePasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  function setupServiceMock({ shouldReject = false, errorMessage = '' } = {}) {
    vi.mocked(passwordService.changePassword).mockImplementation(async () => {
      if (shouldReject) {
        throw new Error(errorMessage || 'Erro ao trocar senha.');
      }
      return Promise.resolve();
    });
  }

  function renderComponent() {
    return render(
      <MemoryRouter>
        <ChangePasswordPage />
      </MemoryRouter>,
    );
  }

  describe('Renderização', () => {
    it('renderiza título, instruções e campos do formulário', () => {
      renderComponent();

      expect(screen.getByRole('heading', { name: 'Trocar senha' })).toBeInTheDocument();
      expect(screen.getByText('Atualize sua senha:')).toBeInTheDocument();

      expect(
        screen.getByText(/Sua nova senha não deve conter informações pessoais/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/Sua senha deve ter ao menos 6 caracteres/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Sua senha deve conter letras, números e caracteres especiais/i),
      ).toBeInTheDocument();

      expect(screen.getByLabelText('Senha atual')).toBeInTheDocument();
      expect(screen.getByLabelText('Nova senha')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirme a nova senha')).toBeInTheDocument();

      const submitBtn = screen.getByRole('button', { name: /Salvar/i });
      expect(submitBtn).toBeInTheDocument();
      expect(submitBtn).toBeEnabled();
    });
  });

  describe('Validações', () => {
    it('mostra erro de campo obrigatório se tentar enviar vazio', async () => {
      const user = userEvent.setup();
      renderComponent();

      const btn = screen.getByRole('button', { name: /Salvar/i });
      await user.click(btn);

      expect(await screen.findByText('Senha atual é obrigatória')).toBeInTheDocument();
      expect(passwordService.changePassword).not.toHaveBeenCalled();
    });

    it('mostra erro quando senha nova tem menos de 6 caracteres', async () => {
      const user = userEvent.setup();
      renderComponent();

      const newPasswordInput = screen.getByLabelText('Nova senha');
      const confirmInput = screen.getByLabelText('Confirme a nova senha');
      const btn = screen.getByRole('button', { name: /Salvar/i });

      await user.type(newPasswordInput, 'Ab1!');
      await user.type(confirmInput, 'Ab1!');
      await user.click(btn);

      expect(
        await screen.findByText(/A senha deve ter no mínimo 6 caracteres/i),
      ).toBeInTheDocument();
    });

    it('mostra erro quando senha nova não contém letras', async () => {
      const user = userEvent.setup();
      renderComponent();

      const newPasswordInput = screen.getByLabelText('Nova senha');
      const btn = screen.getByRole('button', { name: /Salvar/i });

      await user.type(newPasswordInput, '123456!@#');
      await user.click(btn);

      expect(await screen.findByText('A senha deve conter letras')).toBeInTheDocument();
    });

    it('mostra erro quando senha nova não contém números', async () => {
      const user = userEvent.setup();
      renderComponent();

      const newPasswordInput = screen.getByLabelText('Nova senha');
      const btn = screen.getByRole('button', { name: /Salvar/i });

      await user.type(newPasswordInput, 'AbCdEf!@#');
      await user.click(btn);

      expect(await screen.findByText(/A senha deve conter números/i)).toBeInTheDocument();
    });

    it('mostra erro quando senha nova não contém caracteres especiais', async () => {
      const user = userEvent.setup();
      renderComponent();

      const newPasswordInput = screen.getByLabelText('Nova senha');
      const btn = screen.getByRole('button', { name: /Salvar/i });

      await user.type(newPasswordInput, 'AbCdEf123');
      await user.click(btn);

      expect(
        await screen.findByText(/A senha deve conter caracteres especiais/i),
      ).toBeInTheDocument();
    });

    it('mostra erro quando as senhas não coincidem', async () => {
      const user = userEvent.setup();
      renderComponent();

      const oldPasswordInput = screen.getByLabelText('Senha atual');
      const newPasswordInput = screen.getByLabelText('Nova senha');
      const confirmInput = screen.getByLabelText('Confirme a nova senha');
      const btn = screen.getByRole('button', { name: /Salvar/i });

      await user.type(oldPasswordInput, 'SenhaAntiga123!');
      await user.type(newPasswordInput, 'SenhaNova123!');
      await user.type(confirmInput, 'SenhaDiferente123!');
      await user.click(btn);

      expect(await screen.findByText(/As senhas não coincidem/i)).toBeInTheDocument();
    });
  });

  describe('Interações', () => {
    it('envia dados corretos ao submeter o formulário com sucesso', async () => {
      setupServiceMock();
      const user = userEvent.setup();
      renderComponent();

      const oldPasswordInput = screen.getByLabelText('Senha atual');
      const newPasswordInput = screen.getByLabelText('Nova senha');
      const confirmInput = screen.getByLabelText('Confirme a nova senha');
      const btn = screen.getByRole('button', { name: /Salvar/i });

      const OLD_PASS = 'VelhaSenha123!';
      const NEW_PASS = 'NovaSenha123!';

      await user.type(oldPasswordInput, OLD_PASS);
      await user.type(newPasswordInput, NEW_PASS);
      await user.type(confirmInput, NEW_PASS);
      await user.click(btn);

      await waitFor(() => {
        expect(passwordService.changePassword).toHaveBeenCalledWith({
          old_password: OLD_PASS,
          new_password: NEW_PASS,
          new_password_confirm: NEW_PASS,
        });
      });
    });

    it('exibe toast de sucesso e navega para home após alteração', async () => {
      setupServiceMock();
      const user = userEvent.setup();
      renderComponent();

      const oldPasswordInput = screen.getByLabelText('Senha atual');
      const newPasswordInput = screen.getByLabelText('Nova senha');
      const confirmInput = screen.getByLabelText('Confirme a nova senha');
      const btn = screen.getByRole('button', { name: /Salvar/i });

      const validPass = 'SenhaValida123@';

      await user.type(oldPasswordInput, 'Antiga123@');
      await user.type(newPasswordInput, validPass);
      await user.type(confirmInput, validPass);
      await user.click(btn);

      await waitFor(() => expect(passwordService.changePassword).toHaveBeenCalled());

      expect(toast.success).toHaveBeenCalledWith('Senha alterada com sucesso!', expect.anything());

      await new Promise((resolve) => setTimeout(resolve, 1600));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/home');
      });
    });
  });

  describe('Estados (loading / erro)', () => {
    it('botão fica desabilitado e mostra "Salvando..." durante requisição', async () => {
      vi.mocked(passwordService.changePassword).mockImplementation(() => new Promise(() => {}));

      const user = userEvent.setup();
      renderComponent();

      const oldPasswordInput = screen.getByLabelText('Senha atual');
      const newPasswordInput = screen.getByLabelText('Nova senha');
      const confirmInput = screen.getByLabelText('Confirme a nova senha');
      const btn = screen.getByRole('button', { name: /Salvar/i });

      const validPass = 'SenhaValida123@';

      await user.type(oldPasswordInput, 'Antiga123@');
      await user.type(newPasswordInput, validPass);
      await user.type(confirmInput, validPass);
      await user.click(btn);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Salvando.../i })).toBeDisabled();
      });
    });

    it('exibe mensagem de erro quando o serviço falha', async () => {
      setupServiceMock({ shouldReject: true, errorMessage: 'Senha atual incorreta.' });

      const user = userEvent.setup();
      renderComponent();

      const oldPasswordInput = screen.getByLabelText('Senha atual');
      const newPasswordInput = screen.getByLabelText('Nova senha');
      const confirmInput = screen.getByLabelText('Confirme a nova senha');
      const btn = screen.getByRole('button', { name: /Salvar/i });

      const validPass = 'SenhaValida123@';

      await user.type(oldPasswordInput, 'Errada123@');
      await user.type(newPasswordInput, validPass);
      await user.type(confirmInput, validPass);
      await user.click(btn);

      expect(await screen.findByText('Senha atual incorreta.')).toBeInTheDocument();

      expect(screen.getByRole('button', { name: /Salvar/i })).toBeEnabled();
    });

    it('reabilita o botão após erro', async () => {
      setupServiceMock({ shouldReject: true });
      const user = userEvent.setup();
      renderComponent();

      const oldPasswordInput = screen.getByLabelText('Senha atual');
      const newPasswordInput = screen.getByLabelText('Nova senha');
      const confirmInput = screen.getByLabelText('Confirme a nova senha');
      const btn = screen.getByRole('button', { name: /Salvar/i });

      const validPass = 'SenhaValida123@';
      await user.type(oldPasswordInput, 'Antiga123@');
      await user.type(newPasswordInput, validPass);
      await user.type(confirmInput, validPass);

      await user.click(btn);

      await screen.findByRole('alert');

      expect(btn).toBeEnabled();
      expect(btn).toHaveTextContent('Salvar');
    });

    it('limpa mensagem de erro ao reenviar', async () => {
      setupServiceMock({ shouldReject: true, errorMessage: 'Erro inicial' });
      const user = userEvent.setup();
      renderComponent();

      const oldPasswordInput = screen.getByLabelText('Senha atual');
      const newPasswordInput = screen.getByLabelText('Nova senha');
      const confirmInput = screen.getByLabelText('Confirme a nova senha');
      const btn = screen.getByRole('button', { name: /Salvar/i });

      const validPass = 'SenhaValida123@';
      await user.type(oldPasswordInput, 'Antiga123@');
      await user.type(newPasswordInput, validPass);
      await user.type(confirmInput, validPass);

      await user.click(btn);
      expect(await screen.findByText('Erro inicial')).toBeInTheDocument();

      vi.clearAllMocks();
      setupServiceMock();

      await user.click(btn);

      await waitFor(() => {
        expect(screen.queryByText('Erro inicial')).not.toBeInTheDocument();
      });
    });

    it('foca no campo de senha atual se o erro for relacionado a ela', async () => {
      setupServiceMock({ shouldReject: true, errorMessage: 'A senha atual está incorreta.' });

      const user = userEvent.setup();
      renderComponent();

      const oldPasswordInput = screen.getByLabelText('Senha atual');
      const newPasswordInput = screen.getByLabelText('Nova senha');
      const confirmInput = screen.getByLabelText('Confirme a nova senha');
      const btn = screen.getByRole('button', { name: /Salvar/i });

      const validPass = 'SenhaValida123@';
      await user.type(oldPasswordInput, 'Errada123@');
      await user.type(newPasswordInput, validPass);
      await user.type(confirmInput, validPass);

      newPasswordInput.focus();

      await user.click(btn);

      await waitFor(() => {
        expect(oldPasswordInput).toHaveFocus();
      });
    });
  });
});
