import type { User } from '@/auth/auth.service';

type PermissionFields = Partial<
  Pick<User, 'is_superuser' | 'is_gestor_patrimonio' | 'is_operador_inventario'>
>;

export function canAccessConciliacoes(user: PermissionFields | null | undefined) {
  if (!user) {
    return false;
  }

  return Boolean(
    user.is_superuser || user.is_gestor_patrimonio || user.is_operador_inventario,
  );
}
