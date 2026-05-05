type ParametrosConciliacaoUser = {
  is_superuser?: boolean;
  is_gestor_patrimonio?: boolean;
} | null | undefined;

export function canAccessParametrosConciliacao(user: ParametrosConciliacaoUser) {
  return Boolean(user?.is_superuser || user?.is_gestor_patrimonio);
}
