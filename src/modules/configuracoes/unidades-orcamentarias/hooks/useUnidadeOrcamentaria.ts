import { useMutation, useQueryClient } from '@tanstack/react-query';
import { unidadesOrcamentariasService } from '../services/unidades-orcamentarias.service';
import type { CreateUnidadeOrcamentariaPayload } from '../types/unidades-orcamentarias.types';

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