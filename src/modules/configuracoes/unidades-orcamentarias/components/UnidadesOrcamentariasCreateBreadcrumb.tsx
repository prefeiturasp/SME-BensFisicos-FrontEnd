import { Settings } from 'lucide-react';
import { AppBreadcrumb } from '@/components/AppBreadcrumb';

export function UnidadesOrcamentariasCreateBreadcrumb() {
  return (
    <AppBreadcrumb
      items={[
        { label: 'Configurações', icon: Settings },
        { label: 'Unidades Orçamentárias', to: '/unidades-orcamentarias' },
        { label: 'Adicionar Unidade Orçamentária', isActive: true },
      ]}
    />
  );
}