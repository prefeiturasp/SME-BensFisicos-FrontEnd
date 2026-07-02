import { useMutation, useQueryClient } from '@tanstack/react-query';
import { conciliacoesService } from '../services/conciliacoes.service';
import type { CreateConciliacaoPayload } from '../types/conciliacoes.types';

export function useConciliacaoCreate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateConciliacaoPayload) => conciliacoesService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conciliacoes'] });
    },
  });
}
