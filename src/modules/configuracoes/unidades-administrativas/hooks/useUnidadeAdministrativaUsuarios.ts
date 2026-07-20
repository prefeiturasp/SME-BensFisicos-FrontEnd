import { useQuery } from '@tanstack/react-query';
import { usuarioService, type PaginatedResponse, type Usuario } from '@/modules/configuracoes/usuarios/service/usuario.service';

export const UA_USUARIOS_PAGE_SIZE = 10;

interface UseUnidadeAdministrativaUsuariosParams {
  unidadeId: number | null;
  page: number;
}

/**
 * Recupera os usuários associados à Unidade Administrativa informada,
 * considerando o relacionamento entre Usuário e UA existente na base
 * (UA ativa e vínculos adicionais).
 *
 * A consulta reutiliza o endpoint de usuários, portanto respeita as
 * regras de autenticação, autorização e escopo já existentes no sistema.
 */
export function useUnidadeAdministrativaUsuarios({
  unidadeId,
  page,
}: Readonly<UseUnidadeAdministrativaUsuariosParams>) {
  return useQuery<PaginatedResponse<Usuario>>({
    queryKey: ['unidade-administrativa-usuarios', unidadeId, page],
    queryFn: () =>
      usuarioService.list({
        unidade_administrativa_id: unidadeId,
        page,
        page_size: UA_USUARIOS_PAGE_SIZE,
        ordering: 'nome',
      }),
    enabled: Boolean(unidadeId),
    retry: false,
  });
}