import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UnidadesOrcamentariasViewPage from '../UnidadesOrcamentariasViewPage';

const navigateMock = vi.fn();
let routeId = '12';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useParams: () => ({ id: routeId }),
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

describe('UnidadesOrcamentariasViewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeId = '12';
  });

  it('renderiza página placeholder de visualização', () => {
    render(
      <MemoryRouter>
        <UnidadesOrcamentariasViewPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Visualizar Unidade Orçamentária' })).toBeInTheDocument();
    expect(screen.getByText('Página em branco preparada para a próxima etapa.')).toBeInTheDocument();
    expect(screen.getByText('ID recebido da rota: 12')).toBeInTheDocument();
  });

  it('exibe mensagem de id inválido quando rota é inválida', () => {
    routeId = 'abc';

    render(
      <MemoryRouter>
        <UnidadesOrcamentariasViewPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Identificador da Unidade Orçamentária inválido.')).toBeInTheDocument();
  });

  it('volta para a listagem ao clicar em Voltar', () => {
    render(
      <MemoryRouter>
        <UnidadesOrcamentariasViewPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));

    expect(navigateMock).toHaveBeenCalledWith('/unidades-orcamentarias');
  });
});