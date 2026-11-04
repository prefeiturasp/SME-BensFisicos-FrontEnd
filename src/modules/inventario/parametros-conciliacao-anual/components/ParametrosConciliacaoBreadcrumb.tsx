import { ListOrdered } from 'lucide-react';
import { AppBreadcrumb } from '@/components/AppBreadcrumb';

interface Props {
  current?: string;
}

export function ParametrosConciliacaoBreadcrumb({ current }: Readonly<Props>) {
  return (
    <AppBreadcrumb
      items={[
        { label: 'Inventário', icon: ListOrdered },
        { label: 'Parâmetros de Conciliação Anual', to: current ? '/parametros-conciliacao-anual' : undefined, isActive: !current },
        ...(current ? [{ label: current, isActive: true }] : []),
      ]}
    />
  );
}
