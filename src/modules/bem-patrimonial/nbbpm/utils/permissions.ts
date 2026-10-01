import type { User } from '@/auth/auth.service';

type NbbpmPermissionFields = Partial<Pick<User, 'is_superuser' | 'is_gestor_patrimonio'>>;

/**
 * Consulta de NBBPMs: mesma regra do backend (`IsGestorPatrimonioOrSuperUser`
 * em `nbbpm_api_views.py`). O backend continua sendo a fonte da verdade —
 * isto apenas evita expor menu/tela a quem receberia 403.
 */
export function canAccessNbbpm(user: NbbpmPermissionFields | null | undefined) {
  return Boolean(user?.is_superuser || user?.is_gestor_patrimonio);
}
