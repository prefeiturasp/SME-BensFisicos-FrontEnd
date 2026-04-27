import { Settings } from 'lucide-react';
import { AppBreadcrumb } from '@/components/AppBreadcrumb';

export function UnidadesOrcamentariasBreadcrumb() {
  return (
    <AppBreadcrumb
      items={[
        { label: 'Configurações', icon: Settings },
        { label: 'Unidades Orçamentárias', isActive: true },
      ]}
    />
  );
}