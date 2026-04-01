import { Settings } from 'lucide-react';
import { AppBreadcrumb } from '@/components/AppBreadcrumb';

export function UnidadesAdministrativasCreateBreadcrumb() {
  return (
    <AppBreadcrumb
      items={[
        { label: 'Configurações', icon: Settings },
        { label: 'Unidades Administrativas', to: '/unidades-administrativas' },
        { label: 'Adicionar Unidade Administrativa', isActive: true },
      ]}
    />
  );
}
