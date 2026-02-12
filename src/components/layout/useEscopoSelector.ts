import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthToken } from '@/api/http';
import { authService, type EscopoGrupo, type EscopoUa, type User } from '@/auth/auth.service';
import { setEscopoStorage } from '@/lib/escopo-storage';
import { toast } from 'sonner';

type UseEscopoSelectorParams = {
  user?: User | null;
};

export function useEscopoSelector({ user }: UseEscopoSelectorParams) {
  const queryClient = useQueryClient();
  const [filter, setFilter] = React.useState('');
  const [openGroups, setOpenGroups] = React.useState<Record<number, boolean>>({});

  const grupos = React.useMemo(
    () => user?.opcoes_escopo?.grupos ?? [],
    [user?.opcoes_escopo?.grupos],
  );

  const selectedValue = user?.ua_ativa
    ? `ua:${user.ua_ativa.id}`
    : user?.uo_ativa
      ? `uo:${user.uo_ativa.id}`
      : '';

  const selectedLabel = user?.ua_ativa?.label ?? user?.uo_ativa?.label ?? 'Selecione a unidade';

  const selecionarEscopoMutation = useMutation({
    mutationFn: authService.selecionarEscopo,
  });

  const handleEscopoSuccess = async (
    payload: { uoId: number | null; uaId: number | null },
    label: string,
  ) => {
    if (!getAuthToken()) return;
    await queryClient.refetchQueries({ queryKey: ['user'] });
    setEscopoStorage(payload);
    toast.success('Unidade Atualizada', {
      description: label,
    });
  };

  const findUaById = (escopoGrupos: EscopoGrupo[], uaId: number): EscopoUa | undefined => {
    for (const grupo of escopoGrupos) {
      const ua = grupo.uas.find((item) => item.unidade_administrativa_id === uaId);
      if (ua) return ua;
    }
    return undefined;
  };

  const handleSelectUo = (grupo: EscopoGrupo) => {
    selecionarEscopoMutation.mutate(
      {
        unidade_administrativa_id: null,
        unidade_orcamentaria_id: grupo.uo.unidade_orcamentaria_id,
      },
      {
        onSuccess: async () => {
          await handleEscopoSuccess({ uoId: grupo.uo.id, uaId: null }, grupo.uo.label);
        },
      },
    );
  };

  const handleSelectUa = (ua: EscopoUa) => {
    selecionarEscopoMutation.mutate(
      {
        unidade_administrativa_id: ua.unidade_administrativa_id,
      },
      {
        onSuccess: async () => {
          await handleEscopoSuccess(
            {
              uoId: ua.unidade_orcamentaria_id,
              uaId: ua.unidade_administrativa_id,
            },
            ua.label,
          );
        },
      },
    );
  };

  const selectEscopoByValue = (value: string) => {
    if (!value || value === selectedValue || grupos.length === 0) return false;

    const [tipo, idRaw] = value.split(':');
    const id = Number(idRaw);
    if (!id || Number.isNaN(id)) return false;

    if (tipo === 'uo') {
      const grupo = grupos.find((item) => item.uo.id === id);
      if (!grupo) return false;
      handleSelectUo(grupo);
      return true;
    }

    if (tipo === 'ua') {
      const ua = findUaById(grupos, id);
      if (!ua) return false;
      handleSelectUa(ua);
      return true;
    }

    return false;
  };

  const filteredGroups = React.useMemo(() => {
    const normalizedFilter = filter.trim().toLowerCase();
    if (!normalizedFilter) return grupos;

    return grupos
      .map((grupo) => {
        const uoMatches = [grupo.uo.label, grupo.uo.nome, grupo.uo.codigo]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedFilter));

        if (uoMatches) {
          return grupo;
        }

        const uas = grupo.uas.filter((ua) =>
          [ua.label, ua.nome, ua.codigo]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(normalizedFilter)),
        );

        if (uas.length === 0) return null;

        return { ...grupo, uas };
      })
      .filter((grupo): grupo is EscopoGrupo => !!grupo);
  }, [filter, grupos]);

  const isGroupExpanded = (uoId: number) => {
    return filter.length > 0 || (openGroups[uoId] ?? true);
  };

  const updateGroupExpanded = (uoId: number, open: boolean) => {
    if (filter.length > 0) return;
    setOpenGroups((prev) => ({ ...prev, [uoId]: open }));
  };

  return {
    grupos,
    filter,
    setFilter,
    selectedValue,
    selectedLabel,
    filteredGroups,
    isGroupExpanded,
    updateGroupExpanded,
    selectEscopoByValue,
    selecionarEscopoMutation,
  };
}
