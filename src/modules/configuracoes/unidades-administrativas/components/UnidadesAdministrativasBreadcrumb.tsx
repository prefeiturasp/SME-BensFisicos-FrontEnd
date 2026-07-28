import { Building2 } from 'lucide-react';
import { AppBreadcrumb } from '@/components/AppBreadcrumb';

export function UnidadesAdministrativasBreadcrumb() {
  return (
    <AppBreadcrumb
      items={[{ label: 'Unidades Administrativas', icon: Building2, isActive: true }]}
    />
  );
}