import { Landmark } from 'lucide-react';
import { AppBreadcrumb } from '@/components/AppBreadcrumb';

export function UnidadesOrcamentariasBreadcrumb() {
  return (
    <AppBreadcrumb
      items={[{ label: 'Unidades Orçamentárias', icon: Landmark, isActive: true }]}
    />
  );
}