import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UnidadeAdministrativaUsuario } from '../../types/unidades-administrativas.types';
import { UnidadeAdministrativaUsuariosSection } from '../UnidadeAdministrativaUsuariosSection';

const navigateMock = vi.fn();
const useUnidadeAdministrativaUsuariosMock = vi.fn();
const useAuthMock = vi.fn();

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

vi.mock('@/auth/useAuth', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('../../hooks/useUnidadeAdministrativaUsuarios', () => ({
  UA_USUARIOS_PAGE_SIZE: 10,
  useUnidadeAdministrativaUsuarios: (params: unknown) =>
    useUnidadeAdministrativaUsuariosMock(params),
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

function renderSection(unidadeId = 10) {
  return render(
    <MemoryRouter>
      <UnidadeAdministrativaUsuariosSection unidadeId={unidadeId} />
    </MemoryRouter>,
  );
}

describe('UnidadeAdministrativaUsuariosSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    queryData = { count: 0, results: [] };
    queryLoading = false;
    queryError = false;

    useAuthMock.mockReturnValue({
      user: { id: 1, is_gestor_patrimonio: true },
      isLoading: false,
    });

    useUnidadeAdministrativaUsuariosMock.mockImplementation(() => ({
      data: queryData,
      isLoading: queryLoading,
      isError: queryError,
    }));
  });

  // ===============================
  // PERMISSÃO
  // ===============================

  it('não renderiza a seção para usuários sem is_gestor_patrimonio', () => {
    useAuthMock.mockReturnValue({
      user: { id: 2, is_gestor_patrimonio: false },
      isLoading: false,
    });

    const { container } = renderSection();

    expect(screen.queryByText('Usuários Associados')).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  it('não consulta o endpoint de usuários quando o perfil não é gestor', () => {
    useAuthMock.mockReturnValue({
      user: { id: 2, is_gestor_patrimonio: false },
      isLoading: false,
    });

    renderSection();

    expect(useUnidadeAdministrativaUsuariosMock).not.toHaveBeenCalled();
  });

  it('não renderiza nem consulta quando não há usuário autenticado', () => {
    useAuthMock.mockReturnValue({ user: null, isLoading: false });

    const { container } = renderSection();

    expect(container).toBeEmptyDOMElement();
    expect(useUnidadeAdministrativaUsuariosMock).not.toHaveBeenCalled();
  });

  it('não renderiza quando a flag de gestor não está definida no usuário', () => {
    useAuthMock.mockReturnValue({ user: { id: 3 }, isLoading: false });

    const { container } = renderSection();

    expect(container).toBeEmptyDOMElement();
    expect(useUnidadeAdministrativaUsuariosMock).not.toHaveBeenCalled();
  });

  it('consulta os usuários da unidade informada quando o perfil é gestor', () => {
    renderSection(77);

    expect(useUnidadeAdministrativaUsuariosMock).toHaveBeenCalledWith({
      unidadeId: 77,
      page: 1,
    });
  });

  // ===============================
  // RENDERIZAÇÃO
  // ===============================

  it('exibe título e colunas Nome e RF', () => {
    queryData = { count: 1, results: [buildUsuario()] };

    renderSection();

    expect(screen.getByText('Usuários Associados')).toBeInTheDocument();
    expect(screen.getByText('Nome')).toBeInTheDocument();
    expect(screen.getByText('RF')).toBeInTheDocument();
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('1234567')).toBeInTheDocument();
  });

  it('exibe "-" quando o usuário não possui RF cadastrado', () => {
    queryData = { count: 1, results: [buildUsuario({ rf: '' })] };

    renderSection();

    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('usa o username quando o nome não está preenchido', () => {
    queryData = { count: 1, results: [buildUsuario({ nome: '' })] };

    renderSection();

    expect(screen.getByText('joao.silva')).toBeInTheDocument();
  });

  it('exibe mensagem de lista vazia quando a UA não possui usuários associados', () => {
    queryData = { count: 0, results: [] };

    renderSection();

    expect(
      screen.getByText('Nenhum usuário associado a esta Unidade Administrativa.'),
    ).toBeInTheDocument();
  });

  it('exibe mensagem de carregamento enquanto busca os usuários', () => {
    queryLoading = true;

    renderSection();

    expect(screen.getByText('Carregando usuários associados...')).toBeInTheDocument();
  });

  it('renderiza a seção mesmo quando a consulta ainda não retornou dados', () => {
    queryData = undefined;

    renderSection();

    expect(screen.getByText('Usuários Associados')).toBeInTheDocument();
  });

  // ===============================
  // NAVEGAÇÃO
  // ===============================

  it('redireciona para o detalhamento do usuário ao clicar em visualizar', () => {
    queryData = { count: 1, results: [buildUsuario({ id: 42 })] };

    renderSection();

    fireEvent.click(screen.getByRole('button', { name: 'Visualizar usuário João Silva' }));

    expect(navigateMock).toHaveBeenCalledWith('/usuarios/42');
  });

  it('usa o username no rótulo de acessibilidade quando não há nome', () => {
    queryData = { count: 1, results: [buildUsuario({ id: 43, nome: '' })] };

    renderSection();

    fireEvent.click(screen.getByRole('button', { name: 'Visualizar usuário joao.silva' }));

    expect(navigateMock).toHaveBeenCalledWith('/usuarios/43');
  });

  // ===============================
  // ERRO
  // ===============================

  it('não renderiza a seção quando a consulta de usuários falha', () => {
    queryError = true;

    const { container } = renderSection();

    expect(screen.queryByText('Usuários Associados')).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });
});