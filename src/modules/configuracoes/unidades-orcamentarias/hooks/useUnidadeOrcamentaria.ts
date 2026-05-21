import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { unidadesOrcamentariasService } from '../services/unidades-orcamentarias.service';
import type {
  CreateUnidadeOrcamentariaPayload,
  UpdateUnidadeOrcamentariaPayload,
} from '../types/unidades-orcamentarias.types';

interface UseUnidadeOrcamentariaUpdateParams {
  id: number;
  payload: UpdateUnidadeOrcamentariaPayload;
}

export function useUnidadeOrcamentariaById(id: number | null) {
  return useQuery({
    queryKey: ['unidade-orcamentaria', id],
    queryFn: () => unidadesOrcamentariasService.retrieve(id as number),
    enabled: Boolean(id),
  });
}

export function useUnidadeOrcamentariaCreate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateUnidadeOrcamentariaPayload) =>
      unidadesOrcamentariasService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unidades-orcamentarias'] });
    },
  });
}

export function useUnidadeOrcamentariaUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: UseUnidadeOrcamentariaUpdateParams) =>
      unidadesOrcamentariasService.update(id, payload),
    onSuccess: (updatedUnidade) => {
      queryClient.setQueryData(['unidade-orcamentaria', updatedUnidade.id], updatedUnidade);
      queryClient.invalidateQueries({ queryKey: ['unidades-orcamentarias'] });
    },
  });
}