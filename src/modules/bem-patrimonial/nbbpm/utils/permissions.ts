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

/**
 * Reemissão do documento: mesmo perfil da consulta (Gestor de Patrimônio ou
 * superusuário). Se o backend informar `pode_reemitir: false` para a NBBPM
 * (regra de processo), a ação não é oferecida.
 */
export function canReemitirNbbpm(
  user: NbbpmPermissionFields | null | undefined,
  nbbpm?: { pode_reemitir?: boolean } | null,
) {
  return canAccessNbbpm(user) && nbbpm?.pode_reemitir !== false;
}
