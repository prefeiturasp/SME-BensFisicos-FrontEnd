import type { User } from '@/auth/auth.service';

type ParametrosPermissionFields = Partial<
  Pick<User, 'is_superuser' | 'is_gestor_patrimonio'>
>;

export function canAccessParametrosConciliacao(
  user: ParametrosPermissionFields | null | undefined,
) {
  return Boolean(user?.is_superuser || user?.is_gestor_patrimonio);
}
