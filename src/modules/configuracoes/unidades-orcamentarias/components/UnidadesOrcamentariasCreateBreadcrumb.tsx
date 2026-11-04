import { Landmark } from 'lucide-react';
import { AppBreadcrumb } from '@/components/AppBreadcrumb';

export function UnidadesOrcamentariasCreateBreadcrumb() {
  return (
    <AppBreadcrumb
      items={[
        { label: 'Unidades Orçamentárias', icon: Landmark, to: '/unidades-orcamentarias' },
        { label: 'Adicionar Unidade Orçamentária', isActive: true },
      ]}
    />
  );
}