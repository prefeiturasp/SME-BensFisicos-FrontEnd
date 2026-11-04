import { Building2 } from 'lucide-react';
import { AppBreadcrumb } from '@/components/AppBreadcrumb';

export function UnidadesAdministrativasCreateBreadcrumb() {
  return (
    <AppBreadcrumb
      items={[
        { label: 'Unidades Administrativas', icon: Building2, to: '/unidades-administrativas' },
        { label: 'Adicionar Unidade Administrativa', isActive: true },
      ]}
    />
  );
}