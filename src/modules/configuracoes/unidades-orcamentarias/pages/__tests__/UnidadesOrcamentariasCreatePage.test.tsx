import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UnidadesOrcamentariasCreatePage from '../UnidadesOrcamentariasCreatePage';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/auth/useAuth', () => ({
  useAuth: () => ({
    isLoading: false,
    user: {
      is_superuser: true,
    },
  }),
}));

describe('UnidadesOrcamentariasCreatePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza página placeholder de criação', () => {
    render(
      <MemoryRouter>
        <UnidadesOrcamentariasCreatePage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Adicionar Unidade Orçamentária' })).toBeInTheDocument();
    expect(screen.getByText('Página em branco preparada para a próxima etapa.')).toBeInTheDocument();
  });

  it('volta para a listagem ao clicar em Voltar', () => {
    render(
      <MemoryRouter>
        <UnidadesOrcamentariasCreatePage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));

    expect(navigateMock).toHaveBeenCalledWith('/unidades-orcamentarias');
  });
});