import { ListOrdered } from 'lucide-react';
import { AppBreadcrumb } from '@/components/AppBreadcrumb';

export function ConciliacoesListBreadcrumb() {
  return (
    <AppBreadcrumb
      items={[
        { label: 'Inventário', icon: ListOrdered },
        { label: 'Gerenciamento de Conciliações', isActive: true },
      ]}
    />
  );
}
