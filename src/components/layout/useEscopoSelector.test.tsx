import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEscopoSelector } from './useEscopoSelector';
import type { User } from '@/auth/auth.service';
import { getAuthToken } from '@/api/http';
import { setEscopoStorage } from '@/lib/escopo-storage';
import { toast } from 'sonner';

const mockMutate = vi.fn();
const mockRefetchQueries = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useMutation: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
  useQueryClient: () => ({
    refetchQueries: mockRefetchQueries,
  }),
}));

vi.mock('@/api/http', () => ({
  getAuthToken: vi.fn(),
}));

vi.mock('@/lib/escopo-storage', () => ({
  setEscopoStorage: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
  },
}));

function createUser(): User {
  return {
    id: 1,
    username: 'matheus',
    nome: 'Matheus',
    email: 'matheus@email.com',
    rf: '123',
    is_gestor_patrimonio: true,
    is_operador_inventario: false,
    must_change_password: false,
    uo_ativa: {
      id: 1,
      codigo: '01.16.10',
      nome: 'SECRETARIA MUNICIPAL DE EDUCACAO',
      label: '01.16.10 - SECRETARIA MUNICIPAL DE EDUCACAO',
    },
    ua_ativa: {
      id: 129,
      codigo: '00.00.00.002',
      nome: 'COTIC',
      label: '00.00.00.002 - COTIC',
    },
    opcoes_escopo: {
      grupos: [
        {
          uo: {
            id: 1,
            codigo: '01.16.10',
            nome: 'SECRETARIA MUNICIPAL DE EDUCACAO',
            label: '01.16.10 - SECRETARIA MUNICIPAL DE EDUCACAO',
            selecionavel: true,
            unidade_administrativa_id: null,
            unidade_orcamentaria_id: 1,
          },
          uas: [
            {
              id: 129,
              codigo: '00.00.00.002',
              nome: 'COTIC',
              label: '00.00.00.002 - COTIC',
              unidade_administrativa_id: 129,
              unidade_orcamentaria_id: 1,
            },
            {
              id: 130,
              codigo: '00.00.00.003',
              nome: 'NUTEL',
              label: '00.00.00.003 - NUTEL',
              unidade_administrativa_id: 130,
              unidade_orcamentaria_id: 1,
            },
          ],
        },
      ],
    },
  };
}

describe('useEscopoSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRefetchQueries.mockResolvedValue(undefined);
    mockMutate.mockImplementation((_payload, options) => {
      options?.onSuccess?.();
    });
    vi.mocked(getAuthToken).mockReturnValue('token');
  });

  it('deve montar estado inicial com usuário atual', () => {
    const user = createUser();
    const { result } = renderHook(() => useEscopoSelector({ user }));

    expect(result.current.selectedValue).toBe('ua:129');
    expect(result.current.selectedLabel).toBe('00.00.00.002 - COTIC');
    expect(result.current.grupos).toHaveLength(1);
  });

  it('deve filtrar grupos por texto de UO e UA', () => {
    const user = createUser();
    const { result } = renderHook(() => useEscopoSelector({ user }));

    act(() => {
      result.current.setFilter('nutel');
    });

    expect(result.current.filteredGroups).toHaveLength(1);
    expect(result.current.filteredGroups[0].uas).toHaveLength(1);
    expect(result.current.filteredGroups[0].uas[0].nome).toBe('NUTEL');
  });

  it('deve controlar expansão manual sem filtro e forçar expansão com filtro', () => {
    const user = createUser();
    const { result } = renderHook(() => useEscopoSelector({ user }));

    expect(result.current.isGroupExpanded(1)).toBe(true);

    act(() => {
      result.current.updateGroupExpanded(1, false);
    });

    expect(result.current.isGroupExpanded(1)).toBe(false);

    act(() => {
      result.current.setFilter('cot');
    });

    expect(result.current.isGroupExpanded(1)).toBe(true);
  });

  it('deve selecionar UO e persistir escopo no sucesso', async () => {
    const user = createUser();
    const { result } = renderHook(() => useEscopoSelector({ user }));

    const selected = result.current.selectEscopoByValue('uo:1');

    expect(selected).toBe(true);
    expect(mockMutate).toHaveBeenCalledWith(
      {
        unidade_administrativa_id: null,
        unidade_orcamentaria_id: 1,
      },
      expect.any(Object),
    );

    await waitFor(() => {
      expect(mockRefetchQueries).toHaveBeenCalledWith({ queryKey: ['user'] });
      expect(setEscopoStorage).toHaveBeenCalledWith({ uoId: 1, uaId: null });
      expect(toast.success).toHaveBeenCalledWith('Unidade Atualizada', {
        description: '01.16.10 - SECRETARIA MUNICIPAL DE EDUCACAO',
      });
    });
  });

  it('não deve persistir escopo se não houver token', async () => {
    vi.mocked(getAuthToken).mockReturnValue(null);
    const user = createUser();
    const { result } = renderHook(() => useEscopoSelector({ user }));

    const selected = result.current.selectEscopoByValue('ua:130');

    expect(selected).toBe(true);

    await waitFor(() => {
      expect(setEscopoStorage).not.toHaveBeenCalled();
      expect(toast.success).not.toHaveBeenCalled();
    });
  });

  it('deve retornar false para valor inválido/igual ao atual', () => {
    const user = createUser();
    const { result } = renderHook(() => useEscopoSelector({ user }));

    expect(result.current.selectEscopoByValue('')).toBe(false);
    expect(result.current.selectEscopoByValue('ua:129')).toBe(false);
    expect(result.current.selectEscopoByValue('ua:999')).toBe(false);
    expect(result.current.selectEscopoByValue('xpto:1')).toBe(false);
  });
});
