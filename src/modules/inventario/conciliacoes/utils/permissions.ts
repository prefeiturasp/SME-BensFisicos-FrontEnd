type ConciliacoesUser = {
  is_superuser?: boolean;
  is_gestor_patrimonio?: boolean;
  is_operador_inventario?: boolean;
} | null | undefined;

export function canAccessConciliacoes(user: ConciliacoesUser) {
  if (!user) {
    return false;
  }

  return Boolean(
    user.is_superuser || user.is_gestor_patrimonio || user.is_operador_inventario,
  );
}
