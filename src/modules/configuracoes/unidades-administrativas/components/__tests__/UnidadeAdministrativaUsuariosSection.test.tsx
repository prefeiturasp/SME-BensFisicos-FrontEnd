import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UnidadeAdministrativaUsuario } from '../../types/unidades-administrativas.types';
import { UnidadeAdministrativaUsuariosSection } from '../UnidadeAdministrativaUsuariosSection';

const navigateMock = vi.fn();

let queryData: { count: number; results: UnidadeAdministrativaUsuario[] } | undefined;
let queryLoading = false;
let queryError = false;

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('../../hooks/useUnidadeAdministrativaUsuarios', () => ({
  UA_USUARIOS_PAGE_SIZE: 10,
  useUnidadeAdministrativaUsuarios: () => ({
    data: queryData,
    isLoading: queryLoading,
    isError: queryError,
  }),
}));

function buildUsuario(
  overrides: Partial<UnidadeAdministrativaUsuario> = {},
): UnidadeAdministrativaUsuario {
  return {
    id: 1,
    username: 'joao.silva',
    nome: 'João Silva',
    rf: '1234567',
    ...overrides,
  };
}

describe('UnidadeAdministrativaUsuariosSection', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    queryData = { count: 0, results: [] };
    queryLoading = false;
    queryError = false;
  });

  it('exibe título e colunas Nome e RF', () => {
    queryData = { count: 1, results: [buildUsuario()] };

    render(
      <MemoryRouter>
        <UnidadeAdministrativaUsuariosSection unidadeId={10} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Usuários Associados')).toBeInTheDocument();
    expect(screen.getByText('Nome')).toBeInTheDocument();
    expect(screen.getByText('RF')).toBeInTheDocument();
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('1234567')).toBeInTheDocument();
  });

  it('exibe "-" quando o usuário não possui RF cadastrado', () => {
    queryData = { count: 1, results: [buildUsuario({ rf: '' })] };

    render(
      <MemoryRouter>
        <UnidadeAdministrativaUsuariosSection unidadeId={10} />
      </MemoryRouter>,
    );

    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('usa o username quando o nome não está preenchido', () => {
    queryData = { count: 1, results: [buildUsuario({ nome: '' })] };

    render(
      <MemoryRouter>
        <UnidadeAdministrativaUsuariosSection unidadeId={10} />
      </MemoryRouter>,
    );

    expect(screen.getByText('joao.silva')).toBeInTheDocument();
  });

  it('exibe mensagem de lista vazia quando a UA não possui usuários associados', () => {
    queryData = { count: 0, results: [] };

    render(
      <MemoryRouter>
        <UnidadeAdministrativaUsuariosSection unidadeId={10} />
      </MemoryRouter>,
    );

    expect(
      screen.getByText('Nenhum usuário associado a esta Unidade Administrativa.'),
    ).toBeInTheDocument();
  });

  it('exibe mensagem de carregamento enquanto busca os usuários', () => {
    queryLoading = true;

    render(
      <MemoryRouter>
        <UnidadeAdministrativaUsuariosSection unidadeId={10} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Carregando usuários associados...')).toBeInTheDocument();
  });

  it('redireciona para o detalhamento do usuário ao clicar em visualizar', () => {
    queryData = { count: 1, results: [buildUsuario({ id: 42 })] };

    render(
      <MemoryRouter>
        <UnidadeAdministrativaUsuariosSection unidadeId={10} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Visualizar usuário João Silva' }));

    expect(navigateMock).toHaveBeenCalledWith('/usuarios/42');
  });

  it('não renderiza a seção quando a consulta de usuários falha', () => {
    queryError = true;

    const { container } = render(
      <MemoryRouter>
        <UnidadeAdministrativaUsuariosSection unidadeId={10} />
      </MemoryRouter>,
    );

    expect(screen.queryByText('Usuários Associados')).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });
});