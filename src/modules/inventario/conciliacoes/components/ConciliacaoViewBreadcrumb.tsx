import { ListOrdered } from 'lucide-react';
import { AppBreadcrumb } from '@/components/AppBreadcrumb';

export function ConciliacaoViewBreadcrumb() {
  return (
    <AppBreadcrumb
      items={[
        { label: 'Inventário', icon: ListOrdered },
        { label: 'Gerenciamento de Conciliações', to: '/conciliacoes' },
        { label: 'Visualizar Conciliação', isActive: true },
      ]}
    />
  );
}
