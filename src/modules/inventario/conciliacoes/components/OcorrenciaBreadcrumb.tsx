import { ListOrdered } from 'lucide-react';
import { AppBreadcrumb } from '@/components/AppBreadcrumb';

interface OcorrenciaBreadcrumbProps {
  readonly conciliacaoId: number;
  readonly itemId?: number;
}

export function OcorrenciaBreadcrumb({
  conciliacaoId,
}: Readonly<OcorrenciaBreadcrumbProps>) {
  return (
    <AppBreadcrumb
      items={[
        { label: 'Inventário', icon: ListOrdered },
        { label: 'Gerenciamento de Conciliações', to: '/conciliacoes' },
        {
          label: 'Detalhes da Conciliação',
          to: `/conciliacoes/${conciliacaoId}`,
        },
        { label: 'Registrar Ocorrência', isActive: true },
      ]}
    />
  );
}
