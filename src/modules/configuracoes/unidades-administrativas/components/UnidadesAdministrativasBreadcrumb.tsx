import { Settings } from 'lucide-react';
import { AppBreadcrumb } from '@/components/AppBreadcrumb';

export function UnidadesAdministrativasBreadcrumb() {
  return (
    <AppBreadcrumb
      items={[
        { label: 'Configurações', icon: Settings },
        { label: 'Unidades Administrativas', isActive: true },
      ]}
    />
  );
}
