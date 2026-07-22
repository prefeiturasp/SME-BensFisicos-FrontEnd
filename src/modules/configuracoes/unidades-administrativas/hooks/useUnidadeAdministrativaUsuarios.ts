import { useQuery } from '@tanstack/react-query';
import { unidadesAdministrativasService } from '../services/unidades-administrativas.service';
import type {
  PaginatedResponse,
  UnidadeAdministrativaUsuario,
} from '../types/unidades-administrativas.types';

export const UA_USUARIOS_PAGE_SIZE = 10;

interface UseUnidadeAdministrativaUsuariosParams {
  unidadeId: number | null;
  page: number;
}

/**
 * Recupera os usuários associados à Unidade Administrativa informada,
 * consumindo o endpoint dedicado GET /unidades-administrativas/{id}/usuarios/
 * (UA ativa e vínculos adicionais, sem duplicidade).
 *
 * O backend já aplica as regras de autenticação, autorização e escopo de
 * visualização existentes no sistema, tanto para a UA (via get_object)
 * quanto para os usuários retornados.
 */
export function useUnidadeAdministrativaUsuarios({
  unidadeId,
  page,
}: Readonly<UseUnidadeAdministrativaUsuariosParams>) {
  return useQuery<PaginatedResponse<UnidadeAdministrativaUsuario>>({
    queryKey: ['unidade-administrativa-usuarios', unidadeId, page],
    queryFn: () =>
      unidadesAdministrativasService.usuarios(unidadeId, {
        page,
        page_size: UA_USUARIOS_PAGE_SIZE,
        ordering: 'nome',
      }),
    enabled: Boolean(unidadeId),
    retry: false,
  });
}