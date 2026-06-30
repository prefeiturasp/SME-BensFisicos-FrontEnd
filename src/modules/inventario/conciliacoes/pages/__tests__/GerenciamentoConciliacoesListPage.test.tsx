import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GerenciamentoConciliacoesListPage from '../GerenciamentoConciliacoesListPage';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe('GerenciamentoConciliacoesListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <GerenciamentoConciliacoesListPage />
      </MemoryRouter>,
    );
  };

  it('renderiza o titulo e o breadcrumb da pagina', () => {
    renderComponent();

    expect(
      screen.getByRole('heading', { name: 'Gerenciamento de Conciliações' }),
    ).toBeInTheDocument();

    expect(screen.getByText('Início')).toBeInTheDocument();
    expect(screen.getByText('Inventário')).toBeInTheDocument();
    expect(
      screen.getByText('Gerenciamento de Conciliações', { selector: 'span' }),
    ).toBeInTheDocument();
  });

  it('navega para a tela de adicionar conciliacao ao clicar no botao', () => {
    renderComponent();

    fireEvent.click(screen.getByRole('button', { name: 'Adicionar Conciliação' }));

    expect(navigateMock).toHaveBeenCalledWith('/conciliacoes/novo');
  });

  it('volta para a home ao acionar o botao de voltar', () => {
    renderComponent();

    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));

    expect(navigateMock).toHaveBeenCalledWith('/home');
  });
});
