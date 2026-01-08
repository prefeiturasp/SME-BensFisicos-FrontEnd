import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import VerifyEmailPage from './VerifyEmailPage';

describe('VerifyEmailPage', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  function renderComponent(initialEntries = ['/verify-email']) {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path='/' element={<div>Login Page</div>} />
          <Route path='/verify-email' element={<VerifyEmailPage />} />
        </Routes>
      </MemoryRouter>,
    );
  }

  describe('Renderização e Layout', () => {
    it('renderiza a estrutura base do layout com logos', () => {
      renderComponent();

      expect(screen.getByAltText('Logo Bens Físicos')).toBeInTheDocument();

      expect(screen.getByAltText('Prefeitura de São Paulo')).toBeInTheDocument();
    });

    it('renderiza o título "Verifique seu e-mail"', () => {
      renderComponent();
      expect(
        screen.getByRole('heading', { level: 1, name: /Verifique seu e-mail/i }),
      ).toBeInTheDocument();
    });

    it('renderiza o ícone de e-mail e mensagem de sucesso', () => {
      const { container } = renderComponent();

      expect(screen.getByText('E-mail enviado com sucesso!')).toBeInTheDocument();

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renderiza os textos informativos corretamente', () => {
      renderComponent();

      expect(
        screen.getByText(/Se o e-mail informado estiver cadastrado no sistema/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/você receberá um link para redefinir sua senha/i),
      ).toBeInTheDocument();

      expect(
        screen.getByText(/Verifique sua caixa de entrada e também a pasta de spam/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/O link expira em 1 hora/i)).toBeInTheDocument();
    });

    it('renderiza o botão de voltar ao login', () => {
      renderComponent();

      const backLink = screen.getByRole('link', { name: /Voltar ao Login/i });
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute('href', '/');
    });
  });

  describe('Navegação', () => {
    it('redireciona para a página de login ao clicar no botão "Voltar ao Login"', async () => {
      renderComponent();

      const user = userEvent.setup();
      const backLink = screen.getByRole('link', { name: /Voltar ao Login/i });

      await user.click(backLink);

      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });

  describe('Acessibilidade', () => {
    it('o link de "Voltar ao Login" é acessível como botão/link', () => {
      renderComponent();

      const link = screen.getByRole('link', { name: /Voltar ao Login/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAccessibleName('Voltar ao Login');
    });

    it('imagens possuem texto alternativo (alt)', () => {
      renderComponent();

      const logos = screen.getAllByRole('img');
      expect(logos.length).toBeGreaterThanOrEqual(2);
      logos.forEach((img) => {
        expect(img).toHaveAttribute('alt');
      });
    });
  });
});
