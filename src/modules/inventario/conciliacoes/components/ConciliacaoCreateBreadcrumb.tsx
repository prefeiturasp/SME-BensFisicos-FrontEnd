import { ListOrdered } from 'lucide-react';
import { AppBreadcrumb } from '@/components/AppBreadcrumb';

export function ConciliacaoCreateBreadcrumb() {
  return (
    <AppBreadcrumb
      items={[
        { label: 'Inventário', icon: ListOrdered },
        { label: 'Gerenciamento de Conciliações', to: '/conciliacoes' },
        { label: 'Adicionar Conciliação', isActive: true },
      ]}
    />
  );
}
