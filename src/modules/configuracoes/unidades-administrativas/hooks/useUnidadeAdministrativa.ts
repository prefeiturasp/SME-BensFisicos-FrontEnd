import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { unidadesAdministrativasService } from '../services/unidades-administrativas.service';
import type { UpdateUnidadeAdministrativaPayload } from '../types/unidades-administrativas.types';

interface UseUnidadeAdministrativaUpdateParams {
  id: number;
  payload: UpdateUnidadeAdministrativaPayload;
}

export function useUnidadeAdministrativaById(id: number | null) {
  return useQuery({
    queryKey: ['unidade-administrativa', id],
    queryFn: () => unidadesAdministrativasService.retrieve(id as number),
    enabled: Boolean(id),
  });
}

export function useUnidadeAdministrativaUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: UseUnidadeAdministrativaUpdateParams) =>
      unidadesAdministrativasService.update(id, payload),
    onSuccess: (updatedUnidade) => {
      queryClient.setQueryData(['unidade-administrativa', updatedUnidade.id], updatedUnidade);
      queryClient.invalidateQueries({ queryKey: ['unidades-administrativas'] });
    },
  });
}
